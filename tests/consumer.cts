import { calculateTax, type TaxComponent } from '@lp-labs/tax-calculation-core';
const policy: TaxComponent[] = [{ id: 'manual', label: 'User', rateBps: 500, baseMinor: 1000n }];
const tax: bigint = calculateTax({
  currency: 'USD',
  mode: 'exclusive',
  amountMinor: 1000n,
  components: policy,
}).taxMinor;
void tax;
