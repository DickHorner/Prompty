import Dexie, { Table } from 'dexie';

export interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastUsedAt?: number;
  deleted?: boolean;
}

export interface Meta {
  key: string;
  value: any;
}

class PromptDB extends Dexie {
  prompts!: Table<Prompt, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super('PromptManagerDB');
    this.version(1).stores({
      prompts: 'id, title, favorite, updatedAt, usageCount, deleted',
      meta: 'key'
    });
  }
}

export const db = new PromptDB();

// CRUD helpers
export async function createPrompt(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> & { id?: string }) {
  const now = Date.now();
  const prompt: Prompt = {
    id: data.id || crypto.randomUUID(),
    title: data.title,
    body: data.body,
    tags: data.tags || [],
    favorite: !!data.favorite,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
    lastUsedAt: undefined,
    deleted: false
  };

  await db.prompts.add(prompt);
  // Notify other contexts
  try {
    chrome.runtime.sendMessage?.({ type: 'DB_UPDATED' });
  } catch {}
  return prompt;
}

export async function updatePrompt(id: string, patch: Partial<Prompt>) {
  const now = Date.now();
  const existing = await db.prompts.get(id);
  if (!existing) throw new Error('Prompt not found');
  const updated: Prompt = { ...existing, ...patch, updatedAt: now };
  await db.prompts.put(updated);
  try {
    chrome.runtime.sendMessage?.({ type: 'DB_UPDATED' });
  } catch {}
  return updated;
}

export async function softDeletePrompt(id: string) {
  const prompt = await db.prompts.get(id);
  if (!prompt) return;
  prompt.deleted = true;
  prompt.updatedAt = Date.now();
  await db.prompts.put(prompt);
  try {
    chrome.runtime.sendMessage?.({ type: 'DB_UPDATED' });
  } catch {}
}

export async function getPrompt(id: string) {
  return db.prompts.get(id);
}

export async function listPrompts(opts?: { limit?: number; includeDeleted?: boolean }) {
  const limit = opts?.limit ?? 50;
  const includeDeleted = opts?.includeDeleted ?? false;
  let collection = db.prompts.orderBy('favorite').reverse();
  // favor favorites and recency: simple sort by favorite desc then updatedAt desc
  const all = await db.prompts.toArray();
  const filtered = all
    .filter((p) => includeDeleted || !p.deleted)
    .sort((a, b) => {
      if (a.favorite === b.favorite) return b.updatedAt - a.updatedAt;
      return (a.favorite ? 1 : 0) - (b.favorite ? 1 : 0);
    })
    .slice(0, limit);
  return filtered;
}

export async function searchPrompts(query: string, limit = 50) {
  const q = query.toLowerCase();
  const all = await db.prompts.toArray();
  return all
    .filter((p) => !p.deleted)
    .filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
    .slice(0, limit);
}

export async function incrementUsage(id: string) {
  const p = await db.prompts.get(id);
  if (!p) return;
  p.usageCount = (p.usageCount || 0) + 1;
  p.lastUsedAt = Date.now();
  p.updatedAt = Date.now();
  await db.prompts.put(p);
  try {
    chrome.runtime.sendMessage?.({ type: 'DB_UPDATED' });
  } catch {}
}
