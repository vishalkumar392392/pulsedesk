import { createSlice } from "@reduxjs/toolkit";

interface InitialStateProps {
  open: boolean;
  title: string;
  message: string;
  type: string;
  errorRef: string;
}

const initialState: InitialStateProps = {
  open: false,
  title: "",
  message: "",
  type: "error",
  errorRef: "",
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
