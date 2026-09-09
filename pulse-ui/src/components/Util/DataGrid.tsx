import { useMemo, useState } from "react";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";
import { TableDropDown } from "./TableDropDown";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import { titleCase } from "../../util/helper";

export interface DataGridColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string | null;
  direction: SortDirection | null;
}

interface PaginationProps {
  page: number;
  totalPages: number | undefined;
  pageSize: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: string) => void;
  pageSizeOptions?: string[];
}

interface DataGridProps<T extends object> {
  data: T[];
  columns?: DataGridColumn<T>[];
  pagination?: PaginationProps;
  rowKey?: keyof T | ((row: T, index: number) => React.Key);
  selectedRowKey?: React.Key;
  onRowClick?: (row: T, index: number) => void;
  onSortChange?: (sort: SortState) => void;
  totalElements?: number;
  scrollHeight?: number | string;
  emptyMessage?: string;
}

export function DataGrid<T extends object>({
  columns,
  data,
  pagination,
  rowKey,
  selectedRowKey,
  onRowClick,
  onSortChange,
  totalElements,
  scrollHeight = "24rem",
  emptyMessage = "No data available",
}: DataGridProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: null,
  });

  const resolvedColumns = useMemo<DataGridColumn<T>[]>(() => {
    if (columns) return columns;

    const firstRow = data[0];
    if (!firstRow) return [];

    return Object.keys(firstRow).map((key) => ({
      key,
      header: titleCase(key).toUpperCase(),
    }));
  }, [columns, data]);

  const handleSort = (key: string) => {
    let next: SortState;
    if (sortState.key !== key) {
      next = { key, direction: "asc" };
    } else if (sortState.direction === "asc") {
      next = { key, direction: "desc" };
    } else {
      next = { key: null, direction: null };
    }
    setSortState(next);
    onSortChange?.(next);
  };

  const renderCell = (row: T, column: DataGridColumn<T>) => {
    if (column.render) return column.render(row);

    const value = row[column.key as keyof T];
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return titleCase(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number" || typeof value === "bigint") return value;

    return JSON.stringify(value);
  };

  const getRowKey = (row: T, index: number) => {
    if (typeof rowKey === "function") return rowKey(row, index);
    if (rowKey) return String(row[rowKey]);

    const inferredId = (row as { id?: unknown }).id;
    if (typeof inferredId === "string" || typeof inferredId === "number") {
      return inferredId;
    }

    return index;
  };

  const shouldShowPagination =
    pagination !== undefined &&
    (totalElements !== undefined
      ? totalElements >= 10
      : (pagination.totalPages ?? 0) > 1);

  return (
    <div>
      <div
        className="w-full overflow-auto"
        style={pagination ? undefined : { maxHeight: scrollHeight }}
      >
        <table className="min-w-full table-auto border-gray-300 text-sm">
          <thead className={pagination ? undefined : "sticky top-0 z-10"}>
            <tr className="font-semibold">
              {resolvedColumns.map((col, i) => (
                <td
                  key={String(col.key)}
                  onClick={
                    col.sortable ? () => handleSort(String(col.key)) : undefined
                  }
                  className={`bg-table-header border-t-0 border-b border-gray-300 p-3 ${
                    i === 0 ? "rounded-tl-lg" : ""
                  } ${
                    i === resolvedColumns.length - 1 ? "rounded-tr-lg" : ""
                  } ${col.sortable ? "cursor-pointer select-none" : ""}`}
                >
                  <span className="flex items-center gap-1 text-gray-500">
                    {col.header}
                    {col.sortable &&
                      (sortState.key === String(col.key) &&
                      sortState.direction === "desc" ? (
                        <IoMdArrowDropdown
                          fontSize={25}
                          className="text-blaze-haze-700"
                        />
                      ) : (
                        <IoMdArrowDropup
                          fontSize={25}
                          className={
                            sortState.key === String(col.key)
                              ? "text-blaze-haze-700"
                              : "text-gray-300"
                          }
                        />
                      ))}
                  </span>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const currentRowKey = getRowKey(row, index);
              const isSelected =
                selectedRowKey !== undefined &&
                String(currentRowKey) === String(selectedRowKey);

              return (
                <tr
                  key={currentRowKey}
                  aria-selected={isSelected || undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row, index)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onRowClick(row, index);
                  }}
                  className={`${onRowClick ? "hover:bg-blaze-haze-100 focus-visible:outline-blaze-haze-600 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]" : ""} ${isSelected ? "bg-blaze-haze-200" : ""}`}
                >
                  {resolvedColumns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="border-y border-gray-300 p-3"
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(resolvedColumns.length, 1)}
                  className="p-6 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {shouldShowPagination && pagination && (
        <div className="my-4 flex items-center justify-center gap-4">
          <div
            className={`rounded-md border border-gray-300 ${
              pagination.page - 1 < 0
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            <GoChevronLeft
              fontSize={28}
              color="gray"
              onClick={() => {
                if (pagination.page - 1 < 0) return;
                pagination.onPageChange(pagination.page - 1);
              }}
            />
          </div>

          <span className="text-gray-600">
            Page {pagination.page + 1} of {pagination.totalPages}
          </span>

          <div
            className={`rounded-md border border-gray-300 ${
              pagination.page + 1 >= (pagination.totalPages ?? 0)
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            <GoChevronRight
              fontSize={28}
              color="gray"
              onClick={() => {
                if ((pagination.totalPages ?? 0) <= pagination.page + 1) return;
                pagination.onPageChange(pagination.page + 1);
              }}
            />
          </div>

          <div className="text-gray-600">
            Rows:{" "}
            <TableDropDown
              options={pagination.pageSizeOptions ?? ["10", "20", "30"]}
              defaultValue={pagination.pageSize}
              onChange={pagination.onPageSizeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
