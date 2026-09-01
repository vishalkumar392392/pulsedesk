import { useState } from "react";
import type { Ticket } from "../../types/ticket";
import { titleCase } from "../../util/helper";
import {
  DataGrid,
  type DataGridColumn,
  type SortState,
} from "../Util/DataGrid";
import { TicketStatusDropdown } from "./Dropdowns/TicketStatusDropdown";
import { TicketPriorityDropdown } from "./Dropdowns/TicketPriorityDropdown";
import { useGetUserTicketsQuery } from "../../services/tickets/ticketApi";
import { useNavigate } from "react-router";

export const Tickets = () => {
  const statusStyle = (status: string) => {
    const baseStyle =
      "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold";

    switch (status) {
      case "OPEN":
        return `${baseStyle} bg-blue-50 text-blue-700`;
      case "IN_PROGRESS":
        return `${baseStyle} bg-amber-50 text-amber-700`;
      case "RESOLVED":
        return `${baseStyle} bg-emerald-50 text-emerald-700`;
      case "CLOSED":
        return `${baseStyle} border border-gray-300 bg-gray-50 text-gray-600`;
      default:
        return `${baseStyle} bg-gray-100 text-gray-700`;
    }
  };

  const priorityStyle = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-600";
      case "MEDIUM":
        return "bg-amber-600";
      case "LOW":
        return "bg-slate-600";
      default:
        return "bg-gray-400";
    }
  };

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
      key: "assigneeId",
      header: "ASSIGNEE",
      render: (ticket) => (
        <span className="bg-pulse-green-100 rounded-4xl px-2 py-1 text-sm">
          {ticket.assigneeId}
        </span>
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
          className={`bg-pulse-green disabled:bg-pulse-green mt-9 cursor-pointer rounded px-2 py-1 text-white`}
        >
          + New Ticket
        </button>
      </div>
      <br />
      <DataGrid
        columns={TICKET_COLUMNS}
        data={tickets}
        totalElements={data?.totalElements}
        rowKey="id"
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
