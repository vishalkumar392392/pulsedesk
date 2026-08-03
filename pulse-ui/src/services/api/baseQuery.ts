import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { showLoader, hideLoader } from "../../redux/loaderSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8080/",
});
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const baseQueryWithLoader: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  api.dispatch(showLoader());

  // Only for testing

  if (import.meta.env.DEV) {
    await delay(500);
  }
  try {
    const result = await baseQuery(args, api, extraOptions);

    return result;
  } finally {
    api.dispatch(hideLoader());
  }
};
