import { createSlice } from "@reduxjs/toolkit";

interface LoaderState {
  loadingCount: number;
}

const initialState: LoaderState = {
  loadingCount: 0,
};

const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    showLoader: (state) => {
      state.loadingCount++;
    },
    hideLoader: (state) => {
      if (state.loadingCount > 0) {
        state.loadingCount--;
      }
    },
    resetLoader: (state) => {
      state.loadingCount = 0;
    },
  },
});

export const { showLoader, hideLoader, resetLoader } = loaderSlice.actions;

export default loaderSlice.reducer;
