import { useQuery } from '@/hooks/useQuery';
import { usePageDeps } from '@/hooks/useFilters';
import { fetchPage } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import MetricCard, { Building2, FileText, TrendingDown, Activity } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';
import { OBJECT_LABEL } from '@/pages/FieldMapping';

// Coverage does not depend on the sidebar filters, only on the source selection (dataVersion).
export default function SourceCoverage() {
  const { deps } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('source-coverage', [], []), [deps[2]]);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Canonical Objects" value={formatNumber(k.objects)} icon={Building2} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Premise, contract, device, read, bill, FI-CA, AMI" deltaType="neutral" />
          <MetricCard title="Object × Source Supplied" value={formatNumber(k.supplied)} icon={FileText} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Slot / system combinations with rows" deltaType="neutral" />
          <MetricCard title="Coverage Gaps" value={formatNumber(k.gaps)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta="Objects the selected SAP source cannot supply" deltaType={k.gaps ? 'negative' : 'neutral'} />
          <MetricCard title="Rows into Silver" value={formatNumber(k.rows)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Across all canonical objects" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Rows by Source System" subtitle="Canonical rows supplied">
            <Bars rows={data?.bySystem ?? []} label="name" value="value" color="#29b5e8" height={240} format={formatNumber} />
          </ChartCard>
          <ChartCard title="Gaps" subtitle="Why an object is missing for a source">
            <DataTable data={(data?.rows ?? []).filter((r: any) => r.status === 'GAP')} columns={[
              { key: 'object', label: 'Object', format: (v: any) => OBJECT_LABEL[v] ?? v }, { key: 'slot', label: 'Slot' }, { key: 'system', label: 'System' }, { key: 'reason', label: 'Reason' },
            ]} />
          </ChartCard>
          <ChartCard title="What Each Source Supplies" className="lg:col-span-2">
            <DataTable data={data?.rows ?? []} columns={[
              { key: 'object', label: 'Object', format: (v: any) => OBJECT_LABEL[v] ?? v }, { key: 'slot', label: 'Slot' }, { key: 'system', label: 'System' },
              { key: 'rowCount', label: 'Rows', format: formatNumber }, { key: 'status', label: 'Status' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
