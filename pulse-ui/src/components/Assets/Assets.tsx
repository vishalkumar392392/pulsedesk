import { useState } from "react";
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
  const [selectedAssetId, setSelectedAssetId] = useState<number>();
  const { data } = useGetAllAssetsQuery({
    status: status,
    type: type,
  });
  const assets: Asset[] = data || [];
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);

  return (
    <div>
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
        {selectedAsset && <AssetDetails asset={selectedAsset} />}
      </div>
    </div>
  );
};
