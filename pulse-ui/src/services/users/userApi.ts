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
  sort?: string | null;
  direction?: string | null;
}

export interface UpdateUserRequest {
  id: number;
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  mobileNumber: string;
  pwd: string;
  role: User["role"];
}

export type CreatedUser = Pick<User, "id" | "name" | "email">;

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, GetUsersParams>({
      query: ({ page = 0, pageSize = 25, role = "", sort, direction }) => {
        role = role === "All" ? "" : role;
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("size", String(pageSize));
        if (role) params.set("role", role);
        if (sort) params.set("sort", sort);
        if (direction) params.set("direction", direction);
        return `/user/all?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<UsersResponse>) =>
        response.data,
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<CreatedUser, CreateUserRequest>({
      query: (user) => ({
        url: "/auth/register",
        method: "POST",
        body: user,
      }),
      transformResponse: (response: ApiResponse<CreatedUser>) => response.data,
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<ApiResponse<User>, UpdateUserRequest>({
      query: ({ id, ...user }) => ({
        url: `/user/${id}`,
        method: "PUT",
        body: user,
      }),
      invalidatesTags: ["Users"],
    }),
    updateProfile: builder.mutation<ApiResponse<User>, UpdateProfileRequest>({
      query: (profile) => ({
        url: "/user/me/profile",
        method: "PUT",
        body: profile,
      }),
      invalidatesTags: ["Users"],
    }),
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordRequest>({
      query: (passwords) => ({
        url: "/user/me/password",
        method: "PUT",
        body: passwords,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi;
