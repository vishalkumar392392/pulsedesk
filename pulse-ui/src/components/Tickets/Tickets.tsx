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
        <span
          className={`${statusStyle(ticket.status)} max-lg:whitespace-nowrap`}
        >
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
        <span className="px-2 py-1 text-sm max-lg:whitespace-nowrap">
          {ticket.createdAt}
        </span>
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
      <div className="grid grid-cols-2 gap-3 lg:block">
        <TicketStatusDropdown setPage={setPage} setStatus={setStatus} />
        <TicketPriorityDropdown setPage={setPage} setPriority={setPriority} />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/tickets/create")}
          className="bg-pulse-green disabled:bg-pulse-green mt-9 cursor-pointer rounded px-2 py-1 text-white max-lg:mt-4 max-lg:rounded-lg max-lg:px-4 max-lg:py-2.5 max-lg:font-semibold max-sm:w-full"
        >
          + New Ticket
        </button>
      </div>
      <br className="max-lg:hidden" />
      <div className="h-4 lg:hidden" />
      <DataGrid
        columns={visibleColumns}
        data={tickets}
        totalElements={data?.totalElements}
        rowKey="id"
        onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
        onSortChange={setSort}
        renderMobileCard={(ticket) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">
                  #{ticket.id} · {ticket.createdAt}
                </p>
                <p className="mt-1 line-clamp-2 font-medium text-gray-800">
                  {titleCase(ticket.title)}
                </p>
              </div>
              <span
                className={`${statusStyle(ticket.status)} shrink-0 text-xs!`}
              >
                {titleCase(ticket.status)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-gray-700">
                <span
                  className={`size-2 shrink-0 rounded-full ${priorityStyle(ticket.priority)}`}
                  aria-hidden="true"
                />
                {titleCase(ticket.priority)} priority
              </span>
              {!isEmployee &&
                (ticket.assigneeName ? (
                  <span className="bg-pulse-green-100 truncate rounded-4xl px-2 py-1 text-xs">
                    {formatName(ticket.assigneeName)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Unassigned</span>
                ))}
            </div>
          </>
        )}
        pagination={{
          page,
          totalPages: data?.totalPages,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </div>
  );
};
