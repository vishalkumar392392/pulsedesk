import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridColumn } from "./DataGrid";

interface Row {
  id: number;
  name: string;
  status: string;
}

const ROWS: Row[] = [
  { id: 1, name: "Laptop", status: "active" },
  { id: 2, name: "Monitor", status: "retired" },
];

const COLUMNS: DataGridColumn<Row>[] = [
  { key: "name", header: "NAME", sortable: true },
  { key: "status", header: "STATUS" },
];

const renderCard = (row: Row) => <span>Card {row.name}</span>;

// jsdom applies no CSS, so both the card list and the table are in the DOM;
// scope queries to the one under test.
const getCardList = () => screen.getByRole("list");
const getTable = () => screen.getByRole("table");

describe("DataGrid", () => {
  describe("without renderMobileCard", () => {
    it("renders only the table, unchanged for desktop", () => {
      render(<DataGrid data={ROWS} columns={COLUMNS} />);

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Sort by")).not.toBeInTheDocument();
      expect(getTable().parentElement).not.toHaveClass("max-md:hidden");
      expect(within(getTable()).getByText("Laptop")).toBeInTheDocument();
    });
  });

  describe("with renderMobileCard", () => {
    it("renders a card per row and hides the table below md", () => {
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS}
          renderMobileCard={renderCard}
        />,
      );

      const cards = within(getCardList()).getAllByRole("listitem");
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent("Card Laptop");
      expect(getCardList().parentElement).toHaveClass("md:hidden");
      expect(getTable().parentElement).toHaveClass("max-md:hidden");
    });

    it("makes cards clickable and keyboard accessible", () => {
      const onRowClick = vi.fn();
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS}
          onRowClick={onRowClick}
          renderMobileCard={renderCard}
        />,
      );

      const [first, second] = within(getCardList()).getAllByRole("button");
      expect(first).toHaveAttribute("tabindex", "0");

      fireEvent.click(first);
      expect(onRowClick).toHaveBeenLastCalledWith(ROWS[0], 0);

      fireEvent.keyDown(second, { key: "Enter" });
      expect(onRowClick).toHaveBeenLastCalledWith(ROWS[1], 1);

      fireEvent.keyDown(second, { key: " " });
      expect(onRowClick).toHaveBeenCalledTimes(3);

      fireEvent.keyDown(second, { key: "a" });
      expect(onRowClick).toHaveBeenCalledTimes(3);
    });

    it("does not make cards interactive without onRowClick", () => {
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS}
          renderMobileCard={renderCard}
        />,
      );

      expect(within(getCardList()).queryByRole("button")).toBeNull();
    });

    it("highlights the selected card", () => {
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS}
          rowKey="id"
          selectedRowKey={2}
          renderMobileCard={renderCard}
        />,
      );

      const cards = within(getCardList()).getAllByRole("listitem");
      expect(cards[0]).not.toHaveAttribute("aria-selected");
      expect(cards[1]).toHaveAttribute("aria-selected", "true");
      expect(cards[1]).toHaveClass("border-blaze-haze-600");
    });

    it("shows the empty message when there is no data", () => {
      render(
        <DataGrid
          data={[]}
          columns={COLUMNS}
          emptyMessage="Nothing here"
          renderMobileCard={renderCard}
        />,
      );

      // Once in the card view and once in the table.
      expect(screen.getAllByText("Nothing here")).toHaveLength(2);
      expect(within(getCardList()).queryAllByRole("listitem")).toHaveLength(0);
    });

    it("offers sorting through a select for sortable columns only", () => {
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS}
          renderMobileCard={renderCard}
        />,
      );

      const select = screen.getByLabelText("Sort by");
      const values = within(select)
        .getAllByRole("option")
        .map((option) => (option as HTMLOptionElement).value);
      expect(values).toEqual(["", "name:asc", "name:desc"]);
    });

    it("hides the sort select when no column is sortable", () => {
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS.map((col) => ({ ...col, sortable: false }))}
          renderMobileCard={renderCard}
        />,
      );

      expect(screen.queryByLabelText("Sort by")).not.toBeInTheDocument();
    });

    it("reports sort changes from the select", () => {
      const onSortChange = vi.fn();
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS}
          onSortChange={onSortChange}
          renderMobileCard={renderCard}
        />,
      );
      const select = screen.getByLabelText<HTMLSelectElement>("Sort by");

      fireEvent.change(select, { target: { value: "name:desc" } });
      expect(onSortChange).toHaveBeenLastCalledWith({
        key: "name",
        direction: "desc",
      });
      expect(select.value).toBe("name:desc");

      fireEvent.change(select, { target: { value: "" } });
      expect(onSortChange).toHaveBeenLastCalledWith({
        key: null,
        direction: null,
      });
    });

    it("keeps the select in sync with table header sorting", () => {
      const onSortChange = vi.fn();
      render(
        <DataGrid
          data={ROWS}
          columns={COLUMNS}
          onSortChange={onSortChange}
          renderMobileCard={renderCard}
        />,
      );
      const select = screen.getByLabelText<HTMLSelectElement>("Sort by");
      const header = within(getTable()).getByText("NAME");

      fireEvent.click(header);
      expect(select.value).toBe("name:asc");
      fireEvent.click(header);
      expect(select.value).toBe("name:desc");
      fireEvent.click(header);
      expect(select.value).toBe("");
      expect(onSortChange).toHaveBeenCalledTimes(3);
    });
  });
});
