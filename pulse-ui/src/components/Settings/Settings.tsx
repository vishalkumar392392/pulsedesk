import { useState } from "react";
import { useForm } from "react-hook-form";
import { authStorage } from "../../services/auth/authStorage";
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from "../../services/users/userApi";
import type { User } from "../../types/user";
import { getStoredUser } from "../../util/helper";

interface ProfileFormValues {
  name: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
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

  return fallback;
};

const fieldClassName =
  "focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

const ProfileSettings = ({ user }: { user: User }) => {
  const [updateProfile] = useUpdateProfileMutation();
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<ProfileFormValues>({
    mode: "onChange",
    defaultValues: { name: user.name },
  });

  const submitProfile = async (values: ProfileFormValues) => {
    setSuccessMessage("");

    try {
      const response = await updateProfile({
        name: values.name.trim(),
      }).unwrap();
      const updatedUser: User = {
        ...user,
        ...response.data,
        role: response.data.role.toLowerCase() as User["role"],
      };

      authStorage.updateUser(updatedUser);
      reset({ name: updatedUser.name });
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setError("root", {
        message: getErrorMessage(
          error,
          "Unable to update your profile. Please try again.",
        ),
      });
    }
  };

  return (
    <section className="rounded-2xl border border-gray-300 bg-white p-8">
      <h2 className="text-xl font-bold tracking-widest text-gray-600 uppercase">
        Profile
      </h2>

      <form className="mt-6" onSubmit={handleSubmit(submitProfile)}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-semibold">Name</span>
            <input
              {...register("name", {
                required: "Name is required",
                validate: (value) =>
                  value.trim().length >= 2 ||
                  "Name must contain at least 2 characters",
              })}
              className={fieldClassName}
              autoComplete="name"
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
              value={user.email}
              className={fieldClassName}
              autoComplete="email"
              disabled
              aria-describedby="profile-email-help"
            />
            <span id="profile-email-help" className="sr-only">
              Email cannot be changed from account settings.
            </span>
          </label>
        </div>

        {errors.root && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.root.message}
          </p>
        )}
        {successMessage && (
          <p
            className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            role="status"
          >
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          className="mt-5 cursor-pointer rounded-xl border border-gray-300 px-4 py-2 font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </section>
  );
};

const PasswordSettings = () => {
  const [changePassword] = useChangePasswordMutation();
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm<PasswordFormValues>({
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const submitPassword = async (values: PasswordFormValues) => {
    setSuccessMessage("");

    try {
      await changePassword(values).unwrap();
      reset();
      setSuccessMessage("Password updated successfully.");
    } catch (error) {
      setError("root", {
        message: getErrorMessage(
          error,
          "Unable to update your password. Please try again.",
        ),
      });
    }
  };

  return (
    <section className="rounded-2xl border border-gray-300 bg-white p-8">
      <h2 className="text-xl font-bold tracking-widest text-gray-600 uppercase">
        Change Password
      </h2>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit(submitPassword)}>
        <label className="block">
          <span className="mb-2 block font-semibold">Current password</span>
          <input
            type="password"
            {...register("currentPassword", {
              required: "Current password is required",
            })}
            className={fieldClassName}
            autoComplete="current-password"
          />
          {errors.currentPassword && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.currentPassword.message}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block font-semibold">New password</span>
          <input
            type="password"
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 6,
                message: "New password must be at least 6 characters",
              },
            })}
            className={fieldClassName}
            autoComplete="new-password"
          />
          {errors.newPassword && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.newPassword.message}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block font-semibold">Confirm new password</span>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) =>
                value === getValues("newPassword") || "Passwords do not match",
              deps: ["newPassword"],
            })}
            className={fieldClassName}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.confirmPassword.message}
            </span>
          )}
        </label>

        {errors.root && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.root.message}
          </p>
        )}
        {successMessage && (
          <p
            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            role="status"
          >
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="bg-blaze-haze-700 hover:bg-blaze-haze-600 cursor-pointer rounded-xl px-4 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Updating…" : "Update Password"}
        </button>
      </form>
    </section>
  );
};

export const Settings = () => {
  const user = getStoredUser();

  if (!user) {
    return (
      <p className="rounded-xl border border-gray-300 bg-white p-6 text-gray-600">
        Your account details are unavailable. Please sign in again.
      </p>
    );
  }

  return (
    <main className="w-full max-w-5xl space-y-6 pb-10">
      <ProfileSettings user={user} />
      <PasswordSettings />
    </main>
  );
};
