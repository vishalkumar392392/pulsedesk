import { createSlice } from "@reduxjs/toolkit";

interface InitialStateProps {
  open: boolean;
  title: string;
  message: string;
  type: string;
  errorRef: string;
  statusCode?: number;
  redirectUrl?: string;
}

const initialState: InitialStateProps = {
  open: false,
  title: "",
  message: "",
  type: "error",
  errorRef: "",
  statusCode: 0,
  redirectUrl: "",
};
const errorSlice = createSlice({
  name: "error",
  initialState: initialState,
  reducers: {
    showErrorModal: (state, action) => {
      state.message = action.payload.message;
      state.title = action.payload.title;
      state.open = true;
      state.type = "error";
      state.redirectUrl = action.payload.redirectUrl ?? "";
      state.errorRef = action.payload.errorRef ?? "";
      state.statusCode = action.payload.statusCode;
    },
    showModal: (state, action) => {
      state.message = action.payload.message;
      state.title = action.payload.title;
      state.open = true;
      state.type = "success";
      state.errorRef = action.payload.errorRef ?? "";
      state.statusCode = action.payload.statusCode;
      state.redirectUrl = action.payload?.redirectUrl;
    },
    resetError: (state) => {
      state.message = "";
      state.type = "error";
      state.open = false;
      state.title = "";
      state.errorRef = "";
      state.statusCode = 0;
      state.redirectUrl = "";
    },
  },
});
export const { showErrorModal, resetError, showModal } = errorSlice.actions;
export default errorSlice.reducer;
