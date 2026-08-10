import { useState } from "react";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";
import { TableDropDown } from "./TableDropDown";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";

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

interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  data: T[];
  pagination: PaginationProps;
  rowKey: keyof T;
  onSortChange?: (sort: SortState) => void;
}

export function DataGrid<T>({
  columns,
  data,
  pagination,
  rowKey,
  onSortChange,
}: DataGridProps<T>) {
  const {
    page,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = ["10", "20", "30"],
  } = pagination;

  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: null,
  });

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

  return (
    <div>
      <table className="min-w-full table-auto border-gray-300">
        <thead>
          <tr className="font-semibold">
            {columns.map((col, i) => (
              <td
                key={String(col.key)}
                onClick={
                  col.sortable ? () => handleSort(String(col.key)) : undefined
                }
                className={`border-t-0 border-b border-gray-300 bg-gray-100 p-4 ${
                  i === 0 ? "rounded-tl-lg" : ""
                } ${i === columns.length - 1 ? "rounded-tr-lg" : ""} ${
                  col.sortable ? "cursor-pointer select-none" : ""
                }`}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable &&
                    (sortState.key === String(col.key) &&
                    sortState.direction === "desc" ? (
                      <IoMdArrowDropdown
                        fontSize={25}
                        className="text-green-600"
                      />
                    ) : (
                      <IoMdArrowDropup
                        fontSize={25}
                        className={
                          sortState.key === String(col.key)
                            ? "text-green-600"
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
          {data.map((row) => (
            <tr key={String(row[rowKey])} className="">
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className="border-y border-gray-300 p-4"
                >
                  {col.render
                    ? col.render(row)
                    : (row[col.key as keyof T] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-4 flex items-center justify-center gap-4">
        <div
          className={`rounded-md border border-gray-300 ${
            page - 1 < 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          <GoChevronLeft
            fontSize={28}
            color="gray"
            onClick={() => {
              if (page - 1 < 0) return;
              onPageChange(page - 1);
            }}
          />
        </div>

        <span className="text-gray-600">
          Page {page + 1} of {totalPages}
        </span>

        <div
          className={`rounded-md border border-gray-300 ${
            page + 1 >= (totalPages ?? 0)
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer"
          }`}
        >
          <GoChevronRight
            fontSize={28}
            color="gray"
            onClick={() => {
              if ((totalPages ?? 0) <= page + 1) return;
              onPageChange(page + 1);
            }}
          />
        </div>

        <div className="text-gray-600">
          Rows:{" "}
          <TableDropDown
            options={pageSizeOptions}
            defaultValue={pageSize}
            onChange={onPageSizeChange}
          />
        </div>
      </div>
    </div>
  );
}
