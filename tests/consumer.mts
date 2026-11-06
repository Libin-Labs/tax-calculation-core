import { calculateTax, type TaxInput, type TaxResult } from '@lp-labs/tax-calculation-core';
const input: TaxInput = { currency: 'USD', mode: 'exclusive', amountMinor: 100n, components: [] };
const result: TaxResult = calculateTax(input);
const total: bigint = result.totalMinor;
void total;
