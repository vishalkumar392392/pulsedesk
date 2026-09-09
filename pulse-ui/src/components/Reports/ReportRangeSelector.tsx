import { useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";

export type ReportRangeDays = 7 | 30 | 90;

interface ReportRangeSelectorProps {
  value: ReportRangeDays;
  onChange: (value: ReportRangeDays) => void;
}

const RANGE_OPTIONS: Array<{ label: string; value: ReportRangeDays }> = [
  { label: "Last 7d", value: 7 },
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
];

export const ReportRangeSelector = ({
  value,
  onChange,
}: ReportRangeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel =
    RANGE_OPTIONS.find((option) => option.value === value)?.label ??
    `Last ${value}d`;

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-left hover:bg-gray-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="font-medium">Range:</span>
        <span>{selectedLabel}</span>
        <IoMdArrowDropdown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-gray-300 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label="Report date range"
        >
          {RANGE_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${option.value === value ? "bg-blaze-haze-100 text-pulse-green font-medium" : ""}`}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
