import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { IoMdArrowDropdown } from "react-icons/io";

interface FormData {
  firstName: string;
  phoneNumber: string;
  gender: string;
  country: string;
  acceptTerms: boolean;
}

export default function UserForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      firstName: "",
      phoneNumber: "",
      gender: "",
      country: "",
      acceptTerms: false,
    },
  });

  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto mt-10 flex w-96 flex-col gap-4 rounded-lg border p-6"
    >
      <h2 className="text-xl font-semibold">React Hook Form Example</h2>

      {/* First Name */}

      <Controller
        name="firstName"
        control={control}
        rules={{
          required: "First Name is required",
        }}
        render={({ field, fieldState }) => (
          <>
            <label>First Name</label>

            <input
              {...field}
              className={`w-full rounded-md border p-2 transition-colors outline-none ${
                fieldState.error
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200"
              }`}
              placeholder="Enter First Name"
            />

            <p className="min-h-5 text-sm text-red-500">
              {errors.firstName?.message}
            </p>
          </>
        )}
      />

      {/* Phone Number */}

      <Controller
        name="phoneNumber"
        control={control}
        rules={{
          required: "Phone Number is required",

          pattern: {
            value: /^[0-9]{10}$/,
            message: "Phone Number must contain 10 digits",
          },
        }}
        render={({ field, fieldState }) => (
          <>
            <label>Phone Number</label>

            <input
              {...field}
              maxLength={10}
              className={`w-full rounded-md border p-2 transition-colors outline-none ${
                fieldState.error
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200"
              }`}
              placeholder="9876543210"
            />

            <p className="min-h-5 text-sm text-red-500">
              {errors.phoneNumber?.message}
            </p>
          </>
        )}
      />

      {/* Country */}

      <Controller
        name="country"
        control={control}
        rules={{
          required: "Please select a country",
        }}
        render={({ field, fieldState }) => (
          <>
            <label>Country</label>

            <div className="relative">
              <button
                type="button"

                onClick={() => setIsCountryOpen(!isCountryOpen)}

                className={`flex w-full items-center rounded-md border px-3 py-2 text-left ${
                  fieldState.error ? "border-red-500" : "border-gray-300"
                }`}
              >
                <span>{field.value || "Select Country"}</span>

                <IoMdArrowDropdown
                  className={`transition-transform ${
                    isCountryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCountryOpen && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                  {["India", "USA", "Canada"].map((country) => (
                    <li
                      key={country}

                      onClick={() => {
                        field.onChange(country);

                        setIsCountryOpen(false);
                      }}

                      className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                    >
                      {country}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="min-h-5 text-sm text-red-500">
              {errors.country?.message}
            </p>
          </>
        )}
      />

      {/* Gender */}

      <Controller
        name="gender"
        control={control}
        rules={{
          required: "Please select gender",
        }}
        render={({ field }) => (
          <>
            <label>Gender</label>

            <div className="flex gap-5">
              <label>
                <input
                  type="radio"
                  value="Male"
                  checked={field.value === "Male"}
                  onChange={field.onChange}
                />
                Male
              </label>

              <label>
                <input
                  type="radio"
                  value="Female"
                  checked={field.value === "Female"}
                  onChange={field.onChange}
                />
                Female
              </label>
            </div>

            <p className="min-h-5 text-sm text-red-500">
              {errors.gender?.message}
            </p>
          </>
        )}
      />

      {/* Checkbox */}

      <Controller
        name="acceptTerms"
        control={control}
        rules={{
          validate: (value) => value || "Please accept Terms & Conditions",
        }}
        render={({ field }) => (
          <>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Accept Terms & Conditions
            </label>

            <p className="min-h-5 text-sm text-red-500">
              {errors.acceptTerms?.message}
            </p>
          </>
        )}
      />

      <button
        type="submit"
        disabled={!isValid}
        className="rounded bg-blue-600 p-2 text-white disabled:bg-gray-400"
      >
        Submit
      </button>
    </form>
  );
}
