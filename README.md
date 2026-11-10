# Utilities Meter to Cash — public demo

A static, no-login build of the **Utilities Meter-to-Cash Intelligence** app (Oil, Gas & Energy use case 16 in
[`mfg-use-cases`](https://github.com/sfc-gh-dfreriks/mfg-use-cases)), built for GitHub Pages under
`/mfg-utilities-m2c-public/`.

**Business question:** where do we lose revenue between the meter and the bank, and which customers are about to churn
or default?

The app follows the meter-to-cash chain of Keystone Power, a fictional regional electric utility: premises, contracts and
devices, meter reads, billing and outsorted bills, FI-CA receivables and dunning, smart meter tamper flags and churn risk.
It reads two SAP IS-U instances (Northern territory and Southern territory), each as SAP ECC, S/4HANA, BW/4HANA or SAP BDC,
together with an AMI head-end / MDM (interval reads, voltage, tamper flags) and weather (degree days). The data flows through
dbt staging adapters, a canonical silver layer and gold marts on Snowflake, then to a semantic view, a Cortex Agent and this
React app. All data is synthetic.

**Pages:** Ask Cortex · Executive Dashboard · Revenue Assurance · Billing Exceptions & Estimated Reads ·
Collections & Arrears · Theft & Tamper · Churn Risk · Source Coverage · Data Sources · Field Mapping · SAP Metadata ·
Sources & Lineage (dbt) · Pipeline in 3D

## How the public build works

- **Snapshot:** built with `VITE_STATIC=1`, the client reads pre-baked JSON in `public/data/` instead of a live `/api`.
  There is no Snowflake connection and no credentials are required. Source selection in the snapshot: SAP A = ECC,
  SAP B = S/4HANA, AMI and weather on.
- **Filters:** two territories (Northern, Southern) and two customer divisions (Residential, C&I). Every combination the
  sidebar can produce is baked (9 views per page).
- **Ask Cortex:** answers are pre-generated for each page's default analysis and every suggested question. Free-text
  questions need the full deployment.
- **Data Sources:** browse each source type and preview its native tables. Apply (which runs dbt in Snowflake) is disabled.

## Data caveats

- All data is synthetic, and the SAP IS-U tables (EVBS, EANL, EVER, EGERH, EABL, ERCH, DFKKOP and others) are simulated:
  the demo S/4HANA system does not carry IS-U, and SAP BDC has no IS-U data products.
- Tamper flags exist only inside the AMI interval data window, not across the full billing history.
- ZIP-level detail is not carried past bronze; tamper and churn are shown by territory and region.
- The Field Mapping and SAP Metadata pages show the metadata layer as it was when the snapshot was taken; the field-level
  mapping (`CONFIG.FIELD_MAPPING`) was not built at that time, so Field Mapping shows its "not built yet" state.

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
cd app && npm install && npm run dev   # http://localhost:5203
```
See [use_cases/16_utilities_meter_to_cash/README.md](https://github.com/sfc-gh-dfreriks/mfg-use-cases/blob/main/use_cases/16_utilities_meter_to_cash/README.md) for full setup instructions.
