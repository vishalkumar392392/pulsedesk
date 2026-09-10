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

export default function Dashboard() {
  const [dashboardTimestamp] = useState(() => Date.now());
  const user: User | null = getStoredUser();
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";

  const { data } = useGetUserTicketsQuery({
    page: 0,
    pageSize: 1000,
    sort: "asc",
  });
  const overdueCount =
    data?.content.filter((ticket) =>
      isTicketOverdue(ticket, dashboardTimestamp),
    ).length ?? 0;

  return (
    <div>
      <div>
        <div className="text-pulse-green text-xl font-bold">
          Welcome back{firstName ? `, ${titleCase(firstName)}` : ""}
        </div>
        <div className="mt-2 text-gray-500">
          Here's what the team is working on today
        </div>
      </div>

      <div className="mt-8 flex justify-between gap-4">
        <div className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4">
          <div className="text-gray-600">OPEN</div>
          <div className="py-2 text-3xl font-light">{data?.totalElements}</div>
        </div>
        <div className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4">
          <div className="text-gray-600">ASSIGNED TO ME</div>
          <div className="py-2 text-3xl font-light text-green-600">
            {
              data?.content.filter((t) => t.assigneeId === String(user?.id))
                .length
            }
          </div>
        </div>
        <div
          className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4"
          title="Open or in-progress tickets older than 3 business days"
        >
          <div className="text-gray-600">OVERDUE</div>
          <div className="py-2 text-3xl font-light text-red-600">
            {overdueCount}
          </div>
        </div>
        <div className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4">
          <div className="text-gray-600">RESOLVED</div>
          <div className="py-2 text-3xl font-light">
            {data?.content.filter((t) => t.status === "RESOLVED").length}
          </div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="min-w-0 rounded-xl border border-gray-300 p-4">
          <div className="font-semibold text-gray-700">RECENT TICKETS</div>
          {data?.content.map((row) => {
            return (
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
                  {row.status}
                </span>
                <GoChevronRight
                  aria-hidden="true"
                  className="shrink-0 text-xl text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700"
                />
              </Link>
            );
          })}
          <div className="mt-4 flex justify-end">
            <Link
              to="/tickets"
              className="font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              View all tickets →
            </Link>
          </div>
        </div>
        <PriorityBreakdown tickets={data?.content ?? []} />
      </div>
    </div>
  );
}
