import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Asset } from "../../services/assets/assetApi";
import { resizeViewport, setViewportWidth } from "../../test/viewport";
import { Assets } from "./Assets";

const ASSETS: Asset[] = [
  {
    id: 1,
    tag: "lap-001",
    model: "macbook pro",
    type: "laptop",
    status: "ACTIVE",
    assignedTo: "vishal palla",
    assignedToId: 1,
  },
  {
    id: 2,
    tag: "mon-002",
    model: "dell u27",
    type: "monitor",
    status: "IN_REPAIR",
  },
];

vi.mock("../../services/assets/assetApi", () => ({
  useGetAllAssetsQuery: () => ({ data: ASSETS }),
}));

vi.mock("./AssetDetails", () => ({
  AssetDetails: ({ asset }: { asset: Asset }) => (
    <aside>details for {asset.tag}</aside>
  ),
}));

const getCards = () => within(screen.getByRole("list")).getAllByRole("button");

describe("Assets", () => {
  it("renders a mobile card per asset with its key facts", () => {
    setViewportWidth(390);
    render(<Assets />);

    const [laptop, monitor] = getCards();
    expect(laptop).toHaveTextContent("LAP-001");
    expect(laptop).toHaveTextContent("Macbook Pro · Laptop");
    expect(laptop).toHaveTextContent("Active");
    expect(laptop).toHaveTextContent("Assigned to Vishal P.");
    expect(monitor).toHaveTextContent("In Repair");
    expect(monitor).toHaveTextContent("Unassigned");
  });

  it("opens the details sheet below desktop and closes it again", () => {
    setViewportWidth(390);
    render(<Assets />);

    fireEvent.click(getCards()[0]);
    const dialog = screen.getByRole("dialog", { name: "Asset LAP-001" });
    expect(dialog).toHaveTextContent("details for lap-001");

    fireEvent.click(screen.getByLabelText("Close asset details"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("details for lap-001")).not.toBeInTheDocument();
  });

  it("shows details inline (no sheet) on desktop", () => {
    setViewportWidth(1440);
    render(<Assets />);

    fireEvent.click(within(screen.getByRole("table")).getByText("LAP-001"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("details for lap-001")).toBeInTheDocument();
  });

  it("moves the open asset between sheet and side panel on resize", () => {
    setViewportWidth(1440);
    render(<Assets />);
    fireEvent.click(within(screen.getByRole("table")).getByText("MON-002"));

    resizeViewport(820);
    expect(
      screen.getByRole("dialog", { name: "Asset MON-002" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("details for mon-002")).toHaveLength(1);

    resizeViewport(1280);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("details for mon-002")).toBeInTheDocument();
  });

  it("makes the Add asset button full-width on phones only", () => {
    render(<Assets />);
    expect(screen.getByRole("button", { name: "Add asset" })).toHaveClass(
      "max-sm:w-full",
    );
  });
});
