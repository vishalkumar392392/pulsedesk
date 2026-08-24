import { useState } from "react";
import { DropDown } from "../Util/DropDown";
import type { FormData } from "./TicketFormBasics";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
const DROPDOWN_VALUES = ["High", "Medium", "Low"];

interface TicketFormDetailsProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

export const TicketFormDetails = ({
  control,
  errors,
}: TicketFormDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex-1 rounded-xl border border-gray-300 p-4">
      <div className="font-medium text-gray-500">STEP 2 . DETAILS</div>

      <div className="mt-4">
        <label>
          Priority <span className="text-red-500">*</span>
        </label>
        <div className="my-2">
          <DropDown
            data={isOpen}
            setData={setIsOpen}
            control={control}
            values={DROPDOWN_VALUES}
            name="priority"
            required={true}
          />
        </div>
        <div>
          <Controller
            name="description"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <>
                <div className="mt-4 mb-4">
                  <label className="mt-1 mr-4 flex">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    className={`mt-1 w-full rounded-md border p-2 transition-colors outline-none ${
                      fieldState.error
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-200"
                    }`}
                    placeholder="Description"
                  />
                </div>

                <p className="min-h-0.5 text-sm text-red-500">
                  {errors.title?.message}
                </p>
              </>
            )}
          />
        </div>
      </div>
    </div>
  );
};
