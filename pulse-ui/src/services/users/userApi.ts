import type { User } from "../../types/user";
import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/user/all",
      transformResponse: (response: ApiResponse<User[]>) => response.data,
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<User, User>({
      query: (user) => ({
        url: "users",
        method: "POST",
        body: user,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation } = userApi;
