import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { User } from "../types/user";

export const pulseApi = createApi({
  reducerPath: "pulseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/",
  }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({ query: () => "users" }),
    getTickets: builder.query({ query: () => "tickets" }),
    getComments: builder.query({ query: () => "comments" }),
    getAssets: builder.query({ query: () => "assets" }),
    createUser: builder.mutation<User, User>({
      query: (user) => ({
        url: "users",
        method: "POST",
        body: user,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetTicketsQuery,
  useGetCommentsQuery,
  useGetAssetsQuery,
  useCreateUserMutation,
} = pulseApi;
