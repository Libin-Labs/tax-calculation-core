# @lp-labs/tax-calculation-core

Perform tax arithmetic from jurisdiction policy supplied by your application. Rates, component
bases, labels and rounding are explicit inputs; this package has no jurisdiction database or legal
assumptions. **It provides calculation primitives, not tax advice.** Zero runtime and peer
dependencies; ESM, CommonJS and TypeScript declarations are included.

## Install

```sh
npm install @lp-labs/tax-calculation-core
```

Requires Node.js 18+ or an ESM-aware bundler with `bigint` support. CommonJS:
`const { calculateTax } = require('@lp-labs/tax-calculation-core')`.

## Quickstart

```js
import { calculateTax } from '@lp-labs/tax-calculation-core';

const result = calculateTax({
  currency: 'USD',
  mode: 'exclusive',
  amountMinor: 10000n,
  components: [
    { id: 'regional', label: 'Application-provided policy', rateBps: 725, baseMinor: 10000n },
  ],
  rounding: 'half-up',
});
console.log(result.taxMinor); // 725n
console.log(result.totalMinor); // 10725n
```

## Public API

Runtime export: `calculateTax(input: TaxInput): TaxResult`.

Type exports: `TaxMode`, `TaxRounding`, `TaxComponent`, `TaxInput`, `TaxBreakdown`, `TaxResult`.

`TaxInput` has currency, `mode` (`exclusive` or `inclusive`), non-negative integer
`amountMinor: bigint`, and caller-defined components. Each `TaxComponent` has a unique `id`,
display `label`, integer `rateBps` (basis points), and explicit `baseMinor`. In exclusive mode,
the component tax is rounded from `baseMinor * rateBps / 10000`; the amount is pre-tax and the
result total is amount plus all component taxes. In inclusive mode, `baseMinor` is that component's
gross taxable basis and tax is extracted using `baseMinor * rateBps / (10000 + rateBps)`; the
returned total remains the supplied gross amount. Inclusive bases cannot exceed that amount, and
the sum of extracted taxes cannot exceed it.

Use `half-up` rounding (default) or `down` (toward zero). Each component is rounded independently.
The result includes the policy inputs needed to explain each component's base and calculated tax;
results and breakdowns are frozen.

## Customization and limits

Supply the correct rules, effective dates, exemptions, stacking behavior, allocation bases and
rounding required by your own reviewed jurisdiction policy. The core deliberately does not choose
any of them. For compound taxes, calculate and pass each component's applicable base yourself.
This package does not determine taxability, nexus, filing obligations, compliance, or legal
interpretation and must not be treated as tax advice.

Rates are integer basis points from 0 to 1,000,000. At most 1,000 components are accepted;
amounts and calculated results are limited to 1000 digits. Currency is an uppercase 3–12 character
identifier, not an ISO registry lookup. Inputs that exceed limits or contain duplicate IDs,
invalid bases, modes or rounding policies throw. `bigint` is not JSON-native; serialize amounts as
decimal strings at application boundaries.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
