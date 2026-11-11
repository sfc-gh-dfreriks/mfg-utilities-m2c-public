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

export default function Validation() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('validation', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <SapStrip items={[['EL31', 'monitor / validate meter reading results'], ['EA36', 'plausibility check'], ['BPEM / EMMA', 'clarification case for implausible reads']]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="VEE First Pass" value={pct(k.firstPass)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta="benchmark 90-94%" deltaType={k.firstPass >= 90 ? 'positive' : 'negative'} />
          <MetricCard title="Reads Validated" value={formatNumber(k.validated)} icon={FileText} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`${formatNumber(k.exceptions)} to the manual queue (${pct(k.exceptionPct)})`} deltaType="neutral" />
          <MetricCard title="Avg Hours to Resolve" value={k.resolveHours == null ? '–' : `${Number(k.resolveHours).toFixed(1)} h`} icon={Calendar} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta={`${formatNumber(k.openQueue)} still open`} deltaType="neutral" />
          <MetricCard title="Winter Effect" value={pct(k.winterFirstPass)} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta={`first pass Dec-Feb vs ${pct(k.otherFirstPass)} rest of year`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="VEE First-Pass Rate vs the 90-94% Benchmark" className="lg:col-span-2" subtitle="Billing period month; shaded band = benchmark">
            <LineChart rows={data?.trend ?? []} height={320} band={[90, 94, '90-94% benchmark']} yMin={80} yMax={100} fmt={pctFmt} series={[
              { key: 'firstPass', name: 'All', color: COLORS.navy }, { key: 'northern', name: 'Northern', color: COLORS.north }, { key: 'southern', name: 'Southern', color: COLORS.south }]} />
          </ChartCard>
          <ChartCard title="VEE Rule Failures" subtitle="Reads failing each validation rule (a read can fail several)">
            <BarChart rows={data?.rules ?? []} horizontal leftPad={140} keepOrder={false} series={[{ key: 'value', name: 'Reads', color: COLORS.bad }]} height={260} fmt={formatNumber as any} />
          </ChartCard>
          <ChartCard title="How Exceptions Are Resolved" subtitle="Manual queue outcome and avg hours to resolve">
            <DataTable data={data?.resolution ?? []} columns={[{ key: 'name', label: 'Resolution' }, { key: 'value', label: 'Reads', format: formatNumber },
              { key: 'hours', label: 'Avg hours', format: (v: any) => (v == null ? '–' : Number(v).toFixed(1)) }]} />
          </ChartCard>
          <ChartCard title="Exception Queue by Month" subtitle="Reads routed to the manual queue and hours to resolve">
            <LineChart rows={data?.queue ?? []} height={280} series={[{ key: 'exceptions', name: 'Exceptions', color: COLORS.violet, type: 'bar' }, { key: 'hours', name: 'Avg resolve hours', color: COLORS.bad, y: 1 }]} />
          </ChartCard>
          <ChartCard title="Winter Effect: First Pass by Calendar Month" subtitle="Dec / Jan / Feb shaded red">
            <BarChart rows={(data?.byCalMonth ?? []).map((r: any) => ({ ...r, w: r.winter ? r.firstPass : null, o: r.winter ? null : r.firstPass }))} height={280} fmt={pctFmt}
              series={[{ key: 'o', name: 'Other months', color: COLORS.north, stack: 'a' }, { key: 'w', name: 'Winter', color: COLORS.bad, stack: 'a' }]} />
          </ChartCard>
        </div>
        <Lever title="integrated validation">Estimated and manual reads fail VEE far more often than AMI reads; tuning rules per read type and auto-accepting low-risk
          deviations shortens the manual EL31 / BPEM queue before it delays billing.</Lever>
      </div>
    </PageState>
  );
}
