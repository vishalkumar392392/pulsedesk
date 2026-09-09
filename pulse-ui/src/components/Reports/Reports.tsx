import { useMemo, useState } from "react";
import { useGetTicketsQuery } from "../../services/tickets/ticketApi";
import { useGetUsersQuery } from "../../services/users/userApi";
import type { Ticket } from "../../types/ticket";
import { formatName } from "../../util/helper";
import { ReportBarCard, type ReportBarItem } from "./ReportBarCard";
import { ReportMetricCard } from "./ReportMetricCard";
import {
  ReportRangeSelector,
  type ReportRangeDays,
} from "./ReportRangeSelector";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const SLA_DAYS = 3;

const getTicketTimestamp = (ticket: Ticket, now: number) => {
  if (ticket.createdAtTimestamp) {
    const timestamp = new Date(ticket.createdAtTimestamp).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  const relativeTime = /^(\d+)\s*([dhm])(?:\s+ago)?$/i.exec(
    ticket.createdAt.trim(),
  );
  if (!relativeTime) return null;

  const amount = Number(relativeTime[1]);
  const unit = relativeTime[2].toLowerCase();
  const milliseconds =
    unit === "d"
      ? amount * DAY_IN_MILLISECONDS
      : unit === "h"
        ? amount * 60 * 60 * 1000
        : amount * 60 * 1000;

  return now - milliseconds;
};

const getResolvedTimestamp = (ticket: Ticket) => {
  if (!ticket.resolvedAt) return null;

  const timestamp = new Date(ticket.resolvedAt).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const Reports = () => {
  const [rangeDays, setRangeDays] = useState<ReportRangeDays>(30);
  const [reportTimestamp] = useState(() => Date.now());
  const { data: tickets = [] } = useGetTicketsQuery();
  const { data: users } = useGetUsersQuery({
    page: 0,
    pageSize: 100,
    role: "agent",
  });

  const report = useMemo(() => {
    const now = reportTimestamp;
    const rangeStart = now - rangeDays * DAY_IN_MILLISECONDS;
    const ticketsInRange = tickets.filter((ticket) => {
      const createdAt = getTicketTimestamp(ticket, now);
      return createdAt !== null && createdAt >= rangeStart && createdAt <= now;
    });

    const statusCounts = ticketsInRange.reduce(
      (counts, ticket) => {
        if (ticket.status === "OPEN") counts.open += 1;
        if (ticket.status === "IN_PROGRESS") counts.inProgress += 1;
        if (ticket.status === "RESOLVED") counts.resolved += 1;
        return counts;
      },
      { open: 0, inProgress: 0, resolved: 0 },
    );

    const agentNames = new Map(
      (users?.content ?? []).map((user) => [String(user.id), user.name]),
    );
    const resolvedByAgent = new Map<string, number>();
    const resolutionDurations: number[] = [];
    let slaBreaches = 0;

    ticketsInRange.forEach((ticket) => {
      const createdAt = getTicketTimestamp(ticket, now);
      if (createdAt === null) return;

      const resolvedAt = getResolvedTimestamp(ticket);
      const lifecycleEnd = resolvedAt ?? now;
      const lifecycleDays = Math.max(
        0,
        (lifecycleEnd - createdAt) / DAY_IN_MILLISECONDS,
      );

      if (lifecycleDays > SLA_DAYS) slaBreaches += 1;
    });

    tickets.forEach((ticket) => {
      const createdAt = getTicketTimestamp(ticket, now);
      const resolvedAt = getResolvedTimestamp(ticket);

      if (
        createdAt === null ||
        resolvedAt === null ||
        resolvedAt < rangeStart ||
        resolvedAt > now
      ) {
        return;
      }

      resolutionDurations.push(
        Math.max(0, (resolvedAt - createdAt) / DAY_IN_MILLISECONDS),
      );

      if (ticket.assigneeId) {
        resolvedByAgent.set(
          ticket.assigneeId,
          (resolvedByAgent.get(ticket.assigneeId) ?? 0) + 1,
        );
      }
    });

    const averageResolutionDays =
      resolutionDurations.length === 0
        ? 0
        : resolutionDurations.reduce((sum, duration) => sum + duration, 0) /
          resolutionDurations.length;

    const statusItems: ReportBarItem[] = [
      {
        label: "Open",
        value: statusCounts.open,
        barClassName: "bg-blue-700",
      },
      {
        label: "In progress",
        value: statusCounts.inProgress,
        barClassName: "bg-amber-600",
      },
      {
        label: "Resolved",
        value: statusCounts.resolved,
        barClassName: "bg-emerald-700",
      },
    ];

    const agentItems: ReportBarItem[] = Array.from(resolvedByAgent.entries())
      .map(([agentId, value]) => {
        const agentName = agentNames.get(agentId);

        return {
          label: agentName ? formatName(agentName) : `Agent #${agentId}`,
          value,
          barClassName: "bg-blaze-haze-700",
        };
      })
      .sort((first, second) => second.value - first.value);

    return {
      agentItems,
      averageResolutionDays,
      slaBreaches,
      statusItems,
    };
  }, [rangeDays, reportTimestamp, tickets, users?.content]);

  return (
    <div className="pb-10">
      <div className="flex items-center gap-4">
        <h1 className="shrink-0 text-xl font-bold">Reports</h1>
        <ReportRangeSelector value={rangeDays} onChange={setRangeDays} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ReportBarCard
          title="Tickets by status"
          items={report.statusItems}
          maxBarWidth={60}
        />
        <ReportBarCard title="Resolved by agent" items={report.agentItems} />
      </div>

      <div className="mt-6 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <ReportMetricCard
          label="Avg. resolution time"
          value={`${report.averageResolutionDays.toFixed(1)}d`}
        />
        <ReportMetricCard
          label={`SLA breaches (${rangeDays}d)`}
          value={report.slaBreaches}
          valueClassName="text-red-700"
        />
      </div>
    </div>
  );
};
