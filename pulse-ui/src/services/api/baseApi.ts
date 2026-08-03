import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithLoader } from "./baseQuery";

export const baseApi = createApi({
  reducerPath: "pulseApi",

  baseQuery: baseQueryWithLoader,

  tagTypes: ["Users", "Tickets", "Assets", "Comments", "Auth"],

  endpoints: () => ({}),
});
