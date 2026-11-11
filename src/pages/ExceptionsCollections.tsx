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

export default function ExceptionsCollections() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('exceptions-collections', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <SapStrip items={[['FPVA', 'dunning proposal / activity run'], ['FPR1', 'installment plan'], ['FP04', 'write-off'], ['BPEM / EMMA', 'clarification cases'], ['FPCOLL', 'collection agency']]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Arrears" value={formatDollar(k.arrears)} icon={CurrencyIcon} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-white" delta={`${formatDollar(k.arrears90)} over 90 days · ${formatNumber(k.dunning3)} accounts at dunning 3+`} deltaType="negative" />
          <MetricCard title="Write-off Rate" value={k.writeOff == null ? '–' : `${Number(k.writeOff).toFixed(2)}%`} icon={TrendingDown} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta={`benchmark < 1% · ${formatDollar(k.writeOffAmount)} written off`} deltaType={k.writeOff < 1 ? 'positive' : 'negative'} />
          <MetricCard title="Arrangement Breakage" value={pct(k.breakage)} icon={Receipt} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta={`${formatNumber(k.arrCreated)} plans: ${formatNumber(k.arrCompleted)} completed, ${formatNumber(k.arrBroken)} broken, ${formatNumber(k.arrActive)} active`} deltaType="neutral" />
          <MetricCard title="BPEM Cases Open" value={formatNumber(k.bpemOpen)} icon={FileText} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta={`of ${formatNumber(k.bpemTotal)} · avg age ${days(k.bpemAge)}`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Arrears by Aging Bucket" subtitle="Open past-due FI-CA items, USD">
            <BarChart rows={data?.aging ?? []} height={260} fmt={formatDollar as any} series={[{ key: 'value', name: 'Arrears', color: COLORS.bad }]} />
          </ChartCard>
          <ChartCard title="Open Items by Dunning Level" subtitle="USD; level 3+ = final notice / disconnection">
            <BarChart rows={data?.dunning ?? []} height={260} fmt={formatDollar as any} series={[{ key: 'value', name: 'Open', color: COLORS.navy }]} />
          </ChartCard>
          <ChartCard title="Collection Notices: SMS Reminders vs Disconnect Notices" className="lg:col-span-2" subtitle="Notices by month (customer engagement platform) and write-off rate">
            <LineChart rows={data?.notices ?? []} height={300} series={[{ key: 'sms', name: 'SMS reminders', color: COLORS.good, type: 'bar', stack: 'n' },
              { key: 'other', name: 'Email / letter reminders', color: COLORS.slate, type: 'bar', stack: 'n' }, { key: 'disconnects', name: 'Disconnect notices', color: COLORS.bad, type: 'bar', stack: 'n' },
              { key: 'writeOff', name: 'Write-off %', color: COLORS.violet, y: 1 }]} />
          </ChartCard>
          <ChartCard title="Engagement, Breakage and Write-off by Territory">
            <DataTable data={data?.noticesByTerritory ?? []} columns={[{ key: 'name', label: 'Territory' }, { key: 'sms', label: 'SMS', format: formatNumber }, { key: 'other', label: 'Email / letter', format: formatNumber },
              { key: 'disconnects', label: 'Disconnect', format: formatNumber }, { key: 'breakage', label: 'Breakage', format: pct }, { key: 'writeOff', label: 'Write-off', format: (v: any) => (v == null ? '–' : `${Number(v).toFixed(2)}%`) }]} />
          </ChartCard>
          <ChartCard title="BPEM Cases by Category and Age" subtitle="Open cases by age bucket">
            <BarChart rows={data?.bpem ?? []} height={260} fmt={formatNumber as any} series={[{ key: 'b07', name: '0-7 d', color: COLORS.good, stack: 'a' }, { key: 'b830', name: '8-30 d', color: COLORS.north, stack: 'a' },
              { key: 'b3190', name: '31-90 d', color: COLORS.south, stack: 'a' }, { key: 'b90', name: '90+ d', color: COLORS.bad, stack: 'a' }]} />
          </ChartCard>
        </div>
        <Lever title="SMS engagement instead of cut-offs">Reminders by SMS before the due date resolve arrears without the cost of disconnect notices and field cut-offs;
          pairing them with a realistic installment plan (FPR1) reduces breakage and keeps write-offs under 1%.</Lever>

        <h2 className="pt-2 text-lg font-bold text-sf-deeper">Theft & Tamper (AMI)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Tampered Smart Meters" value={formatNumber(data?.tamper?.kpis?.devices)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-white" delta={`${formatNumber(data?.tamper?.kpis?.flags)} tamper flags`} deltaType="negative" />
          <MetricCard title="Estimated Loss" value={`${formatNumber(data?.tamper?.kpis?.lossKwh)} kWh`} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta={`avg ${days(data?.tamper?.kpis?.days)} flagged`} deltaType="negative" />
          <MetricCard title="High Churn-Risk Contracts" value={formatNumber(data?.churn?.kpis?.highRisk)} icon={Users} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta={`${pct(data?.churn?.kpis?.highRiskPct)} of ${formatNumber(data?.churn?.kpis?.contracts)} · dunning level 3+`} deltaType="negative" />
          <MetricCard title="Arrears on High-Risk Contracts" value={formatDollar(data?.churn?.kpis?.highRiskArrears)} icon={CurrencyIcon} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`${formatNumber(data?.churn?.kpis?.moveOuts)} upcoming move-outs`} deltaType="neutral" />
        </div>
        <ChartCard title="Tampered Meters" subtitle="AMI tamper flags with estimated loss, largest first">
          <DataTable data={data?.tamper?.devices ?? []} columns={[{ key: 'device', label: 'Device' }, { key: 'territory', label: 'Territory' }, { key: 'region', label: 'Region' }, { key: 'rate', label: 'Rate' },
            { key: 'firstFlag', label: 'First flag' }, { key: 'flags', label: 'Flags', format: formatNumber }, { key: 'voltage', label: 'Avg voltage', format: (v: any) => (v == null ? '–' : Number(v).toFixed(1)) },
            { key: 'lossKwh', label: 'Est. loss kWh', format: formatNumber }, { key: 'status', label: 'Status', format: titleCase }]} />
        </ChartCard>
        <h2 className="pt-2 text-lg font-bold text-sf-deeper">Churn Risk</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Contracts by Churn Risk Score" subtitle="Score 0-100: missed payments, dunning, falling consumption, move-out">
            <BarChart rows={data?.churn?.bands ?? []} height={260} fmt={formatNumber as any} series={[{ key: 'northern', name: 'Northern', color: COLORS.north, stack: 'c' }, { key: 'southern', name: 'Southern', color: COLORS.south, stack: 'c' }]} />
          </ChartCard>
          <ChartCard title="Highest-Risk Contracts">
            <DataTable data={data?.churn?.top ?? []} columns={[{ key: 'contract', label: 'Contract' }, { key: 'territory', label: 'Territory' }, { key: 'rate', label: 'Rate' }, { key: 'missed', label: 'Missed', format: formatNumber },
              { key: 'dunning', label: 'Dunning', format: formatNumber }, { key: 'arrears', label: 'Arrears', format: formatDollar }, { key: 'score', label: 'Score', format: formatNumber }]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
