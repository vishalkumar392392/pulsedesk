import { baseApi } from "../api/baseApi";

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query({
      query: () => "comments",
    }),
  }),
});

export const { useGetCommentsQuery } = commentApi;
