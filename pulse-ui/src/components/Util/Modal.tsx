import { useAppDispatch, useAppSelector } from "../../hooks";
import { MdErrorOutline } from "react-icons/md";
import { resetError } from "../../redux/errorSlice";

export const Modal = () => {
  const { message, open, title } = useAppSelector((state) => state.error);
  const dispatch = useAppDispatch();
  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-md">
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-10 shadow-2xl">
          <MdErrorOutline
            fontSize={70}
            color="red"
            className="rounded-full bg-red-100"
          />
          <div className="text-3xl font-bold">{title}</div>

          <div>{message}</div>

          <button
            onClick={() => dispatch(resetError())}
            className="bg-blaze-haze-600 hover:bg-blaze-haze-700 mt-4 cursor-pointer rounded-xl px-5 py-2 text-white"
          >
            OK
          </button>
        </div>
      </div>
    )
  );
};
