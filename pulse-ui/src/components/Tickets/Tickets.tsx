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
      <TicketStatusDropdown setPage={setPage} setStatus={setStatus} />
      <TicketPriorityDropdown setPage={setPage} setPriority={setPriority} />
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/tickets/create")}
          className="bg-pulse-green disabled:bg-pulse-green mt-9 cursor-pointer rounded px-2 py-1 text-white"
        >
          + New Ticket
        </button>
      </div>
      <br />
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
  );
};
