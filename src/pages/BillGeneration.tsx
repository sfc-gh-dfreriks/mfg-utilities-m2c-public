import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { Activity, Gauge, Calendar, CreditCard, Receipt, FileText, TrendingDown, Users, CurrencyIcon } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import PageState from '@/components/PageState';
import { SapStrip, Lever, LineChart, BarChart, COLORS, pctFmt, dayFmt, titleCase } from '@/components/M2C';

const days = (v: any) => (v == null ? '–' : `${Number(v).toFixed(1)} d`);
const pct = (v: any) => (v == null ? '–' : formatPct(Number(v)));
const kwh = (v: any) => (v == null ? '–' : `${(Number(v) / 1e6).toFixed(1)} GWh`);

export default function BillGeneration() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('bill-generation', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <SapStrip items={[['EASIBI', 'individual billing + invoicing'], ['EA38', 'mass billing'], ['EA26', 'mass create bill (invoicing)'], ['ES32', 'review billing documents / outsorting'], ['EA20', 'reverse billing document']]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Billing Accuracy" value={pct(k.accuracy)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta={`benchmark > 95% · ${formatNumber(k.reversed)} reversed, ${formatNumber(k.rebills)} re-bills`} deltaType={k.accuracy > 95 ? 'positive' : 'negative'} />
          <MetricCard title="Bills Outsorted" value={pct(k.outsortedPct)} icon={FileText} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta={`${formatNumber(k.outsorted)} bills · ${pct(k.outsortedEstimated)} on an estimated read`} deltaType="negative" />
          <MetricCard title="Bill-to-Invoice Lag" value={days(k.billToInvoice)} icon={Calendar} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`${formatNumber(k.openCases)} BPEM cases open · ${formatDollar(k.atRisk)} held`} deltaType="neutral" />
          <MetricCard title="Billed vs Metered kWh" value={pct(k.kwhGapPct)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta={`gap ${kwh(k.kwhGap)} of ${kwh(k.meteredKwh)} metered`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Billing Accuracy vs 95% and Outsorting by Month" className="lg:col-span-2" subtitle="Accuracy = original bills not reversed / original bills">
            <LineChart rows={data?.trend ?? []} height={320} band={[95, 100, '> 95% benchmark']} series={[{ key: 'accuracy', name: 'Billing accuracy %', color: COLORS.good }, { key: 'outsorted', name: 'Outsorted %', color: COLORS.bad, y: 1 }]} yMin={90} yMax={100} />
          </ChartCard>
          <ChartCard title="Accuracy and Outsorting by Tariff">
            <DataTable data={data?.byTariff ?? []} columns={[{ key: 'name', label: 'Tariff', format: titleCase }, { key: 'bills', label: 'Bills', format: formatNumber }, { key: 'accuracy', label: 'Accuracy', format: pct },
              { key: 'rebills', label: 'Re-bills', format: formatNumber }, { key: 'outsorted', label: 'Outsorted', format: pct }, { key: 'outsortedEstimated', label: 'of which est. read', format: pct }]} />
          </ChartCard>
          <ChartCard title="Billing Exceptions by Type and BPEM Status" subtitle="Outsorted bills (ES32) and their clarification case">
            <DataTable data={data?.excByType ?? []} columns={[{ key: 'name', label: 'Exception' }, { key: 'bills', label: 'Bills', format: formatNumber }, { key: 'value', label: 'Revenue held', format: formatDollar },
              { key: 'daysToRelease', label: 'Avg days to release', format: days }]} />
            <div className="mt-3"><BarChart rows={data?.excByStatus ?? []} horizontal leftPad={110} keepOrder={false} series={[{ key: 'value', name: 'Bills', color: COLORS.violet }]} height={150} fmt={formatNumber as any} /></div>
          </ChartCard>
          <ChartCard title="Revenue Assurance: Billed vs Metered kWh" className="lg:col-span-2" subtitle="AMI metered kWh vs billed kWh by bill month">
            <LineChart rows={data?.ra ?? []} height={300} fmt={kwh as any} series={[{ key: 'meteredKwh', name: 'Metered kWh', color: COLORS.slate, type: 'bar' }, { key: 'billedKwh', name: 'Billed kWh', color: COLORS.north }]} />
          </ChartCard>
          <ChartCard title="Top Billing Exceptions" className="lg:col-span-2" subtitle="Open BPEM cases first, then largest revenue held">
            <DataTable data={data?.top ?? []} columns={[{ key: 'doc', label: 'Billing doc' }, { key: 'account', label: 'Contract account' }, { key: 'territory', label: 'Territory' }, { key: 'rate', label: 'Rate' },
              { key: 'type', label: 'Exception' }, { key: 'created', label: 'Created' }, { key: 'bpem', label: 'BPEM case' }, { key: 'status', label: 'Status', format: titleCase }, { key: 'value', label: 'Held', format: formatDollar }]} />
          </ChartCard>
        </div>
        <Lever title="fewer estimated reads">Most outsorted bills sit on an estimated read. Every actual read that replaces an estimate removes an ES32 review and,
          later, a reversal and re-bill.</Lever>
      </div>
    </PageState>
  );
}
