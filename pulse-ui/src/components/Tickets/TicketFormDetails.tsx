import { useState } from "react";
import { DropDown } from "../Util/DropDown";
import type { FormData } from "./TicketForm";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { IoClose } from "react-icons/io5";
import { GrFormNextLink } from "react-icons/gr";
import { GrFormPreviousLink } from "react-icons/gr";
import { type Asset, useGetAssetsQuery } from "../../services/assets/assetApi";

const DROPDOWN_VALUES = ["High", "Medium", "Low"];
const getAssetLabel = (asset: Asset) => `${asset.tag} — ${asset.model}`;

interface TicketFormDetailsProps {
  control: Control<FormData>;
  errors?: FieldErrors<FormData>;
  setStep: (n: number) => void;
  setValue: UseFormSetValue<FormData>;
}

export const TicketFormDetails = ({
  control,
  setStep,
  setValue,
}: TicketFormDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAssetRow, setActiveAssetRow] = useState<number | null>(null);
  const {
    data: assetsResponse,
    isLoading: areAssetsLoading,
    isError: didAssetsFail,
    refetch: refetchAssets,
  } = useGetAssetsQuery();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets",
  });
  const [description, assets] = useWatch({
    control,
    name: ["description", "assets"],
  });

  const assignedAssets = assetsResponse?.data ?? [];
  const hasIncompleteAsset = (assets ?? []).some(
    ({ assetId, searchText }) => searchText.trim() !== "" && assetId === null,
  );
  const isDetailsFormValid =
    description?.trim().length >= 20 && !hasIncompleteAsset;
  const hasEmptyAssetRow = (assets ?? []).some(
    ({ assetId, searchText }) => assetId === null && searchText.trim() === "",
  );

  const getMatchingAssets = (query: string, rowIndex: number) => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedByOtherRows = new Set(
      (assets ?? [])
        .filter((_, index) => index !== rowIndex)
        .flatMap(({ assetId }) => (assetId === null ? [] : [assetId])),
    );

    return assignedAssets.filter((asset) => {
      if (selectedByOtherRows.has(asset.id)) return false;
      if (!normalizedQuery) return true;

      return [
        String(asset.id),
        asset.tag,
        asset.model,
        asset.type,
        getAssetLabel(asset),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  };

  const selectAsset = (index: number, asset: Asset) => {
    setValue(
      `assets.${index}`,
      {
        assetId: asset.id,
        searchText: getAssetLabel(asset),
      },
      { shouldDirty: true, shouldValidate: true },
    );
    setActiveAssetRow(null);
  };

  return (
    <div className="w-full rounded-xl border border-gray-300 p-4">
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
            rules={{ required: true, minLength: 20 }}
            render={({ field }) => (
              <>
                <div className="mt-4 mb-4">
                  <label className="mt-1 mr-4 flex">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    className={`mt-1 w-full rounded-md border p-2 transition-colors outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200`}
                    placeholder="Description"
                  />
                </div>
              </>
            )}
          />
        </div>

        <div className="mt-4">
          <label className="font-medium">Affected assets</label>

          <div className="mt-2 space-y-2">
            {fields.map((assetField, index) => (
              <div key={assetField.id}>
                <div className="flex w-full items-start gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Controller
                      name={`assets.${index}.searchText`}
                      control={control}
                      render={({ field }) => {
                        const matchingAssets = getMatchingAssets(
                          field.value,
                          index,
                        );
                        const showSuggestions = activeAssetRow === index;

                        return (
                          <>
                            <input
                              {...field}
                              type="text"
                              autoComplete="off"
                              onFocus={() => setActiveAssetRow(index)}
                              onChange={(event) => {
                                field.onChange(event.target.value);
                                setValue(`assets.${index}.assetId`, null, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                setActiveAssetRow(index);
                              }}
                              onBlur={() => {
                                field.onBlur();
                                setActiveAssetRow((current) =>
                                  current === index ? null : current,
                                );
                              }}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 transition-colors outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                              placeholder="Search by asset tag or model"
                              aria-label={`Affected asset ${index + 1}`}
                              aria-autocomplete="list"
                              aria-expanded={showSuggestions}
                            />

                            {showSuggestions && (
                              <div
                                className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                                role="listbox"
                              >
                                {areAssetsLoading ? (
                                  <p className="px-3 py-2 text-sm text-gray-500">
                                    Loading assigned assets…
                                  </p>
                                ) : didAssetsFail ? (
                                  <div className="px-3 py-2 text-sm text-red-600">
                                    Could not load assigned assets.{" "}
                                    <button
                                      type="button"
                                      className="font-semibold underline"
                                      onMouseDown={(event) =>
                                        event.preventDefault()
                                      }
                                      onClick={() => refetchAssets()}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                ) : matchingAssets.length === 0 ? (
                                  <p className="px-3 py-2 text-sm text-gray-500">
                                    No assigned assets match this search.
                                  </p>
                                ) : (
                                  matchingAssets.map((asset) => (
                                    <button
                                      key={asset.id}
                                      type="button"
                                      role="option"
                                      aria-selected={
                                        assets?.[index]?.assetId === asset.id
                                      }
                                      className="block w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                      onMouseDown={(event) =>
                                        event.preventDefault()
                                      }
                                      onClick={() => selectAsset(index, asset)}
                                    >
                                      <span className="block font-semibold">
                                        {asset.tag}
                                      </span>
                                      <span className="block text-sm text-gray-500">
                                        {asset.model} · {asset.type}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </>
                        );
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      remove(index);
                      setActiveAssetRow(null);
                    }}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800"
                    aria-label={`Remove affected asset ${index + 1}`}
                  >
                    <IoClose className="size-6" aria-hidden="true" />
                  </button>
                </div>

                {(assets?.[index]?.searchText.trim() ?? "") !== "" &&
                  assets?.[index]?.assetId === null && (
                    <p className="mt-1 text-sm text-red-600">
                      Select an asset from the suggestions.
                    </p>
                  )}
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={hasEmptyAssetRow}
            onClick={() => {
              append({ assetId: null, searchText: "" });
              setActiveAssetRow(fields.length);
            }}
            className="mt-3 inline-flex items-center rounded-xl border border-gray-300 px-3 py-2 font-semibold transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="mr-1 text-xl leading-none" aria-hidden="true">
              +
            </span>
            Add another asset
          </button>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="my-3 cursor-pointer rounded border border-gray-300 px-2 py-1"
          >
            <div className="flex items-center">
              {" "}
              {<GrFormPreviousLink />}Back
            </div>
          </button>
          <button
            type="button"
            disabled={!isDetailsFormValid}
            onClick={() => setStep(3)}
            className={`rounded px-2 py-1 text-white ${!isDetailsFormValid ? "bg-pulse-green-100 cursor-not-allowed" : "bg-pulse-green disabled:bg-pulse-green cursor-pointer"} my-3`}
          >
            <div className="flex items-center">Next {<GrFormNextLink />}</div>
          </button>
        </div>
      </div>
    </div>
  );
};
