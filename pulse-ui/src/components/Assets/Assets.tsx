import { useState } from "react";
import { IoAdd } from "react-icons/io5";
import {
  type Asset,
  useGetAllAssetsQuery,
} from "../../services/assets/assetApi";
import { formatName, titleCase } from "../../util/helper";
import { DataGrid, type DataGridColumn } from "../Util/DataGrid";
import { AssetDetails } from "./AssetDetails";
import { assetStatusStyle } from "./assetStyles";
import { AssetStatusDropdown } from "./Dropdowns/AssetStatusDropdown";
import { AssetTypeDropdown } from "./Dropdowns/AssetTypeDropdown";
import { CreateAssetModal } from "./CreateAssetModal";

export const Assets = () => {
  const ASSET_COLUMNS: DataGridColumn<Asset>[] = [
    {
      key: "tag",
      header: "TAG",
      render: (asset) => (
        <span className="text-gray-500">{asset.tag.toUpperCase()}</span>
      ),
    },
    {
      key: "type",
      header: "TYPE",
      render: (asset) => <span className="">{titleCase(asset.type)}</span>,
    },
    {
      key: "model",
      header: "MODEL",
      render: (asset) => (
        <span className="">
          <span className="" />
          <span>{titleCase(asset.model)}</span>
        </span>
      ),
    },
    {
      key: "assignedTo",
      header: "ASSIGNED TO",
      render: (asset) => (
        <span className="">{formatName(asset.assignedTo || "")}</span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (asset) => (
        <span className={assetStatusStyle(asset.status)}>
          {asset.status ? titleCase(asset.status) : "Unknown"}
        </span>
      ),
    },
  ];
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [createdAssetTag, setCreatedAssetTag] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<number>();
  const { data } = useGetAllAssetsQuery({
    status: status,
    type: type,
  });
  const assets: Asset[] = data || [];
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);

  return (
    <div>
      {isCreateAssetOpen && (
        <CreateAssetModal
          onClose={() => setIsCreateAssetOpen(false)}
          onCreated={(asset) => {
            setIsCreateAssetOpen(false);
            setCreatedAssetTag(asset.tag);
            setSelectedAssetId(asset.id);
          }}
        />
      )}
      {createdAssetTag && (
        <div
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {createdAssetTag.toUpperCase()} was added to the inventory.
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setCreatedAssetTag("");
            setIsCreateAssetOpen(true);
          }}
          className="bg-blaze-haze-700 hover:bg-blaze-haze-600 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white shadow-sm transition-colors"
        >
          <IoAdd aria-hidden="true" fontSize={20} />
          Add asset
        </button>
      </div>
      <AssetTypeDropdown setType={setType} />
      <AssetStatusDropdown setStatus={setStatus} />
      <br />
      <div
        className={
          selectedAsset
            ? "grid overflow-hidden rounded-lg border border-gray-300 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]"
            : undefined
        }
      >
        <div className="min-w-0">
          <DataGrid
            columns={ASSET_COLUMNS}
            data={assets}
            rowKey="id"
            selectedRowKey={selectedAssetId}
            onRowClick={(asset) => setSelectedAssetId(asset.id)}
            scrollHeight="32rem"
          />
        </div>
        {selectedAsset && (
          <AssetDetails
            key={`${selectedAsset.id}-${selectedAsset.assignedToId ?? "unassigned"}`}
            asset={selectedAsset}
          />
        )}
      </div>
    </div>
  );
};
