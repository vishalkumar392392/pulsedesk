import { baseApi } from "../api/baseApi";

export const assetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query({
      query: () => "assets",
    }),
  }),
});

export const { useGetAssetsQuery } = assetApi;
