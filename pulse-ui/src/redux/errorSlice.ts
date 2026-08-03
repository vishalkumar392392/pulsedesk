import { createSlice } from "@reduxjs/toolkit";

interface InitialStateProps {
  open: boolean;
  title: string;
  message: string;
  type: string;
}

const initialState: InitialStateProps = {
  open: false,
  title: "",
  message: "",
  type: "error",
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
    },
    resetError: (state) => {
      state.message = "";
      state.type = "error";
      state.open = false;
      state.title = "";
    },
  },
});
export const { showErrorModal, resetError } = errorSlice.actions;
export default errorSlice.reducer;
