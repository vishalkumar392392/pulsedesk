import { useState } from "react";
import type { Ticket } from "../../types/ticket";
import {
  formatName,
  getStoredUser,
  priorityStyle,
  statusStyle,
  titleCase,
} from "../../util/helper";
import {
  DataGrid,
  type DataGridColumn,
  type SortState,
} from "../Util/DataGrid";
import { TicketStatusDropdown } from "./Dropdowns/TicketStatusDropdown";
import { TicketPriorityDropdown } from "./Dropdowns/TicketPriorityDropdown";
import { useGetUserTicketsQuery } from "../../services/tickets/ticketApi";
import { useNavigate } from "react-router";
import { normalizeRole } from "../../util/accessControl";

export const Tickets = () => {
  const isEmployee = normalizeRole(getStoredUser()?.role) === "employee";
  const TICKET_COLUMNS: DataGridColumn<Ticket>[] = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      render: (ticket) => ticket.id,
    },
    {
      key: "title",
      header: "TITLE",
      render: (ticket) => (
        <span className="text-gray-500">{titleCase(ticket.title)}</span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (ticket) => (
        <span className={statusStyle(ticket.status)}>
          {titleCase(ticket.status)}
        </span>
      ),
    },
    {
      key: "priority",
      header: "PRIORITY",
      sortable: true,
      render: (ticket) => (
        <span className="inline-flex items-center gap-2">
          <span
            className={`size-2 shrink-0 rounded-full ${priorityStyle(ticket.priority)}`}
            aria-hidden="true"
          />
          <span>{titleCase(ticket.priority)}</span>
        </span>
      ),
    },
    {
      key: "assigneeName",
      header: "ASSIGNEE",
      render: (ticket) =>
        ticket.assigneeName ? (
          <span className="bg-pulse-green-100 rounded-4xl px-2 py-1 text-sm">
            {formatName(ticket.assigneeName)}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Unassigned</span>
        ),
    },
    {
      key: "createdAt",
      header: "CREATED",
      render: (ticket) => (
        <span className="px-2 py-1 text-sm">{ticket.createdAt}</span>
      ),
    },
  ];
  const visibleColumns = isEmployee
    ? TICKET_COLUMNS.filter((column) => column.key !== "assigneeName")
    : TICKET_COLUMNS;

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState("10");
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const { data } = useGetUserTicketsQuery({
    page: page,
    pageSize: Number(pageSize),
    status: status,
    priority: priority,
    sort: sort.key,
    direction: sort.direction,
  });
  const tickets: Ticket[] = data?.content || [];
  const navigate = useNavigate();
  return (
    <div>
      {/* Filters row — stack on mobile, inline on md+ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <TicketStatusDropdown setPage={setPage} setStatus={setStatus} />
        <TicketPriorityDropdown setPage={setPage} setPriority={setPriority} />
        <div className="flex justify-end sm:ml-auto">
          <button
            onClick={() => navigate("/tickets/create")}
            className="bg-pulse-green disabled:bg-pulse-green cursor-pointer rounded px-3 py-2 text-sm text-white font-medium"
          >
            + New Ticket
          </button>
        </div>
      </div>

      <br />

      {/* Mobile card list — visible on < lg */}
      <div className="lg:hidden space-y-3">
        {tickets.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No tickets found.</p>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-gray-400">#{ticket.id}</span>
                  <p className="mt-0.5 truncate font-medium text-gray-800">
                    {titleCase(ticket.title)}
                  </p>
                </div>
                <span className={`shrink-0 ${statusStyle(ticket.status)}`}>
                  {titleCase(ticket.status)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${priorityStyle(ticket.priority)}`}
                    aria-hidden="true"
                  />
                  {titleCase(ticket.priority)}
                </span>
                {!isEmployee && ticket.assigneeName && (
                  <span className="bg-pulse-green-100 rounded-full px-2 py-0.5 text-xs">
                    {formatName(ticket.assigneeName)}
                  </span>
                )}
                <span className="text-xs text-gray-400">{ticket.createdAt}</span>
              </div>
            </div>
          ))
        )}
        {/* Mobile pagination */}
        {data && (data.totalElements ?? 0) >= 10 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">Page {page + 1} of {data?.totalPages}</span>
            <button
              disabled={page + 1 >= (data?.totalPages ?? 0)}
              onClick={() => setPage(page + 1)}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Desktop table — hidden on < lg */}
      <div className="hidden lg:block">
        <DataGrid
          columns={visibleColumns}
          data={tickets}
          totalElements={data?.totalElements}
          rowKey="id"
          onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
          onSortChange={setSort}
          pagination={{
            page,
            totalPages: data?.totalPages,
            pageSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>
    </div>
  );
};

