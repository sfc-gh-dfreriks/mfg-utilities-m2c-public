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
import ReactECharts from '@/components/Chart';

export default function BillDelivery() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('bill-delivery', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <SapStrip items={[['EA29', 'print / output invoices (print documents)'], ['EA26', 'mass invoicing'], ['Engagement platform', 'e-bill, SMS, portal delivery outside SAP']]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Read → Delivered (median)" value={days(k.p50)} icon={Calendar} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`p90 ${days(k.p90)} · avg ${days(k.avgR2d)} · best-in-class 3-7 d`} deltaType={k.p50 <= 7 ? 'positive' : 'negative'} />
          <MetricCard title="Digital Delivery Share" value={pct(k.digitalShare)} icon={Activity} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta="e-bill email, SMS, portal" deltaType="neutral" />
          <MetricCard title="Bill → Delivered" value={days(k.billToDelivery)} icon={FileText} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta={`${formatNumber(k.invoices)} invoices`} deltaType="neutral" />
          <MetricCard title="Digital Opened / Bounced" value={pct(k.opened)} icon={Users} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta={`${pct(k.bounced)} bounced`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Delivery Channel Mix by Territory" subtitle="Invoices">
            <BarChart rows={(data?.mix ?? []).map((r: any) => ({ ...r, name: titleCase(r.name) }))} height={280} fmt={formatNumber as any} series={[{ key: 'northern', name: 'Northern', color: COLORS.north }, { key: 'southern', name: 'Southern', color: COLORS.south }]} />
          </ChartCard>
          <ChartCard title="Read-to-Delivery Distribution" subtitle="Days from read to delivered; green band 3-7 d best-in-class, amber 14-21 d legacy">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: (data?.histogram ?? []).map((r: any) => `${r.d}${r.d >= 30 ? '+' : ''} d`) }, yAxis: { type: 'value' },
              series: [
                { name: 'Northern', type: 'bar', stack: 'h', data: (data?.histogram ?? []).map((r: any) => r.northern), itemStyle: { color: COLORS.north },
                  markArea: { silent: true, data: [[{ xAxis: '3 d', itemStyle: { color: 'rgba(16,185,129,0.12)' } }, { xAxis: '7 d' }], [{ xAxis: '14 d', itemStyle: { color: 'rgba(245,158,11,0.12)' } }, { xAxis: '21 d' }]] } },
                { name: 'Southern', type: 'bar', stack: 'h', data: (data?.histogram ?? []).map((r: any) => r.southern), itemStyle: { color: COLORS.south } },
              ] }} style={{ height: 280 }} />
          </ChartCard>
          <ChartCard title="Read-to-Delivery p50 / p90 by Channel and Territory" className="lg:col-span-2" subtitle="Days; best-in-class 3-7 d, legacy 14-21 d">
            <BarChart rows={(data?.byChannel ?? []).map((r: any) => ({ ...r, name: `${titleCase(r.channel)} · ${r.territory}` }))} height={300} fmt={dayFmt}
              series={[{ key: 'p50', name: 'p50', color: COLORS.north }, { key: 'p90', name: 'p90', color: COLORS.navy }, { key: 'billToDelivery', name: 'Bill → delivered (avg)', color: COLORS.slate }]} />
          </ChartCard>
          <ChartCard title="Read-to-Delivery by Month" subtitle="Avg days; Northern vs Southern">
            <LineChart rows={data?.trend ?? []} height={280} band={[3, 7, '3-7 d best-in-class']} yMin={0} series={[{ key: 'northern', name: 'Northern', color: COLORS.north }, { key: 'southern', name: 'Southern', color: COLORS.south }, { key: 'digital', name: 'Digital share %', color: COLORS.good, y: 1 }]} />
          </ChartCard>
          <ChartCard title="Delivery Status by Channel" subtitle="Invoices">
            <BarChart rows={(data?.status ?? []).map((r: any) => ({ ...r, name: titleCase(r.name) }))} height={280} fmt={formatNumber as any} series={[
              { key: 'delivered', name: 'Delivered', color: COLORS.north, stack: 's' }, { key: 'opened', name: 'Opened', color: COLORS.good, stack: 's' },
              { key: 'bounced', name: 'Bounced', color: COLORS.bad, stack: 's' }, { key: 'inTransit', name: 'In transit', color: COLORS.slate, stack: 's' }]} />
          </ChartCard>
        </div>
        <Lever title="integrated digital delivery">Paper bills wait for the print vendor run and the mail; e-bill, SMS and portal delivery land the same day.
          Combined with AMI reads, that is the gap between the Northern 3-7 day window and the Southern 14-21 day legacy window.</Lever>
      </div>
    </PageState>
  );
}
