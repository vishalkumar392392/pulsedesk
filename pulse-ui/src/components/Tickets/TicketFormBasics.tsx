import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { DropDown } from "../Util/DropDown";
import { GrFormNextLink } from "react-icons/gr";
import { TicketFormDetails } from "./TicketFormDetails";
import { TicketFormReview } from "./TicketFormReview";

export interface FormData {
  title: string;
  category: string;
  priority: string;
  description: string;
  assets: string[];
  acceptTerms: boolean;
}
const DROPDOWN_VALUES = ["Network", "Hardware", "Software", "Access", "Other"];
export const TicketForm = () => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      title: "",
      category: "Network",
      priority: "High",
      description: "",
      assets: [""],
      acceptTerms: false,
    },
  });
  const [title] = useWatch({
    control,
    name: ["title"],
  });

  const onSubmit = () => {};
  const isBasicFormValid = !(title && title.length > 3);
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6 flex items-center gap-6">
        <div className="flex gap-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-400">
            1
          </div>
          Basics
        </div>
        <hr className="w-6 border-gray-400" />
        <div className="flex gap-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-400">
            2
          </div>
          Details
        </div>
        <hr className="w-6 border-gray-400" />

        <div className="flex gap-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-400">
            3
          </div>
          Review
        </div>
      </div>
      <div className="flex items-start gap-6">
        <div className="flex-1 rounded-xl border border-gray-300 p-4">
          <div className="font-medium text-gray-500">
            STEP 1 . BASICS - DONE
          </div>
          <Controller
            name="title"
            control={control}
            rules={{
              required: true,
              minLength: 5,
            }}
            render={({ field, fieldState }) => (
              <>
                <div className="mt-8 mb-4 flex items-center justify-between">
                  <label className="mt-1 mr-4">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...field}
                    type="text"
                    className={`mt-1 w-[75%] rounded-md p-1 transition-colors outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 ${
                      fieldState.error
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-200"
                    }`}
                    placeholder="Ticket Title"
                  />
                </div>

                <p className="min-h-0.5 text-sm text-red-500">
                  {errors.title?.message}
                </p>
              </>
            )}
          />
          <hr className="border-gray-300" />
          <div className="mt-4 flex items-center justify-between">
            <label>Category</label>
            <div className="w-[50%]">
              <DropDown
                data={isOpen}
                setData={setIsOpen}
                control={control}
                values={DROPDOWN_VALUES}
                label=""
                name="category"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              disabled={isBasicFormValid}
              className={`bg-pulse-green disabled:bg-pulse-green rounded px-2 py-1 text-white ${isBasicFormValid ? "cursor-not-allowed" : "cursor-pointer"} my-3`}
            >
              <div className="flex items-center">Next {<GrFormNextLink />}</div>
            </button>
          </div>
        </div>
        <TicketFormDetails control={control} errors={errors} />
        <TicketFormReview control={control} />
      </div>
    </form>
  );
};
