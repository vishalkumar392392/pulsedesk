import { TicketFormDetails } from "./TicketFormDetails";
import { TicketFormReview } from "./TicketFormReview";
import { TicketFormBasics } from "./TicketFormBasics";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { TiTickOutline } from "react-icons/ti";

export interface FormData {
  title: string;
  category: string;
  priority: string;
  description: string;
  assets: string[];
  acceptTerms: boolean;
}
export const TicketForm = () => {
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

  const [step, setStep] = useState(1);

  const onSubmit = () => {};
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6 flex items-center gap-6">
        <div className="flex gap-1">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border ${step === 1 ? "border-pulse-green border-2" : "border-gray-400"} ${step >= 2 ? "bg-pulse-green" : "bg-white"}`}
          >
            {step >= 2 ? <TiTickOutline color="white" /> : 1}
          </div>
          <div
            className={`${step == 1 ? "text-pulse-green" : "text-gray-600"}`}
          >
            Basics
          </div>
        </div>
        <hr className="w-6 border-gray-400" />
        <div className="flex gap-1">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-gray-400 ${step === 2 ? "border-pulse-green border-2" : "border-gray-400"} ${step >= 3 ? "bg-pulse-green" : "bg-white"}`}
          >
            {step >= 3 ? <TiTickOutline color="white" /> : 2}
          </div>
          <div
            className={`${step == 2 ? "text-pulse-green" : "text-gray-600"}`}
          >
            Details
          </div>
        </div>
        <hr className="w-6 border-gray-400" />

        <div className="flex gap-1">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-gray-400 ${step === 3 ? "border-pulse-green border-2" : "border-gray-400"} ${step >= 4 ? "bg-pulse-green" : "bg-white"}`}
          >
            {step >= 4 ? <TiTickOutline color="white" /> : 3}
          </div>
          <div
            className={`${step == 3 ? "text-pulse-green" : "text-gray-600"}`}
          >
            Review
          </div>
        </div>
      </div>
      <div className="flex items-start gap-6">
        <div
          className={`${step != 1 ? "pointer-events-none text-gray-400 opacity-60 select-none" : "bg-white"}`}
        >
          <TicketFormBasics
            control={control}
            errors={errors}
            setStep={setStep}
          />
        </div>
        <div
          className={`${step != 2 ? "pointer-events-none text-gray-400 opacity-60 select-none" : "bg-white"}`}
        >
          <TicketFormDetails
            control={control}
            errors={errors}
            setStep={setStep}
          />
        </div>
        <div
          className={`${step != 3 ? "pointer-events-none text-gray-400 opacity-60 select-none" : "bg-white"}`}
        >
          <TicketFormReview control={control} />
        </div>
      </div>
    </form>
  );
};
