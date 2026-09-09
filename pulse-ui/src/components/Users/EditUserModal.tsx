import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IoClose } from "react-icons/io5";
import { useUpdateUserMutation } from "../../services/users/userApi";
import type { User } from "../../types/user";
import { titleCase } from "../../util/helper";

interface EditUserModalProps {
  user: User;
  onClose: () => void;
}

interface EditUserFormValues {
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
}

const ROLE_OPTIONS: User["role"][] = ["employee", "agent", "admin"];
const STATUS_OPTIONS: User["status"][] = ["ACTIVE", "INACTIVE"];

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  return "Unable to update the user. Please try again.";
};

export const EditUserModal = ({ user, onClose }: EditUserModalProps) => {
  const [updateUser] = useUpdateUserMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<EditUserFormValues>({
    mode: "onChange",
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase() as User["role"],
      status: user.status.toUpperCase() as User["status"],
    },
  });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const submitUpdate = async (values: EditUserFormValues) => {
    try {
      await updateUser({
        id: user.id,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
        status: values.status,
      }).unwrap();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="w-full max-w-xl rounded-2xl border border-gray-300 bg-white p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="edit-user-title" className="text-xl font-bold">
            Edit User
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close edit user dialog"
          >
            <IoClose fontSize={24} />
          </button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit(submitUpdate)}>
          <label className="block">
            <span className="mb-2 block font-semibold">Name</span>
            <input
              {...register("name", {
                required: "Name is required",
                validate: (value) =>
                  value.trim().length >= 2 ||
                  "Name must contain at least 2 characters",
              })}
              className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
              autoFocus
            />
            {errors.name && (
              <span className="mt-1 block text-sm text-red-600">
                {errors.name.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">Email</span>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
            />
            {errors.email && (
              <span className="mt-1 block text-sm text-red-600">
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">Role</span>
            <select
              {...register("role", { required: true })}
              className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {titleCase(role)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">Status</span>
            <select
              {...register("status", { required: true })}
              className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isDirty || !isValid || isSubmitting}
              className="bg-blaze-haze-700 hover:bg-blaze-haze-600 cursor-pointer rounded-xl px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
