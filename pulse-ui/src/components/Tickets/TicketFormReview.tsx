import { Controller, useWatch, type Control } from "react-hook-form";
import type { FormData } from "./TicketForm";
interface TicketFormReviewProps {
  control: Control<FormData>;
}
export const TicketFormReview = ({ control }: TicketFormReviewProps) => {
  const [title, priority, assets, acceptTerms] = useWatch({
    control,
    name: ["title", "priority", "assets", "acceptTerms"],
  });
  const selectedAssets = (assets ?? []).filter(
    (asset) => asset.assetId !== null,
  );

  return (
    <div className="w-full rounded-xl border border-gray-300 p-4">
      <div className="mb-4 font-medium text-gray-500">
        STEP 3 . REVIEW - UPCOMING
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="text-gray-600">Title</div>
          <div className="min-w-0 text-right wrap-break-word">{title}</div>
        </div>
        <hr className="border-gray-300" />

        <div className="flex justify-between">
          <div className="text-gray-600">Priority</div>
          <div>{priority}</div>
        </div>
        <hr className="border-gray-300" />

        <div className="flex justify-between">
          <div className="text-gray-600">Assets</div>
          <div>{selectedAssets.length} attached</div>
        </div>
      </div>
      {selectedAssets.map((asset) => (
        <div key={asset.assetId} className="mt-2 flex text-sm text-gray-500">
          {asset.searchText}
        </div>
      ))}
      <div className="mt-4 flex justify-center text-gray-600">
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
                  className="accent-pulse-green"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                I confirm this is accurate
              </label>
            </>
          )}
        />
      </div>
      <div className="flex justify-center">
        <button
          disabled={!acceptTerms}
          className={`rounded px-2 py-1 text-white ${!acceptTerms ? "bg-pulse-green-100 cursor-not-allowed" : "bg-pulse-green disabled:bg-pulse-green cursor-pointer"} my-3`}
        >
          <div className="flex items-center">Submit</div>
        </button>
      </div>
    </div>
  );
};
