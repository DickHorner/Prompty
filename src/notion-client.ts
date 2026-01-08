/**
 * Notion API Client
 * Wrapper for Notion database queries with proper auth headers
 */

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
  archived?: boolean;
}

export interface NotionDatabase {
  id: string;
  title: Array<{ text?: { content: string } }>;
  properties: Record<string, any>;
}

class NotionClient {
  private token: string = '';
  private version = '2022-06-28';

  async setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, any>
  ): Promise<T> {
    if (!this.token) {
      throw new Error('Notion token not set');
    }

    const url = `https://api.notion.com/v1/${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'Notion-Version': this.version,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 429) {
      throw new Error('Notion API rate limited (429)');
    }
    if (response.status === 401) {
      throw new Error('Notion API unauthorized (401) - invalid or missing token');
    }
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async queryDatabase(
    databaseId: string,
    filter?: Record<string, any>,
    sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>,
    startCursor?: string
  ): Promise<{ results: NotionPage[]; next_cursor?: string; has_more: boolean }> {
    const body: Record<string, any> = {};
    if (filter) body.filter = filter;
    if (sorts) body.sorts = sorts;
    if (startCursor) body.start_cursor = startCursor;

    return this.request<any>(
      `databases/${databaseId}/query`,
      'POST',
      body
    );
  }

  async getPage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`pages/${pageId}`, 'GET');
  }

  async createPage(parentDatabaseId: string, properties: Record<string, any>): Promise<NotionPage> {
    return this.request<NotionPage>('pages', 'POST', {
      parent: { database_id: parentDatabaseId },
      properties
    });
  }

  async updatePage(pageId: string, properties: Record<string, any>): Promise<NotionPage> {
    return this.request<NotionPage>(`pages/${pageId}`, 'POST', {
      properties
    });
  }

  async archivePage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`pages/${pageId}`, 'POST', {
      archived: true
    });
  }
}

export const notionClient = new NotionClient();
