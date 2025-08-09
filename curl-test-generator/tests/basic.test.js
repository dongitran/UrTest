import { test } from 'node:test';
import assert from 'node:assert';

test('basic test', () => {
  assert.strictEqual(1 + 1, 2);
});

test('environment variables', () => {
  assert.ok(process.env.NODE_ENV !== undefined);
});
