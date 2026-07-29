import { Controller, useForm } from "react-hook-form";
import { LiaSearchSolid } from "react-icons/lia";

interface TextInputStyleProps {
  width?: string;
}
interface TextInputProps {
  label?: string;
  min?: number;
  max?: number;
  style?: TextInputStyleProps;
}

export const TextInput = ({ min = 3, ...props }: TextInputProps) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      ticketId: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => {
        console.log(data);
      })}
    >
      {props?.label && <label>Search</label>}
      <Controller
        name="ticketId"
        control={control}
        rules={{
          minLength: {
            value: min,
            message: `Minimum ${min} characters required`,
          },
        }}
        render={({ field, fieldState }) => (
          <div className="flex flex-col">
            <div
              className={`inline-flex w-${props?.style?.width ?? 40} max-w-full items-center gap-2 rounded-md border-[1.6px] border-gray-300 px-2 py-1`}
            >
              <span className="text-gray-500">
                <LiaSearchSolid />
              </span>
              <input
                {...field}
                className="h-8 min-w-0 flex-1 border-none bg-transparent p-0 outline-none"
                type="text"
                placeholder={"Search"}
              />
            </div>
            {fieldState.error && (
              <p className="mt-1 text-sm text-red-500">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </form>
  );
};
