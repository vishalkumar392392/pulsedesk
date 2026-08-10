import type { User } from "../../types/user";
import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

export interface UsersResponse {
  content: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  role?: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, GetUsersParams>({
      query: ({ page = 0, pageSize = 25, role = "" }) => {
        role = role === "All" ? "" : role;
        return role
          ? `/user/all?page=${page}&size=${pageSize}&role=${role}`
          : `/user/all?page=${page}&size=${pageSize}`;
      },
      transformResponse: (response: ApiResponse<UsersResponse>) =>
        response.data,
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
