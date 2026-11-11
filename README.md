# Utilities Meter-to-Cash — public demo

A static, no-login build of the **Utilities Meter-to-Cash Intelligence** app (Oil, Gas & Energy use case 16 in
[`mfg-use-cases`](https://github.com/sfc-gh-dfreriks/mfg-use-cases)), built for GitHub Pages under
`/mfg-utilities-m2c-public/`.

**Business question:** where do we lose time and money between the meter and the bank?

Keystone Power, a fictional regional electric utility, runs two SAP IS-U / FI-CA instances: the Northern territory
(company 1000) and the Southern territory (company 2000), each readable as SAP ECC, S/4HANA, BW or SAP BDC. Next to SAP sit
an AMI head-end (15-minute intervals, tamper flags), weather (degree days), customer engagement (e-bill, SMS, portal, print
vendor) and a payments gateway (lockbox, aggregator, card, wallet, cash agent). dbt staging adapters, a canonical silver
layer and gold marts on Snowflake feed a semantic view, a Cortex Agent and this React app. All data is synthetic.

## The meter-to-cash cycle in seven stages

| # | Stage | What the page shows |
|---|---|---|
| 1 | Meter Reading | Read orders per MRU, read type (AMI, manual, self-read, estimated), failures, worst MRUs |
| 2 | Validation (VEE) | First pass, failing rules, manual exception queue, hours to resolve, winter dip |
| 3 | Rate Calculation | Flat, tiered and time-of-use tariffs, on-peak / shoulder / off-peak energy, fixed charges, tax |
| 4 | Bill Generation | Billing accuracy (reversals, re-bills), outsorting and its causes, BPEM cases, billed vs metered kWh |
| 5 | Bill Delivery | Paper, e-bill, SMS and portal mix; read-to-delivered days by channel and territory |
| 6 | Payment Collection | Channel mix, auto vs manual cash application by gateway, DSO by payer channel |
| 7 | Exceptions & Collections | Arrears aging, dunning, SMS reminders vs disconnect notices, arrangements, write-offs, tamper, churn risk |

The **Meter-to-Cash Cockpit** shows the seven stages as one flow with volumes and clean-completion rates, ten KPI tiles
against industry benchmarks, Northern vs Southern, and a friction panel ranking stages by gap to best-in-class.
**Cycle Times** breaks down read → bill → invoice → delivered and invoice → payment.

**Other pages:** Ask Cortex · Source Coverage · Data Sources · Field Mapping · SAP Metadata · Sources & Lineage (dbt) · Pipeline in 3D

## The ten KPIs in the snapshot (2024-10 to 2026-09)

| KPI | All | Northern | Southern | Benchmark |
|---|---|---|---|---|
| Meter read success | 97.0% | 98.8% | 94.9% | ≥ 97% |
| VEE first pass | 92.2% | 93.8% | 90.3% | 90-94% |
| Read → delivered bill | 9.9 d | 4.6 d | 16.3 d | 3-7 d best-in-class, 14-21 d legacy |
| Billing accuracy | 95.7% | 96.1% | 95.0% | > 95% |
| Exception rate | 7.9% | 6.2% | 9.9% | < 10% of bills |
| Invoice → payment | 26.9 d | 25.4 d | 28.9 d | ≤ 25 d |
| DSO | 30.9 d | 27.7 d | 35.5 d | 30-35 d |
| Auto cash application | 88.7% | 91.4% | 85.2% | ≥ 90% |
| Write-off rate | 0.79% | 0.78% | 0.80% | < 1% of billed |
| Arrangement breakage | 26.1% | 22.1% | 27.7% | 20-30% |

## How the public build works

- **Snapshot:** built with `VITE_STATIC=1`, the client reads pre-baked JSON in `public/data/` instead of a live `/api`.
  There is no Snowflake connection and no credentials. Source selection in the snapshot: SAP A = ECC, SAP B = S/4HANA,
  all non-SAP sources on.
- **Filters:** two territories (Northern, Southern) and two customer segments (Residential, C&I). Every territory
  selection is baked, plus all / one territory with one segment (9 views per page); `views.json` lists them.
- **Ask Cortex:** answers are pre-generated for each page's default analysis and every suggested question. Free-text
  questions need the full deployment.
- **Data Sources:** browse each source and preview its native tables. Apply (which runs dbt in Snowflake) is disabled.

## Data caveats

- All data is synthetic; Keystone Power is fictional. The SAP IS-U / FI-CA tables (EABLD, EABL, ERCH, DBERCHZ, ERDK,
  DFKKOP, DFKKZP, DFKKRP, EMMACASE and others) are simulated with representative names: the demo S/4HANA system does not
  carry the industry solutions, and SAP BDC has no IS-U data products (it supplies business partner and billing document only).
- DSO = average daily AR balance / (billed in the trailing 91 days / 91), pooled from January 2025 because the first
  three months have no complete 91-day billing window.
- Invoice → payment for the last months of the window is incomplete: bills not yet paid are not counted, so those months
  look faster than they are.
- Tamper flags exist only inside the AMI interval data window.

## Run locally

```bash
npm ci
VITE_STATIC=1 BASE_PATH=/mfg-utilities-m2c-public/ npx vite build
```

## Full deployment

For live queries, source switching and free-text Ask Cortex, deploy from the source repo:
```bash
git clone https://github.com/sfc-gh-dfreriks/mfg-use-cases
cd mfg-use-cases/use_cases/16_utilities_meter_to_cash
bash tools/build_local.sh
cd app && npm install && npm run dev   # http://localhost:5203 (API on 3026)
```
See [use_cases/16_utilities_meter_to_cash/README.md](https://github.com/sfc-gh-dfreriks/mfg-use-cases/blob/main/use_cases/16_utilities_meter_to_cash/README.md) for full setup instructions.
