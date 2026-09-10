import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { IoClose } from "react-icons/io5";
import {
  useCreateUserMutation,
  type CreatedUser,
} from "../../services/users/userApi";
import type { User } from "../../types/user";
import { titleCase } from "../../util/helper";

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: (user: CreatedUser) => void;
}

interface CreateUserFormValues {
  name: string;
  email: string;
  mobileNumber: string;
  role: User["role"];
  password: string;
  confirmPassword: string;
}

const ROLE_OPTIONS: User["role"][] = ["employee", "agent", "admin"];

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

  return "Unable to create the user. Please try again.";
};

export const CreateUserModal = ({
  onClose,
  onCreated,
}: CreateUserModalProps) => {
  const [createUser] = useCreateUserMutation();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateUserFormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      role: "employee",
      password: "",
      confirmPassword: "",
    },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose]);

  const submitUser = async (values: CreateUserFormValues) => {
    try {
      const createdUser = await createUser({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        mobileNumber: values.mobileNumber.trim(),
        pwd: values.password,
        role: values.role,
      }).unwrap();
      onCreated(createdUser);
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-300 bg-white p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-user-title" className="text-xl font-bold">
              Add User
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create an active PulseDesk account with an initial password.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close add user dialog"
          >
            <IoClose fontSize={24} />
          </button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit(submitUser)}>
          <label className="block">
            <span className="mb-2 block font-semibold">
              Name <span className="text-red-500">*</span>
            </span>
            <input
              {...register("name", {
                required: "Name is required",
                validate: (value) =>
                  value.trim().length >= 2 ||
                  "Name must contain at least 2 characters",
              })}
              className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
              placeholder="Full name"
              autoComplete="name"
              autoFocus
            />
            {errors.name && (
              <span className="mt-1 block text-sm text-red-600">
                {errors.name.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">
              Email <span className="text-red-500">*</span>
            </span>
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
              placeholder="name@company.com"
              autoComplete="email"
            />
            {errors.email && (
              <span className="mt-1 block text-sm text-red-600">
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">Mobile number</span>
            <input
              type="tel"
              {...register("mobileNumber", {
                validate: (value) =>
                  !value.trim() ||
                  /^\+?[0-9 ()-]{7,20}$/.test(value.trim()) ||
                  "Enter a valid mobile number",
              })}
              className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
            {errors.mobileNumber && (
              <span className="mt-1 block text-sm text-red-600">
                {errors.mobileNumber.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">
              Role <span className="text-red-500">*</span>
            </span>
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

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-semibold">
                Initial password <span className="text-red-500">*</span>
              </span>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Use at least 6 characters",
                  },
                })}
                className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
                autoComplete="new-password"
              />
              {errors.password && (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.password.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">
                Confirm password <span className="text-red-500">*</span>
              </span>
              <input
                type="password"
                {...register("confirmPassword", {
                  required: "Confirm the password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
                className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.confirmPassword.message}
                </span>
              )}
            </label>
          </div>

          {errors.root && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errors.root.message}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-blaze-haze-700 hover:bg-blaze-haze-600 cursor-pointer rounded-xl px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
