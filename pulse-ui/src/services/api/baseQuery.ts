import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { showLoader, hideLoader } from "../../redux/loaderSlice";
import { showErrorModal } from "../../redux/errorSlice";
import { authStorage } from "../auth/authStorage";

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "statusCode" in value &&
    "message" in value &&
    "data" in value
  );
}

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8080/",
  prepareHeaders: (headers) => {
    const token = authStorage.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const baseQueryWithLoader: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  api.dispatch(showLoader()); // Before request

  // Only for testing

  if (import.meta.env.DEV) {
    await delay(500);
  }
  try {
    const result = await baseQuery(args, api, extraOptions);
    //          ↑
    // fetchBaseQuery() performs the actual HTTP request

    // if (result.data) {
    //   // Success response (2xx)
    //   const response = result.data as ApiResponse<unknown>;
    // }

    if (result.error) {
      const error = result.error as FetchBaseQueryError;
      if (
        error.status === 500 &&
        typeof error.data === "object" &&
        error.data !== null &&
        isApiResponse(error.data)
      ) {
        api.dispatch(
          showErrorModal({
            open: true,
            title: "Internal Server Error",
            message: error.data.message,
          }),
        );
      }
    }
    return result;
  } finally {
    api.dispatch(hideLoader()); // After request
  }
};
