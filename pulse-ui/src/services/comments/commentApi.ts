import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";
import type { TicketComment } from "../../types/ticket";

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTicketComments: builder.query<TicketComment[], number>({
      query: (ticketId) => `/ticket/${ticketId}/comments`,
      transformResponse: (response: ApiResponse<TicketComment[]>) =>
        response.data,
      providesTags: ["Comments"],
    }),
    createTicketComment: builder.mutation<
      ApiResponse<null>,
      { ticketId: number; body: string }
    >({
      query: ({ ticketId, body }) => ({
        url: `/ticket/${ticketId}/comments`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: ["Comments"],
    }),
  }),
});

export const { useGetTicketCommentsQuery, useCreateTicketCommentMutation } =
  commentApi;
