import type {
  Notification,
  NotificationsResponse,
} from "../../types/notification";
import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

const notificationTags = [
  { type: "Notifications" as const, id: "LIST" },
  { type: "Notifications" as const, id: "COUNT" },
];

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, void>({
      query: () => "/notifications?page=0&size=20",
      transformResponse: (response: ApiResponse<NotificationsResponse>) =>
        response.data,
      providesTags: notificationTags,
      extraOptions: { suppressGlobalLoader: true },
    }),
    getUnreadNotificationCount: builder.query<number, void>({
      query: () => "/notifications/unread-count",
      transformResponse: (response: ApiResponse<{ count: number }>) =>
        response.data.count,
      providesTags: [{ type: "Notifications", id: "COUNT" }],
      extraOptions: { suppressGlobalLoader: true },
    }),
    markNotificationRead: builder.mutation<void, number>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      async onQueryStarted(notificationId, { dispatch, queryFulfilled }) {
        const countPatch = dispatch(
          notificationApi.util.updateQueryData(
            "getUnreadNotificationCount",
            undefined,
            (count) => Math.max(0, count - 1),
          ),
        );
        const listPatch = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            undefined,
            (notifications) => {
              const notification = notifications.content.find(
                (item) => item.id === notificationId,
              );
              if (notification) notification.read = true;
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          countPatch.undo();
          listPatch.undo();
        }
      },
      invalidatesTags: notificationTags,
      extraOptions: { suppressGlobalLoader: true },
    }),
    markTicketNotificationsRead: builder.mutation<void, number>({
      query: (ticketId) => ({
        url: `/notifications/ticket/${ticketId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: notificationTags,
      extraOptions: { suppressGlobalLoader: true },
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      async onQueryStarted(_argument, { dispatch, queryFulfilled }) {
        const countPatch = dispatch(
          notificationApi.util.updateQueryData(
            "getUnreadNotificationCount",
            undefined,
            () => 0,
          ),
        );
        const listPatch = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            undefined,
            (notifications) => {
              notifications.content.forEach((notification: Notification) => {
                notification.read = true;
              });
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          countPatch.undo();
          listPatch.undo();
        }
      },
      invalidatesTags: notificationTags,
      extraOptions: { suppressGlobalLoader: true },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkTicketNotificationsReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
