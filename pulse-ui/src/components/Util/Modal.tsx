import { useAppDispatch, useAppSelector } from "../../hooks";
import { MdErrorOutline } from "react-icons/md";
import { MdContentCopy } from "react-icons/md";
import { resetError } from "../../redux/errorSlice";
import { useNavigate } from "react-router";

export const Modal = () => {
  const { message, open, title, errorRef, statusCode } = useAppSelector(
    (state) => state.error,
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const copyRef = () => {
    if (errorRef) navigator.clipboard.writeText(errorRef);
  };

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-md">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-white p-10 shadow-2xl">
          <MdErrorOutline
            fontSize={70}
            color="red"
            className="rounded-full bg-red-100"
          />
          <div className="text-3xl font-bold">{title}</div>

          <div className="text-center text-gray-600">{message}</div>

          {errorRef && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="mb-1 text-xs font-semibold tracking-wide text-red-500 uppercase">
                Error Reference ID
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs break-all text-gray-700">
                  {errorRef}
                </code>
                <button
                  onClick={copyRef}
                  title="Copy error ID"
                  className="shrink-0 cursor-pointer text-gray-400 hover:text-gray-600"
                >
                  <MdContentCopy fontSize={16} />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Share this ID with support to help resolve the issue.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              dispatch(resetError());
              if (statusCode === 401) {
                navigate("/login");
              }
            }}
            className="bg-blaze-haze-600 hover:bg-blaze-haze-700 mt-2 cursor-pointer rounded-xl px-5 py-2 text-white"
          >
            OK
          </button>
        </div>
      </div>
    )
  );
};
