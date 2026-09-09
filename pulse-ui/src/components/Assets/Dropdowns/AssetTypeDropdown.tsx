import { useState } from "react";
import { useForm } from "react-hook-form";
import { DropDown } from "../../Util/DropDown";

const TYPE_DROPDOWN_VALUES: Array<string> = [
  "All",
  "Dock",
  "Keyboard",
  "Laptop",
  "Monitor",
  "Phone",
];

interface FormData {
  value: string;
}

interface AssetTypeDropdownProps {
  setType: (a: string) => void;
}
export const AssetTypeDropdown = ({ setType }: AssetTypeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { control } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      value: "All",
    },
  });
  return (
    <div className="my-2">
      <form>
        <DropDown
          data={isOpen}
          setData={setIsOpen}
          control={control}
          values={TYPE_DROPDOWN_VALUES}
          label="Type"
          onSelect={(value) => {
            setType(value);
          }}
          name="value"
        />
      </form>
    </div>
  );
};
