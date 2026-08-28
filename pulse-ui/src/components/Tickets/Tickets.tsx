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

export const Tickets = () => {
  const TICKET_COLUMNS: DataGridColumn<Ticket>[] = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      render: (ticket) => titleCase(ticket.id + ""),
    },
    {
      key: "title",
      header: "TITLE",
      render: (ticket) => <span className="text-gray-500">{ticket.title}</span>,
    },
    {
      key: "status",
      header: "STATUS",
      render: (ticket) => (
        <span className="text-gray-500">{titleCase(ticket.status)}</span>
      ),
    },
    {
      key: "priority",
      header: "PRIORITY",
      render: (ticket) => (
        <span className="bg-pulse-green-100 rounded-4xl px-2 py-1 text-sm">
          {ticket.priority}
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
        <span className="bg-pulse-green-100 rounded-4xl px-2 py-1 text-sm">
          {ticket.createdAt}
        </span>
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

  return (
    <div>
      <TicketStatusDropdown setPage={setPage} setStatus={setStatus} />
      <TicketPriorityDropdown setPage={setPage} setPriority={setPriority} />
      <br />
      <DataGrid
        columns={TICKET_COLUMNS}
        data={tickets}
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
