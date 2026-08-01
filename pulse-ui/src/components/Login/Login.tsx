import { Controller, useForm } from "react-hook-form";
import { PulseIcon } from "../Util/PulseIcon";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
export const Login = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  const onSubmit = (data: FormData) => {
    // if (data.rememberMe) {

    // } else {
    // }
    console.log(data);
  };
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
              maxLength={10}
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

      <button
        type="submit"
        disabled={!isValid}
        className={`bg-pulse-green disabled:bg-pulse-green rounded p-2 text-white ${!isValid ? "cursor-not-allowed" : "cursor-pointer"} my-3`}
      >
        Login
      </button>
    </form>
  );
};
