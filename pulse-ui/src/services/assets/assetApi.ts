import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

export interface Asset {
  id: number;
  model: string;
  tag: string;
  type: string;
}

export const assetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<ApiResponse<Asset[]>, void>({
      query: () => "assets/mine",
      providesTags: ["Assets"],
    }),
  }),
});

export const { useGetAssetsQuery } = assetApi;
