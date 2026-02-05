// tests/unit/storage/LocalStorageBackend.test.ts

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LocalStorageBackend } from '../../../src/engine/storage/base/LocalStorageBackend';

describe('LocalStorageBackend', () => {
  let backend: LocalStorageBackend;

  beforeEach(() => {
    backend = new LocalStorageBackend('test_');
  });

  afterEach(() => {
    backend.clear();
  });

  it('should be available in test environment', () => {
    expect(backend.isAvailable()).toBe(true);
  });

  it('should store and retrieve data', async () => {
    const testData = { foo: 'bar', num: 42 };
    const setResult = await backend.set('test_key', testData);
    expect(setResult.success).toBe(true);

    const getResult = await backend.get<typeof testData>('test_key');
    expect(getResult.success).toBe(true);
    expect(getResult.data).toEqual(testData);
  });

  it('should return error for non-existent key', async () => {
    const result = await backend.get('non_existent');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Key not found');
  });

  it('should remove data', async () => {
    await backend.set('to_remove', { data: 'test' });
    const removeResult = await backend.remove('to_remove');
    expect(removeResult.success).toBe(true);

    const getResult = await backend.get('to_remove');
    expect(getResult.success).toBe(false);
  });

  it('should clear all prefixed keys', async () => {
    await backend.set('key1', 'data1');
    await backend.set('key2', 'data2');

    const clearResult = await backend.clear();
    expect(clearResult.success).toBe(true);

    expect(await backend.get('key1')).toEqual({ success: false, error: 'Key not found' });
    expect(await backend.get('key2')).toEqual({ success: false, error: 'Key not found' });
  });

  it('should use prefix for keys', async () => {
    const backend1 = new LocalStorageBackend('prefix1_');
    const backend2 = new LocalStorageBackend('prefix2_');

    await backend1.set('same_key', 'value1');
    await backend2.set('same_key', 'value2');

    const result1 = await backend1.get('same_key');
    const result2 = await backend2.get('same_key');

    expect(result1.data).toBe('value1');
    expect(result2.data).toBe('value2');
  });
});
