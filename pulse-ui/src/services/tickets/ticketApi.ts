import { baseApi } from "../api/baseApi";

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query({
      query: () => "tickets",
    }),
  }),
});

export const { useGetTicketsQuery } = ticketApi;
