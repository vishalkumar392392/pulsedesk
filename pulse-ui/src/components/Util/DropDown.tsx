import { Controller } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";
import { IoMdArrowDropdown } from "react-icons/io";

interface FormData {
  value: string;
}

interface DropDownProps {
  data: boolean;
  setData: (data: boolean) => void;
  control: Control<FormData, FieldValues>;
  values: Array<string>;
  label?: string;
}

export const DropDown = ({
  data,
  setData,
  control,
  values,
  label = "",
}: DropDownProps) => {
  return (
    <Controller
      name="value"
      control={control}
      render={({ field }) => (
        <>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-left"
              onClick={() => setData(!data)}
            >
              <span>{label && <label>{label}:</label>}</span>
              <span>{field.value || "Select Country"}</span>
              <IoMdArrowDropdown
                className={`transition-transform ${data ? "rotate-180" : ""}`}
              />
            </button>
            {data && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                {values.map((value) => (
                  <li
                    key={value}
                    onClick={() => {
                      field.onChange(value);
                      setData(false);
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
