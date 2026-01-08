/**
 * Notion Sync Orchestrator
 * Pulls prompts from Notion database and merges into local cache
 */

import { Prompt, db, createPrompt, updatePrompt } from './db/index';
import { notionClient, NotionPage } from './notion-client';

interface SyncState {
  notionDatabaseId: string;
  notionToken: string;
  lastSyncAt?: number;
  lastSyncEditedTime?: string;
}

/**
 * Transform Notion page to local Prompt
 */
export function pageToPrompt(page: NotionPage, properties: Record<string, string>): Prompt | null {
  try {
    const props = page.properties;
    
    // Extract title from "Name" property (title type)
    const titleProp = props[properties.title || 'Name'];
    const title = titleProp?.title?.[0]?.plain_text || titleProp?.title?.[0]?.text?.content || 'Untitled';
    
    // Extract body from "Body" property (rich_text type)
    const bodyProp = props[properties.body || 'Body'];
    const body = bodyProp?.rich_text?.map((t: any) => t.plain_text || t.text?.content || '').join('') || '';
    
    // Extract tags from "Tags" property (multi_select type)
    const tagsProp = props[properties.tags || 'Tags'];
    const tags = tagsProp?.multi_select?.map((t: any) => t.name) || [];
    
    // Extract favorite from "Favorite" property (checkbox type)
    const favoriteProp = props[properties.favorite || 'Favorite'];
    const favorite = favoriteProp?.checkbox || false;
    
    // Use page ID as prompt ID
    return {
      id: page.id.replace(/-/g, ''),
      title,
      body,
      tags,
      favorite,
      createdAt: new Date(page.created_time).getTime(),
      updatedAt: new Date(page.last_edited_time).getTime(),
      usageCount: 0,
      deleted: false
    };
  } catch (err) {
    console.warn('[Sync] Failed to transform page:', err);
    return null;
  }
}

/**
 * Merge Notion pages into local database (last-write-wins)
 */
export async function mergePages(pages: NotionPage[], databasePropertyMap: Record<string, string>) {
  let merged = 0;
  
  for (const page of pages) {
    const prompt = pageToPrompt(page, databasePropertyMap);
    if (!prompt) continue;
    
    const existing = await db.prompts.get(prompt.id);
    
    if (!existing) {
      // New prompt
      await createPrompt(prompt);
      merged++;
    } else if (prompt.updatedAt > existing.updatedAt) {
      // Newer version from Notion
      await updatePrompt(prompt.id, prompt);
      merged++;
    }
  }
  
  return merged;
}

/**
 * Pull from Notion database with optional incremental filtering
 */
async function pullFromNotion(
  databaseId: string,
  token: string,
  databasePropertyMap: Record<string, string>,
  lastSyncEditedTime?: string
): Promise<{ merged: number; hasMore: boolean; nextCursor?: string }> {
  await notionClient.setToken(token);
  
  let totalMerged = 0;
  let hasMore = true;
  let cursor: string | undefined;
  
  while (hasMore) {
    try {
      const filter = lastSyncEditedTime
        ? {
            property: 'last_edited_time',
            date: { after: lastSyncEditedTime }
          }
        : undefined;
      
      const sorts = [
        { property: 'last_edited_time', direction: 'descending' as const }
      ];
      
      const response = await notionClient.queryDatabase(databaseId, filter, sorts, cursor);
      const merged = await mergePages(response.results, databasePropertyMap);
      totalMerged += merged;
      
      hasMore = response.has_more || false;
      cursor = response.next_cursor;
      
      console.log(`[Sync] Pulled ${response.results.length} pages, merged ${merged}`);
      
      // Avoid hammering API
      if (hasMore) await new Promise(r => setTimeout(r, 500));
      
    } catch (err) {
      console.error('[Sync] Pull error:', err);
      break;
    }
  }
  
  return { merged: totalMerged, hasMore, nextCursor: cursor };
}

/**
 * Initialize and run sync
 */
export async function syncWithNotion(syncState: SyncState, databasePropertyMap: Record<string, string>) {
  console.log('[Sync] Starting sync from Notion...');
  
  try {
    const result = await pullFromNotion(
      syncState.notionDatabaseId,
      syncState.notionToken,
      databasePropertyMap,
      syncState.lastSyncEditedTime
    );
    
    // Update sync state
    const now = Date.now();
    await db.meta.put({
      key: 'syncState',
      value: {
        ...syncState,
        lastSyncAt: now,
        lastSyncEditedTime: new Date().toISOString()
      }
    });
    
    console.log(`[Sync] Sync complete. Merged ${result.merged} prompts.`);
    return result;
  } catch (err) {
    console.error('[Sync] Sync failed:', err);
    throw err;
  }
}
