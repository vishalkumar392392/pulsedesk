import type { Ticket } from "../../types/ticket";
import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

export interface TicketCreationRequest {
  title: string;
  category: string;
  priority: string;
  description: string;
  affectedAssetIds: number[];
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  sort?: string | null;
  direction?: string | null;
}

export interface TicketsResponse {
  content: Ticket[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query({
      query: () => "tickets",
    }),
    getUserTickets: builder.query<TicketsResponse, GetUsersParams>({
      query: ({
        page = 0,
        pageSize = 25,
        status = "",
        priority = "",
        sort,
        direction,
      }) => {
        status = status === "All" ? "" : status;
        priority = priority === "All" ? "" : priority;
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("size", String(pageSize));
        if (priority) params.set("priority", priority);
        if (status) params.set("status", status);
        if (sort) params.set("sort", sort);
        if (direction) params.set("direction", direction);
        return `/ticket/mine?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<TicketsResponse>) =>
        response.data,
      providesTags: ["Tickets"],
    }),
    createTicket: builder.mutation<ApiResponse<unknown>, TicketCreationRequest>(
      {
        query: (ticket) => ({
          url: "ticket/create",
          method: "POST",
          body: ticket,
        }),
      },
    ),
  }),
});

export const {
  useGetTicketsQuery,
  useGetUserTicketsQuery,
  useCreateTicketMutation,
} = ticketApi;
