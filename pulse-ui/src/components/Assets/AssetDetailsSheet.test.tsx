import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Asset } from "../../services/assets/assetApi";
import { AssetDetailsSheet } from "./AssetDetailsSheet";

vi.mock("./AssetDetails", () => ({
  AssetDetails: ({ asset }: { asset: Asset }) => (
    <aside>details for {asset.tag}</aside>
  ),
}));

const ASSET: Asset = {
  id: 7,
  tag: "lap-007",
  model: "macbook pro",
  type: "laptop",
  status: "ACTIVE",
};

const renderSheet = (onClose = vi.fn()) => {
  const result = render(<AssetDetailsSheet asset={ASSET} onClose={onClose} />);
  return { ...result, onClose };
};

describe("AssetDetailsSheet", () => {
  it("renders the asset details in a labelled modal dialog", () => {
    renderSheet();

    const dialog = screen.getByRole("dialog", { name: "Asset LAP-007" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("details for lap-007");
  });

  it("is a bottom sheet on phones and a centred dialog from md", () => {
    renderSheet();

    const overlay = screen.getByRole("presentation");
    expect(overlay).toHaveClass("items-end", "md:items-center");
    expect(screen.getByRole("dialog")).toHaveClass(
      "rounded-t-2xl",
      "md:rounded-2xl",
    );
  });

  it("locks body scroll while open and restores it on close", () => {
    const { unmount } = renderSheet();
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes from the close button", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByLabelText("Close asset details"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape", () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when the backdrop is pressed but not the sheet itself", () => {
    const { onClose } = renderSheet();

    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
