import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, createPrompt, getPrompt, updatePrompt, listPrompts, softDeletePrompt } from './index';



describe('DB CRUD', () => {
  it('creates and reads a prompt', async () => {
    // Debug DB open state
    // @ts-ignore
    console.log('DB open?', db && (db as any).isOpen && (db as any).isOpen());
    const p = await createPrompt({ title: 'T1', body: 'B1', tags: [], favorite: false });
    const got = await getPrompt(p.id);
    expect(got).toBeTruthy();
    expect(got?.title).toBe('T1');
  });

  it('updates a prompt', async () => {
    const p = await createPrompt({ title: 'T2', body: 'B2', tags: [], favorite: false });
    await updatePrompt(p.id, { title: 'T2-updated' });
    const got = await getPrompt(p.id);
    expect(got?.title).toBe('T2-updated');
  });

  it('soft deletes a prompt', async () => {
    const p = await createPrompt({ title: 'T3', body: 'B3', tags: [], favorite: false });
    await softDeletePrompt(p.id);
    const listed = await listPrompts();
    expect(listed.find(x => x.id === p.id)).toBeUndefined();
    const got = await getPrompt(p.id);
    expect(got?.deleted).toBe(true);
  });
});