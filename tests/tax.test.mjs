import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTax } from '../dist/esm/index.js';

test('calculates exclusive tax on caller-supplied policy bases', () => {
  const result = calculateTax({
    currency: 'USD',
    mode: 'exclusive',
    amountMinor: 8250n,
    components: [{ id: 'local', label: 'Caller policy', rateBps: 825, baseMinor: 8250n }],
  });
  assert.equal(result.taxMinor, 681n);
  assert.equal(result.totalMinor, 8931n);
});

test('calculates inclusive tax as a portion of the gross amount', () => {
  const result = calculateTax({
    currency: 'USD',
    mode: 'inclusive',
    amountMinor: 11_000n,
    components: [{ id: 'vat', label: 'Example', rateBps: 1000, baseMinor: 11_000n }],
  });
  assert.equal(result.taxMinor, 1000n);
  assert.equal(result.totalMinor, 11_000n);
});

test('uses provided component bases independently', () => {
  const result = calculateTax({
    currency: 'USD',
    mode: 'exclusive',
    amountMinor: 1000n,
    components: [
      { id: 'a', label: 'A', rateBps: 1000, baseMinor: 500n },
      { id: 'b', label: 'B', rateBps: 2000, baseMinor: 250n },
    ],
  });
  assert.deepEqual(
    result.components.map((part) => part.taxMinor),
    [50n, 50n],
  );
  assert.equal(result.totalMinor, 1100n);
});

test('supports explicit rounding down', () => {
  const result = calculateTax({
    currency: 'USD',
    mode: 'exclusive',
    amountMinor: 1n,
    rounding: 'down',
    components: [{ id: 'half', label: '', rateBps: 5000, baseMinor: 1n }],
  });
  assert.equal(result.taxMinor, 0n);
});

test('zero rate produces zero tax', () => {
  const result = calculateTax({
    currency: 'USD',
    mode: 'exclusive',
    amountMinor: 100n,
    components: [{ id: 'zero', label: 'Zero', rateBps: 0, baseMinor: 100n }],
  });
  assert.equal(result.totalMinor, 100n);
});

test('does not invent a jurisdiction policy for an empty component list', () => {
  const result = calculateTax({
    currency: 'USD',
    mode: 'exclusive',
    amountMinor: 100n,
    components: [],
  });
  assert.equal(result.taxMinor, 0n);
});

test('returns immutable explainable components', () => {
  const result = calculateTax({
    currency: 'EUR',
    mode: 'exclusive',
    amountMinor: 100n,
    components: [{ id: 'x', label: 'X', rateBps: 100, baseMinor: 100n }],
  });
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.components[0]));
});

test('rejects duplicate component identifiers and invalid amounts', () => {
  assert.throws(
    () =>
      calculateTax({
        currency: 'USD',
        mode: 'exclusive',
        amountMinor: 100n,
        components: [
          { id: 'x', label: 'X', rateBps: 100, baseMinor: 100n },
          { id: 'x', label: 'Y', rateBps: 100, baseMinor: 100n },
        ],
      }),
    /unique/,
  );
  assert.throws(
    () =>
      calculateTax({
        currency: 'USD',
        mode: 'exclusive',
        amountMinor: -1n,
        components: [],
      }),
    TypeError,
  );
});

test('rejects unsupported rates, modes, and rounding', () => {
  assert.throws(
    () =>
      calculateTax({
        currency: 'USD',
        mode: 'exclusive',
        amountMinor: 100n,
        components: [{ id: 'x', label: 'X', rateBps: 1.5, baseMinor: 100n }],
      }),
    RangeError,
  );
  assert.throws(
    () =>
      calculateTax({
        currency: 'USD',
        mode: 'exclusive',
        amountMinor: 1n,
        components: [],
        rounding: 'ceil',
      }),
    TypeError,
  );
});

test('rejects inclusive component bases above gross and excessive results', () => {
  assert.throws(
    () =>
      calculateTax({
        currency: 'USD',
        mode: 'inclusive',
        amountMinor: 10n,
        components: [{ id: 'x', label: '', rateBps: 100, baseMinor: 11n }],
      }),
    RangeError,
  );
  assert.throws(
    () =>
      calculateTax({
        currency: 'USD',
        mode: 'exclusive',
        amountMinor: BigInt(`1${'0'.repeat(999)}`),
        components: [
          { id: 'large', label: '', rateBps: 1_000_000, baseMinor: BigInt(`1${'0'.repeat(999)}`) },
        ],
      }),
    /1000 digits/,
  );
});
