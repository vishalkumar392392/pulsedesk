import { useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";

interface TableDropDownProps {
  options: string[];
  defaultValue?: string;
  onChange: (value: string) => void;
}

export const TableDropDown = ({
  options,
  defaultValue,
  onChange,
}: TableDropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  const handleChange = (value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
    onChange(value);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        <span>{selectedValue}</span>

        <IoMdArrowDropdown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleChange(option)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
