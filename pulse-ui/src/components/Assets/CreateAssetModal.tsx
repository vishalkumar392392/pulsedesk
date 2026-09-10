import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { IoClose } from "react-icons/io5";
import {
  useCreateAssetMutation,
  type Asset,
} from "../../services/assets/assetApi";
import { isApiResponse } from "../../services/api/baseQuery";
import { titleCase } from "../../util/helper";

interface CreateAssetModalProps {
  onClose: () => void;
  onCreated: (asset: Asset) => void;
}

interface CreateAssetFormValues {
  tag: string;
  type: string;
  model: string;
  purchasedAt: string;
  coverageUntil: string;
}

const ASSET_TYPES = [
  "LAPTOP",
  "MONITOR",
  "PHONE",
  "KEYBOARD",
  "DOCK",
  "LICENSE",
] as const;

const getLocalDate = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
};

const getCreateAssetError = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    isApiResponse(error.data)
  ) {
    return error.data.message;
  }

  return "Unable to create the asset. Please try again.";
};

export const CreateAssetModal = ({
  onClose,
  onCreated,
}: CreateAssetModalProps) => {
  const [createAsset] = useCreateAssetMutation();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateAssetFormValues>({
    mode: "onChange",
    defaultValues: {
      tag: "",
      type: "LAPTOP",
      model: "",
      purchasedAt: getLocalDate(),
      coverageUntil: "",
    },
  });
  const purchasedAt = useWatch({ control, name: "purchasedAt" });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose]);

  const submitAsset = async (values: CreateAssetFormValues) => {
    try {
      const createdAsset = await createAsset({
        tag: values.tag.trim().toUpperCase(),
        type: values.type,
        model: values.model.trim(),
        purchasedAt: values.purchasedAt,
        coverageUntil: values.coverageUntil || null,
      }).unwrap();
      onCreated(createdAsset);
    } catch (error) {
      setError("root", { message: getCreateAssetError(error) });
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-300 bg-white p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-asset-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-asset-title" className="text-xl font-bold">
              Add Asset
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add an unassigned asset to the inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close add asset dialog"
          >
            <IoClose fontSize={24} />
          </button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit(submitAsset)}>
          <label className="block">
            <span className="mb-2 block font-semibold">
              Asset tag <span className="text-red-500">*</span>
            </span>
            <input
              {...register("tag", {
                required: "Asset tag is required",
                maxLength: {
                  value: 30,
                  message: "Asset tag must not exceed 30 characters",
                },
                validate: (value) =>
                  value.trim().length > 0 || "Asset tag is required",
              })}
              className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none focus:ring-2"
              placeholder="LAPTOP-001"
              autoFocus
            />
            {errors.tag && (
              <span className="mt-1 block text-sm text-red-600">
                {errors.tag.message}
              </span>
            )}
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-semibold">
                Type <span className="text-red-500">*</span>
              </span>
              <select
                {...register("type", { required: true })}
                className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2"
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {titleCase(type)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">
                Model <span className="text-red-500">*</span>
              </span>
              <input
                {...register("model", {
                  required: "Model is required",
                  maxLength: {
                    value: 100,
                    message: "Model must not exceed 100 characters",
                  },
                  validate: (value) =>
                    value.trim().length > 0 || "Model is required",
                })}
                className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
                placeholder="MacBook Pro 14 M3"
              />
              {errors.model && (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.model.message}
                </span>
              )}
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-semibold">
                Purchased date <span className="text-red-500">*</span>
              </span>
              <input
                type="date"
                {...register("purchasedAt", {
                  required: "Purchased date is required",
                })}
                className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
              />
              {errors.purchasedAt && (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.purchasedAt.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">Coverage until</span>
              <input
                type="date"
                min={purchasedAt || undefined}
                {...register("coverageUntil", {
                  validate: (value) =>
                    !value ||
                    !purchasedAt ||
                    value >= purchasedAt ||
                    "Coverage date cannot be before purchased date",
                })}
                className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
              />
              {errors.coverageUntil && (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.coverageUntil.message}
                </span>
              )}
            </label>
          </div>

          {errors.root && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errors.root.message}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-blaze-haze-700 hover:bg-blaze-haze-600 cursor-pointer rounded-xl px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create asset"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
