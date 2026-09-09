import { useState } from "react";
import { useForm } from "react-hook-form";
import { DropDown } from "../../Util/DropDown";

const STATUS_DROPDOWN_VALUES: Array<string> = [
  "All",
  "In Use",
  "In Stock",
  "Retired",
  "Resolved",
  "Closed",
];

interface FormData {
  value: string;
}

interface AssetStatusDropdownProps {
  setStatus: (a: string) => void;
}
export const AssetStatusDropdown = ({
  setStatus,
}: AssetStatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { control } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      value: "All",
    },
  });
  return (
    <div>
      <form>
        <DropDown
          data={isOpen}
          setData={setIsOpen}
          control={control}
          values={STATUS_DROPDOWN_VALUES}
          label="Status"
          onSelect={(value) => {
            setStatus(value);
          }}
          name="value"
        />
      </form>
    </div>
  );
};
