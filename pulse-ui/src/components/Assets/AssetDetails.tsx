import { useState } from "react";
import type { Asset } from "../../services/assets/assetApi";
import {
  useAssignAssetMutation,
  useGetAssetAssigneesQuery,
} from "../../services/assets/assetApi";
import { isApiResponse } from "../../services/api/baseQuery";
import { formatName, titleCase } from "../../util/helper";
import { assetStatusStyle } from "./assetStyles";

interface AssetDetailsProps {
  asset: Asset;
}

const formatAssetDate = (value?: string) => {
  if (!value) return "—";

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00` : value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const getAssignmentError = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    isApiResponse(error.data)
  ) {
    return error.data.message;
  }

  return "Unable to update this assignment. Please try again.";
};

export const AssetDetails = ({ asset }: AssetDetailsProps) => {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(
    asset.assignedToId ? String(asset.assignedToId) : "",
  );
  const [assignmentError, setAssignmentError] = useState("");
  const {
    data: assignees = [],
    isLoading: isLoadingAssignees,
    isError: isAssigneeError,
    refetch: refetchAssignees,
  } = useGetAssetAssigneesQuery();
  const [assignAsset, { isLoading: isSavingAssignment }] =
    useAssignAssetMutation();
  const assignedTo = asset.assignedTo
    ? formatName(asset.assignedTo)
    : "Unassigned";
  const status = asset.status ? titleCase(asset.status) : "Unknown";
  const isRetired = asset.status === "RETIRED";
  const hasChangedAssignee =
    selectedAssigneeId !== String(asset.assignedToId ?? "");

  const updateAssignment = async (assignedToId: number | null) => {
    setAssignmentError("");

    try {
      await assignAsset({ assetId: asset.id, assignedToId }).unwrap();
    } catch (error) {
      setAssignmentError(getAssignmentError(error));
    }
  };

  return (
    <aside className="bg-table-header min-h-[24rem] border-t border-gray-300 p-6 lg:border-t-0 lg:border-l">
      <h2 className="text-lg font-bold tracking-wide">
        {asset.tag.toUpperCase()}
      </h2>
      <p className="mt-1 text-gray-600">
        {asset.model} · {titleCase(asset.type)}
      </p>

      <dl className="mt-7">
        <div className="flex items-center justify-between gap-4 border-b border-gray-300 py-3">
          <dt>Status</dt>
          <dd className={assetStatusStyle(asset.status)}>{status}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-gray-300 py-3">
          <dt>Assigned to</dt>
          <dd className="text-right">{assignedTo}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-gray-300 py-3">
          <dt>Purchased</dt>
          <dd className="text-right text-gray-600">
            {formatAssetDate(asset.purchasedAt)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-gray-300 py-3">
          <dt>Warranty</dt>
          <dd className="text-right text-gray-600">
            {formatAssetDate(asset.coverageUntil)}
          </dd>
        </div>
      </dl>

      <section className="mt-6 border-b border-gray-300 pb-6">
        <h3 className="font-semibold text-gray-800">Manage assignment</h3>
        <label
          htmlFor={`asset-assignee-${asset.id}`}
          className="mt-3 block text-sm font-medium text-gray-600"
        >
          Assign to an active user
        </label>
        <select
          id={`asset-assignee-${asset.id}`}
          value={selectedAssigneeId}
          onChange={(event) => {
            setAssignmentError("");
            setSelectedAssigneeId(event.target.value);
          }}
          disabled={
            isRetired ||
            isLoadingAssignees ||
            isSavingAssignment ||
            isAssigneeError
          }
          className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="">
            {isLoadingAssignees ? "Loading users…" : "Select a user"}
          </option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {titleCase(assignee.name)} — {assignee.email}
            </option>
          ))}
        </select>

        {isRetired && (
          <p className="mt-2 text-sm text-gray-500">
            Retired assets cannot be assigned.
          </p>
        )}
        {isAssigneeError && (
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-red-700">
            <span>Unable to load users.</span>
            <button
              type="button"
              onClick={() => refetchAssignees()}
              className="cursor-pointer font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
        {assignmentError && (
          <p
            className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {assignmentError}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateAssignment(Number(selectedAssigneeId))}
            disabled={
              isRetired ||
              !selectedAssigneeId ||
              !hasChangedAssignee ||
              isSavingAssignment
            }
            className="bg-blaze-haze-700 hover:bg-blaze-haze-600 cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingAssignment
              ? "Saving…"
              : asset.assignedToId
                ? "Change assignment"
                : "Assign asset"}
          </button>
          {asset.assignedToId && (
            <button
              type="button"
              onClick={() => updateAssignment(null)}
              disabled={isRetired || isSavingAssignment}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Unassign
            </button>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-gray-600">Assignment history</h3>
        <p className="mt-5 border-b border-gray-300 pb-4">
          {asset.assignedTo
            ? `${assignedTo} — current assignment`
            : "No active assignment"}
        </p>
      </section>
    </aside>
  );
};
