import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_TIMEOUT_MS, parseDuration } from '../src/utils.js';

test('parseDuration unterstützt Minuten, Stunden und Tage', () => {
  assert.equal(parseDuration('10m'), 600_000);
  assert.equal(parseDuration('2h'), 7_200_000);
  assert.equal(parseDuration('28d'), MAX_TIMEOUT_MS);
});

test('parseDuration weist mehr als 28 Tage zurück', () => {
  assert.throws(() => parseDuration('29d'), /28 Tagen/);
});
