import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

export interface Asset {
  id: number;
  model: string;
  tag: string;
  type: string;
  assignedToId?: number | null;
  assignedTo?: string | null;
  status?: string;
  purchasedAt?: string;
  coverageUntil?: string;
}

export interface AssetAssignee {
  id: number;
  name: string;
  email: string;
}

interface GetUsersParams {
  status?: string;
  type?: string;
}

export const assetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<ApiResponse<Asset[]>, void>({
      query: () => "assets/mine",
      providesTags: ["Assets"],
    }),
    getAllAssets: builder.query<Asset[], GetUsersParams>({
      query: ({ status = "", type = "" }) => {
        status = status === "All" ? "" : status;
        type = type === "All" ? "" : type;
        const params = new URLSearchParams();

        if (type) params.set("type", type);
        if (status) params.set("status", status.replaceAll(" ", "_"));
        return `/assets/all?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<Asset[]>) => response.data,
      providesTags: ["Assets"],
    }),
    getAssetAssignees: builder.query<AssetAssignee[], void>({
      query: () => "/assets/assignees",
      transformResponse: (response: ApiResponse<AssetAssignee[]>) =>
        response.data,
      providesTags: ["Users"],
    }),
    assignAsset: builder.mutation<
      Asset,
      { assetId: number; assignedToId: number | null }
    >({
      query: ({ assetId, assignedToId }) => ({
        url: `/assets/${assetId}/assign`,
        method: "PATCH",
        body: { assignedToId },
      }),
      transformResponse: (response: ApiResponse<Asset>) => response.data,
      invalidatesTags: ["Assets"],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useGetAllAssetsQuery,
  useGetAssetAssigneesQuery,
  useAssignAssetMutation,
} = assetApi;
