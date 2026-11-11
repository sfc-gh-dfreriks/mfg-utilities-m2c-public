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

export default function PaymentCollection() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('payment-collection', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <SapStrip items={[['FP05', 'payment lots'], ['FPCJ', 'cash journal'], ['FP08 / FPE3', 'clearing / clarification'], ['FPB7', 'payment run (AutoPay direct debit)']]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Auto Cash Application" value={pct(k.autoCash)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta={`leading ≥ 90% · avg posting lag ${days(k.postingLag)}`} deltaType={k.autoCash >= 90 ? 'positive' : 'negative'} />
          <MetricCard title="Invoice → Payment" value={days(k.i2p)} icon={Calendar} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`${pct(k.onTime)} paid by due date`} deltaType="neutral" />
          <MetricCard title="DSO" value={days(k.dso)} icon={CreditCard} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta="avg daily AR / avg daily billing (91 d)" deltaType="neutral" />
          <MetricCard title="Unposted Remittances" value={formatDollar(k.unpostedAmount)} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta={`${formatNumber(k.unposted)} gateway remittances not in FI-CA (territory filter only)`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Payment Channel Mix" subtitle="Payments posted; digital wallets by brand">
            <BarChart rows={data?.byChannel ?? []} horizontal leftPad={120} keepOrder={false} height={300} fmt={formatNumber as any} series={[{ key: 'payments', name: 'Payments', color: COLORS.north }]} />
          </ChartCard>
          <ChartCard title="DSO by Payer Channel" subtitle="Accounts by their usual payment channel, months from Jan 2025">
            <BarChart rows={data?.dsoByChannel ?? []} horizontal leftPad={120} keepOrder={false} height={300} fmt={(v) => `${Number(v).toFixed(1)} d`} series={[{ key: 'dso', name: 'DSO', color: COLORS.navy }]} />
          </ChartCard>
          <ChartCard title="Invoice-to-Payment and Auto Cash Application by Channel" className="lg:col-span-2">
            <DataTable data={data?.byChannel ?? []} columns={[{ key: 'name', label: 'Channel' }, { key: 'grp', label: 'Group', format: titleCase }, { key: 'payments', label: 'Payments', format: formatNumber },
              { key: 'amount', label: 'Amount', format: formatDollar }, { key: 'i2p', label: 'Invoice → payment', format: days }, { key: 'onTime', label: 'On time', format: pct }, { key: 'autoCash', label: 'Auto cash', format: pct }]} />
          </ChartCard>
          <ChartCard title="Auto Cash Application by Gateway" subtitle="Lowest first; lockbox and aggregator files need manual clarification">
            <BarChart rows={data?.byGateway ?? []} horizontal leftPad={150} height={280} fmt={pctFmt} series={[{ key: 'autoCash', name: 'Auto cash %', color: COLORS.good }]} />
          </ChartCard>
          <ChartCard title="Digital Share and Auto Cash by Month" subtitle="Payment receipt month">
            <LineChart rows={data?.mixTrend ?? []} height={280} fmt={pctFmt} series={[{ key: 'digital', name: 'Digital / automated %', color: COLORS.north }, { key: 'autoCash', name: 'Auto cash %', color: COLORS.good }]} />
          </ChartCard>
          <ChartCard title="Unposted Gateway Remittances by Channel" className="lg:col-span-2" subtitle="Received by the payments gateway, no FI-CA payment lot item yet (territory filter only)">
            <BarChart rows={data?.unposted ?? []} height={240} fmt={formatDollar as any} keepOrder={false} series={[{ key: 'amount', name: 'Amount', color: COLORS.south }]} />
          </ChartCard>
        </div>
        <Lever title="digital self-service, AutoPay and wallets">AutoPay and wallet payers carry a DSO well below lockbox payers and are matched automatically;
          every account moved off paper checks shortens DSO and removes a manual FP08 clarification.</Lever>
      </div>
    </PageState>
  );
}
