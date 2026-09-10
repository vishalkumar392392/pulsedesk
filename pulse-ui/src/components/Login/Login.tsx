import { Controller, useForm } from "react-hook-form";
import { PulseIcon } from "../Util/PulseIcon";
import { useLoginMutation } from "../../services/auth/authApi";
import { authStorage } from "../../services/auth/authStorage";
import { Navigate, useLocation, useNavigate } from "react-router";
import { getStoredUser } from "../../util/helper";
import { isApiResponse } from "../../services/api/baseQuery";
import { useAppDispatch } from "../../hooks";
import { baseApi } from "../../services/api/baseApi";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const getLoginErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    isApiResponse(error.data)
  ) {
    return error.data.message;
  }

  return "Unable to log in. Please try again.";
};

export const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    control,
    handleSubmit,
    clearErrors,
    resetField,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  const [login] = useLoginMutation();
  const requestedRoute = (location.state as { from?: unknown } | null)?.from;
  const destination =
    typeof requestedRoute === "string" &&
    requestedRoute.startsWith("/") &&
    !requestedRoute.startsWith("//")
      ? requestedRoute
      : "/dashboard";

  const onSubmit = async (data: FormData) => {
    try {
      const response = await login(data).unwrap();
      authStorage.saveTokens(
        response.data.accessToken,
        response.data.refreshToken,
        data.rememberMe,
        response.data.user,
      );
      dispatch(baseApi.util.resetApiState());
      navigate(destination, { replace: true });
    } catch (error) {
      resetField("password");
      setError("root", {
        type: "server",
        message: getLoginErrorMessage(error),
      });
    }
  };

  if (authStorage.getAccessToken() && getStoredUser()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-blaze-haze mx-auto my-2 flex w-[45%] flex-col gap-3 rounded-lg border-3 p-15"
    >
      <div className="my-5 flex justify-center">
        <PulseIcon />
      </div>

      <Controller
        name="email"
        control={control}
        rules={{
          required: "Email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Please enter a valid email address",
          },
        }}
        render={({ field, fieldState }) => (
          <>
            <label className="ml-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...field}
              onChange={(event) => {
                clearErrors("root");
                field.onChange(event);
              }}
              type="email"
              className={`w-full rounded-md border p-2 transition-colors outline-none ${
                fieldState.error
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200"
              }`}
              placeholder="Email"
            />
            <p className="min-h-0.5 text-sm text-red-500">
              {errors.email?.message}
            </p>
          </>
        )}
      />
      <Controller
        name="password"
        control={control}
        rules={{
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
        }}
        render={({ field, fieldState }) => (
          <>
            <label className="ml-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              {...field}
              onChange={(event) => {
                clearErrors("root");
                field.onChange(event);
              }}
              type="password"
              className={`w-full rounded-md border p-2 transition-colors outline-none ${
                fieldState.error
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200"
              }`}
              placeholder="Password"
            />
            <p className="min-h-1 text-sm text-red-500">
              {errors.password?.message}
            </p>
          </>
        )}
      />

      <Controller
        name="rememberMe"
        control={control}
        rules={{}}
        render={({ field }) => (
          <>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Remember me
            </label>
          </>
        )}
      />

      {errors.root?.message && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={`bg-pulse-green disabled:bg-pulse-green rounded p-2 text-white ${!isValid || isSubmitting ? "cursor-not-allowed" : "cursor-pointer"} my-3`}
      >
        {isSubmitting ? "Logging in…" : "Login"}
      </button>
    </form>
  );
};
