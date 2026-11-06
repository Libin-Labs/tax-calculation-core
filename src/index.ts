export type TaxMode = 'exclusive' | 'inclusive';
export type TaxRounding = 'half-up' | 'down';

export interface TaxComponent {
  id: string;
  label: string;
  rateBps: number;
  baseMinor: bigint;
}

export interface TaxInput {
  currency: string;
  mode: TaxMode;
  amountMinor: bigint;
  components: readonly TaxComponent[];
  rounding?: TaxRounding;
}

export interface TaxBreakdown {
  id: string;
  label: string;
  rateBps: number;
  baseMinor: bigint;
  taxMinor: bigint;
}

export interface TaxResult {
  currency: string;
  mode: TaxMode;
  amountMinor: bigint;
  taxMinor: bigint;
  totalMinor: bigint;
  components: readonly TaxBreakdown[];
}

function nonnegativeBigint(value: bigint, name: string): void {
  if (typeof value !== 'bigint' || value < 0n) {
    throw new TypeError(`${name} must be a non-negative bigint minor-unit amount.`);
  }
  if (value.toString().length > 1000) throw new RangeError(`${name} exceeds 1000 digits.`);
}

function roundedTax(numerator: bigint, denominator: bigint, rounding: TaxRounding): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return rounding === 'half-up' && remainder * 2n >= denominator ? quotient + 1n : quotient;
}

export function calculateTax(input: TaxInput): TaxResult {
  if (!input || typeof input !== 'object') throw new TypeError('Expected a tax input.');
  if (!/^[A-Z][A-Z0-9]{2,11}$/.test(input.currency)) {
    throw new TypeError('Currency must be an uppercase identifier of 3 to 12 characters.');
  }
  if (input.mode !== 'exclusive' && input.mode !== 'inclusive') {
    throw new TypeError('Tax mode must be exclusive or inclusive.');
  }
  nonnegativeBigint(input.amountMinor, 'Amount');
  if (!Array.isArray(input.components) || input.components.length > 1000) {
    throw new RangeError('Components must be an array containing at most 1000 entries.');
  }
  const rounding = input.rounding ?? 'half-up';
  if (rounding !== 'half-up' && rounding !== 'down') {
    throw new TypeError('Rounding must be half-up or down.');
  }

  const ids = new Set<string>();
  let taxMinor = 0n;
  const components = input.components.map((component) => {
    if (!component || typeof component !== 'object') {
      throw new TypeError('Each tax component must be an object.');
    }
    if (
      typeof component.id !== 'string' ||
      component.id.length === 0 ||
      component.id.length > 128 ||
      ids.has(component.id)
    ) {
      throw new TypeError('Component IDs must be unique nonempty strings up to 128 characters.');
    }
    ids.add(component.id);
    if (typeof component.label !== 'string' || component.label.length > 256) {
      throw new TypeError(`Tax component ${component.id} needs a label up to 256 characters.`);
    }
    if (
      !Number.isSafeInteger(component.rateBps) ||
      component.rateBps < 0 ||
      component.rateBps > 1_000_000
    ) {
      throw new RangeError('Tax rates must be integer basis points from 0 to 1000000.');
    }
    nonnegativeBigint(component.baseMinor, `Tax base ${component.id}`);
    if (input.mode === 'inclusive' && component.baseMinor > input.amountMinor) {
      throw new RangeError(`Inclusive tax base ${component.id} may not exceed the gross amount.`);
    }
    const rate = BigInt(component.rateBps);
    const denominator = input.mode === 'inclusive' ? 10_000n + rate : 10_000n;
    const componentTax = roundedTax(component.baseMinor * rate, denominator, rounding);
    taxMinor += componentTax;
    return Object.freeze({
      id: component.id,
      label: component.label,
      rateBps: component.rateBps,
      baseMinor: component.baseMinor,
      taxMinor: componentTax,
    });
  });

  if (input.mode === 'inclusive' && taxMinor > input.amountMinor) {
    throw new RangeError('Calculated inclusive tax exceeds the gross amount.');
  }
  const totalMinor = input.mode === 'inclusive' ? input.amountMinor : input.amountMinor + taxMinor;
  if (taxMinor.toString().length > 1000 || totalMinor.toString().length > 1000) {
    throw new RangeError('Calculated amount exceeds 1000 digits.');
  }
  return Object.freeze({
    currency: input.currency,
    mode: input.mode,
    amountMinor: input.amountMinor,
    taxMinor,
    totalMinor,
    components: Object.freeze(components),
  });
}
