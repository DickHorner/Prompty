// Vitest setup file
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Reset Dexie DB between tests if necessary
import { db } from '../db';

beforeEach(async () => {
  try {
    await db.prompts.clear();
    await db.meta.clear();
  } catch {}
});
