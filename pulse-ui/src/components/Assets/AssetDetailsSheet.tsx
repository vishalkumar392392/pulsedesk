import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import type { Asset } from "../../services/assets/assetApi";
import { useBodyScrollLock } from "../Util/useBodyScrollLock";
import { AssetDetails } from "./AssetDetails";

interface AssetDetailsSheetProps {
  asset: Asset;
  onClose: () => void;
}

// Below the desktop breakpoint the asset panel opens as a bottom sheet
// (phones) or a centered dialog (tablets) instead of a side column.
export const AssetDetailsSheet = ({
  asset,
  onClose,
}: AssetDetailsSheetProps) => {
  useBodyScrollLock(true);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-[1px] md:items-center md:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl md:max-w-lg md:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Asset ${asset.tag.toUpperCase()}`}
      >
        <div className="bg-table-header sticky top-0 z-10 flex justify-center pt-2 md:hidden">
          <span
            className="h-1.5 w-10 rounded-full bg-gray-300"
            aria-hidden="true"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:text-gray-900"
          aria-label="Close asset details"
        >
          <IoClose size={20} aria-hidden="true" />
        </button>
        <div className="pb-[env(safe-area-inset-bottom)] [&>aside]:min-h-0 [&>aside]:border-t-0">
          <AssetDetails asset={asset} />
        </div>
      </section>
    </div>
  );
};
