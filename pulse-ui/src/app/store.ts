import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../services/api/baseApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import loaderReducer from "../redux/loaderSlice";
import errorReducer from "../redux/errorSlice";
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    loader: loaderReducer,
    error: errorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
