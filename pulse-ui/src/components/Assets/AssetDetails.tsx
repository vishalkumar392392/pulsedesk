import type { Asset } from "../../services/assets/assetApi";
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

export const AssetDetails = ({ asset }: AssetDetailsProps) => {
  const assignedTo = asset.assignedTo
    ? formatName(asset.assignedTo)
    : "Unassigned";
  const status = asset.status ? titleCase(asset.status) : "Unknown";

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
