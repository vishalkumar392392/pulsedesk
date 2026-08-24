import { createSlice } from "@reduxjs/toolkit";

interface InitialStateProps {
  open: boolean;
  title: string;
  message: string;
  type: string;
  errorRef: string;
  statusCode?: number;
}

const initialState: InitialStateProps = {
  open: false,
  title: "",
  message: "",
  type: "error",
  errorRef: "",
  statusCode: 0,
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
      state.errorRef = action.payload.errorRef ?? "";
      state.statusCode = action.payload.statusCode;
    },
    resetError: (state) => {
      state.message = "";
      state.type = "error";
      state.open = false;
      state.title = "";
      state.errorRef = "";
    },
  },
});
export const { showErrorModal, resetError } = errorSlice.actions;
export default errorSlice.reducer;
