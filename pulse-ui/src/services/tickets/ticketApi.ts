import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

export interface TicketCreationRequest {
  title: string;
  category: string;
  priority: string;
  description: string;
  affectedAssetIds: number[];
}

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query({
      query: () => "tickets",
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

export const { useGetTicketsQuery, useCreateTicketMutation } = ticketApi;
