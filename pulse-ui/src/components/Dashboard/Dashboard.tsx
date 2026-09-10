import { useState } from "react";
import { GoChevronRight } from "react-icons/go";
import { Link } from "react-router";
import { useGetUserTicketsQuery } from "../../services/tickets/ticketApi";
import type { Ticket } from "../../types/ticket";
import type { User } from "../../types/user";
import {
  getStoredUser,
  priorityStyle,
  statusStyle,
  titleCase,
} from "../../util/helper";
import { normalizeRole } from "../../util/accessControl";
import { PriorityBreakdown } from "./PriorityBreakdown";

const SLA_BUSINESS_DAYS = 3;

const addBusinessDays = (timestamp: string, businessDays: number) => {
  const dueAt = new Date(timestamp);
  if (Number.isNaN(dueAt.getTime())) return null;

  let daysAdded = 0;
  while (daysAdded < businessDays) {
    dueAt.setDate(dueAt.getDate() + 1);
    const dayOfWeek = dueAt.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) daysAdded += 1;
  }

  return dueAt;
};

const isTicketOverdue = (ticket: Ticket, now: number) => {
  if (ticket.status !== "OPEN" && ticket.status !== "IN_PROGRESS") {
    return false;
  }
  if (!ticket.createdAtTimestamp) return false;

  const dueAt = addBusinessDays(ticket.createdAtTimestamp, SLA_BUSINESS_DAYS);
  return dueAt !== null && now > dueAt.getTime();
};

interface DashboardMetricProps {
  label: string;
  value: number;
  valueClassName?: string;
  title?: string;
}

const DashboardMetric = ({
  label,
  value,
  valueClassName = "",
  title,
}: DashboardMetricProps) => (
  <div
    className="rounded-xl border border-gray-300 px-4 pt-3 pb-4"
    title={title}
  >
    <div className="text-gray-600">{label}</div>
    <div className={`py-2 text-3xl font-light ${valueClassName}`}>{value}</div>
  </div>
);

export default function Dashboard() {
  const [dashboardTimestamp] = useState(() => Date.now());
  const user: User | null = getStoredUser();
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";
  const role = normalizeRole(user?.role);
  const isEmployee = role === "employee";
  const isAgent = role === "agent";

  const { data } = useGetUserTicketsQuery({
    page: 0,
    pageSize: 100,
    sort: "createdAt",
    direction: "desc",
  });
  const tickets = data?.content ?? [];
  const dashboardTickets = isAgent
    ? tickets.filter((ticket) => ticket.assigneeId === String(user?.id))
    : tickets;
  const openCount = dashboardTickets.filter(
    (ticket) => ticket.status === "OPEN",
  ).length;
  const inProgressCount = dashboardTickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = dashboardTickets.filter(
    (ticket) => ticket.status === "RESOLVED",
  ).length;
  const assignedToMeCount = dashboardTickets.filter(
    (ticket) => ticket.assigneeId === String(user?.id),
  ).length;
  const overdueCount = dashboardTickets.filter((ticket) =>
    isTicketOverdue(ticket, dashboardTimestamp),
  ).length;
  const recentTickets = dashboardTickets.slice(0, 6);
  const dashboardSubtitle = isEmployee
    ? "Track your support requests and their latest status"
    : isAgent
      ? "Here's what is assigned to you today"
      : "Here's what the team is working on today";
  const recentTicketsHeading = isEmployee
    ? "MY RECENT TICKETS"
    : isAgent
      ? "MY ASSIGNED TICKETS"
      : "RECENT TICKETS";
  const emptyTicketsMessage = isEmployee
    ? "You haven't created any support tickets yet."
    : isAgent
      ? "No tickets are currently assigned to you."
      : "No tickets are available.";
  const metrics: DashboardMetricProps[] = isEmployee
    ? [
        { label: "OPEN", value: openCount },
        {
          label: "IN PROGRESS",
          value: inProgressCount,
          valueClassName: "text-amber-600",
        },
        {
          label: "RESOLVED",
          value: resolvedCount,
          valueClassName: "text-green-600",
        },
        {
          label: "TOTAL REQUESTS",
          value: data?.totalElements ?? tickets.length,
        },
      ]
    : [
        { label: "OPEN", value: openCount },
        {
          label: "ASSIGNED TO ME",
          value: assignedToMeCount,
          valueClassName: "text-green-600",
        },
        {
          label: "OVERDUE",
          value: overdueCount,
          valueClassName: "text-red-600",
          title: "Open or in-progress tickets older than 3 business days",
        },
        { label: "RESOLVED", value: resolvedCount },
      ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-pulse-green text-xl font-bold">
            Welcome back{firstName ? `, ${titleCase(firstName)}` : ""}
          </div>
          <div className="mt-2 text-gray-500">{dashboardSubtitle}</div>
        </div>
        {isEmployee && (
          <Link
            to="/tickets/create"
            className="bg-pulse-green rounded-lg px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-800"
          >
            + New Ticket
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetric key={metric.label} {...metric} />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="min-w-0 rounded-xl border border-gray-300 p-4">
          <div className="font-semibold text-gray-700">
            {recentTicketsHeading}
          </div>
          {recentTickets.length > 0 ? (
            recentTickets.map((row) => (
              <Link
                key={row.id}
                to={`/tickets/${row.id}`}
                aria-label={`Open ticket ${row.id}: ${row.title}`}
                className="group my-1 flex items-center gap-5 rounded-lg border-b border-gray-300 px-2 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-700"
              >
                <span className="w-12 shrink-0 text-gray-500">#{row.id}</span>
                <span className="min-w-0 flex-1 truncate font-light">
                  {row.title}
                </span>
                <span className="inline-flex shrink-0 items-center gap-2">
                  <span
                    className={`size-2 shrink-0 rounded-full ${priorityStyle(row.priority)}`}
                    aria-hidden="true"
                  />
                  <span className="font-light text-gray-700">
                    {titleCase(row.priority)}
                  </span>
                </span>
                <span className={`${statusStyle(row.status)} shrink-0`}>
                  {titleCase(row.status)}
                </span>
                <GoChevronRight
                  aria-hidden="true"
                  className="shrink-0 text-xl text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700"
                />
              </Link>
            ))
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
              <p className="text-gray-500">
                {emptyTicketsMessage}
              </p>
              {isEmployee && (
                <Link
                  to="/tickets/create"
                  className="text-pulse-green mt-3 font-semibold hover:underline"
                >
                  Create your first ticket →
                </Link>
              )}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Link
              to="/tickets"
              className="font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              {isEmployee ? "View all my tickets" : "View all tickets"} →
            </Link>
          </div>
        </div>
        {isEmployee ? (
          <section className="h-full min-w-0 rounded-xl border border-gray-300 p-6">
            <h2 className="text-lg font-semibold tracking-wider text-gray-600">
              NEED SUPPORT?
            </h2>
            <p className="mt-5 leading-7 text-gray-600">
              Create a support ticket and follow its progress here. You will
              see only the requests created from your account.
            </p>
            <Link
              to="/tickets/create"
              className="bg-pulse-green mt-6 inline-flex rounded-lg px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-800"
            >
              + Create a ticket
            </Link>
          </section>
        ) : (
          <PriorityBreakdown tickets={dashboardTickets} />
        )}
      </div>
    </div>
  );
}
