import type { User } from "../../types/user";
import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AuthTokens;
  errorRef: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type RefreshedTokens = Pick<AuthTokens, "accessToken" | "refreshToken">;

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    refreshSession: builder.mutation<RefreshedTokens, RefreshTokenRequest>({
      query: (request) => ({
        url: "auth/refreshToken",
        method: "POST",
        body: request,
      }),
      transformResponse: (response: ApiResponse<RefreshedTokens>) =>
        response.data,
    }),
  }),
});

export const { useLoginMutation, useRefreshSessionMutation } = authApi;
