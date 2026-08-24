import { useState } from "react";
import { DropDown } from "../Util/DropDown";
import type { FormData } from "./TicketFormBasics";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { IoClose } from "react-icons/io5";
import { GrFormNextLink } from "react-icons/gr";
import { GrFormPreviousLink } from "react-icons/gr";

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
  const [description, assets] = useWatch({
    control,
    name: ["description", "assets"],
  });
  const isDetailsFormValid = description?.length > 0 && assets?.length > 0;

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
            rules={{ required: "Description is required" }}
            render={({ field, fieldState }) => (
              <>
                <div className="mt-4 mb-4">
                  <label className="mt-1 mr-4 flex">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    className={`mt-1 w-full rounded-md border p-2 transition-colors outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 ${
                      fieldState.error
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-200"
                    }`}
                    placeholder="Description"
                  />
                </div>

                <p className="min-h-0.5 text-sm text-red-500">
                  {errors.description?.message}
                </p>
              </>
            )}
          />
        </div>

        <Controller
          name="assets"
          control={control}
          render={({ field }) => (
            <div className="mt-4">
              <label className="font-medium">Affected assets</label>

              <div className="mt-2 space-y-2">
                {field.value.map((asset, index) => (
                  <div key={index} className="flex w-full items-center gap-2">
                    <input
                      type="text"
                      value={asset}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const nextAssets = [...field.value];
                        nextAssets[index] = event.target.value;
                        field.onChange(nextAssets);
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 transition-colors outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                      placeholder="Asset name or ID"
                      aria-label={`Affected asset ${index + 1}`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        field.onChange(
                          field.value.filter(
                            (_, assetIndex) => assetIndex !== index,
                          ),
                        );
                      }}
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800"
                      aria-label={`Remove affected asset ${index + 1}`}
                    >
                      <IoClose className="size-6" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => field.onChange([...field.value, ""])}
                className="mt-3 inline-flex items-center rounded-xl border border-gray-300 px-3 py-2 font-semibold transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <span className="mr-1 text-xl leading-none" aria-hidden="true">
                  +
                </span>
                Add another asset
              </button>
            </div>
          )}
        />
        <div className="mt-4 flex justify-between">
          <button
            disabled={!isDetailsFormValid}
            className={`rounded border border-gray-300 px-2 py-1 ${!isDetailsFormValid ? "cursor-not-allowed" : "cursor-pointer"} my-3`}
          >
            <div className="flex items-center">
              {" "}
              {<GrFormPreviousLink />}Back
            </div>
          </button>
          <button
            disabled={!isDetailsFormValid}
            className={`bg-pulse-green disabled:bg-pulse-green rounded px-2 py-1 text-white ${!isDetailsFormValid ? "cursor-not-allowed" : "cursor-pointer"} my-3`}
          >
            <div className="flex items-center">Next {<GrFormNextLink />}</div>
          </button>
        </div>
      </div>
    </div>
  );
};
