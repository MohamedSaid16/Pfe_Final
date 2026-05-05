import React from 'react';
import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { KpiCard } from '../../../design-system/components';

export default function KPICards({ stats }) {
  if (!stats?.kpis) return null;

  const { justifications, complaints } = stats.kpis;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-tertiary px-0.5">
        Activity Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Total Justifications"
          value={justifications?.total ?? 0}
          hint={`${justifications?.pending ?? 0} pending · ${justifications?.treated ?? 0} treated`}
          Icon={FileText}
          tone="brand"
          tooltip="Absence justifications you've submitted"
        />
        <KpiCard
          label="Treated Justifications"
          value={justifications?.treated ?? 0}
          hint="Reviewed and closed"
          Icon={CheckCircle}
          tone="success"
        />
        <KpiCard
          label="Pending Justifications"
          value={justifications?.pending ?? 0}
          hint="Awaiting review"
          Icon={Clock}
          tone="warning"
        />
        <KpiCard
          label="Total Requests"
          value={complaints?.total ?? 0}
          hint={`${complaints?.pending ?? 0} pending · ${complaints?.treated ?? 0} treated`}
          Icon={AlertCircle}
          tone="brand"
          tooltip="Reclamations you've filed"
        />
        <KpiCard
          label="Treated Requests"
          value={complaints?.treated ?? 0}
          hint="Resolved"
          Icon={CheckCircle}
          tone="success"
        />
        <KpiCard
          label="Pending Requests"
          value={complaints?.pending ?? 0}
          hint="Awaiting response"
          Icon={Clock}
          tone="danger"
        />
      </div>
    </section>
  );
}
