import { TicketFormDetails } from "./TicketFormDetails";
import { TicketFormReview } from "./TicketFormReview";
import { TicketFormBasics } from "./TicketFormBasics";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { TiTickOutline } from "react-icons/ti";
import { useCreateTicketMutation } from "../../services/tickets/ticketApi";
import { useDispatch } from "react-redux";
import { showModal } from "../../redux/errorSlice";

export interface AffectedAssetFormValue {
  assetId: number | null;
  searchText: string;
}

export interface FormData {
  title: string;
  category: string;
  priority: string;
  description: string;
  assets: AffectedAssetFormValue[];
  acceptTerms: boolean;
}
export const TicketForm = () => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      title: "",
      category: "Network",
      priority: "High",
      description: "",
      assets: [{ assetId: null, searchText: "" }],
      acceptTerms: false,
    },
  });

  const [step, setStep] = useState(1);
  const [createTicket] = useCreateTicketMutation();

  const dispatch = useDispatch();

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title.trim(),
      category: data.category.toUpperCase(),
      priority: data.priority.toUpperCase(),
      description: data.description.trim(),
      affectedAssetIds: data.assets.flatMap(({ assetId }) =>
        assetId === null ? [] : [assetId],
      ),
    };

    const response = await createTicket(payload).unwrap();
    if (response?.statusCode === 201) {
      dispatch(
        showModal({
          open: true,
          title: "Ticket Created successfully",
          statusCode: 201,
          redirectUrl: "/tickets",
          message:
            "Your issue will be resolved shortly. Please except to receive an update in 24 hours.",
        }),
      );
    }
  };
  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      {/* Step indicator */}
      <div className="mb-6 flex flex-wrap items-center gap-3 sm:gap-6">
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
        <hr className="w-4 border-gray-400 sm:w-6" />
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
        <hr className="w-4 border-gray-400 sm:w-6" />

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

      {/* On mobile: show only the active step. On xl: show all three columns */}
      <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div
          className={`min-w-0 ${step !== 1 ? "xl:pointer-events-none xl:text-gray-400 xl:opacity-60 xl:select-none hidden xl:block" : "bg-white"}`}
        >
          <TicketFormBasics
            control={control}
            errors={errors}
            setStep={setStep}
          />
        </div>
        <div
          className={`min-w-0 ${step !== 2 ? "xl:pointer-events-none xl:text-gray-400 xl:opacity-60 xl:select-none hidden xl:block" : "bg-white"}`}
        >
          <TicketFormDetails
            control={control}
            errors={errors}
            setStep={setStep}
            setValue={setValue}
          />
        </div>
        <div
          className={`min-w-0 ${step !== 3 ? "xl:pointer-events-none xl:text-gray-400 xl:opacity-60 xl:select-none hidden xl:block" : "bg-white"}`}
        >
          <TicketFormReview control={control} />
        </div>
      </div>
    </form>
  );
};
