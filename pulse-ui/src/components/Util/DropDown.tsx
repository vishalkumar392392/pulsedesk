import { Controller } from "react-hook-form";
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { IoMdArrowDropdown } from "react-icons/io";

interface DropDownProps<TFormValues extends FieldValues> {
  data: boolean;
  setData: (data: boolean) => void;
  control: Control<TFormValues>;
  values: Array<string>;
  label?: string;
  placeholder?: string;
  onSelect?: (value: string) => void;
  name: FieldPath<TFormValues>;
  required?: boolean;
}

export const DropDown = <TFormValues extends FieldValues>({
  data,
  setData,
  control,
  values,
  label = "",
  placeholder = "",
  onSelect,
  name,
  required = false,
}: DropDownProps<TFormValues>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required,
      }}
      render={({ field }) => (
        <>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-left"
              onClick={() => {
                setData(!data);
              }}
            >
              <span>{label && <label>{label}:</label>}</span>
              <span>{field.value || placeholder}</span>
              <IoMdArrowDropdown
                className={`transition-transform ${data ? "rotate-180" : ""}`}
              />
            </button>
            {data && (
              <ul className="absolute z-30 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                {values.map((value) => (
                  <li
                    key={value}
                    onClick={() => {
                      field.onChange(value);
                      setData(false);
                      onSelect?.(value);
                    }}
                    className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                  >
                    {value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    />
  );
};
