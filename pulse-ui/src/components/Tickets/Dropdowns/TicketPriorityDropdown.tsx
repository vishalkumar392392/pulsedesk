import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DropDown } from "../../Util/DropDown";

const PRIORITY_DROPDOWN_VALUES: Array<string> = [
  "All",
  "Low",
  "Medium",
  "High",
];

interface FormData {
  value: string;
}

interface TicketPriorityDropdownProps {
  setPage: (a: number) => void;
  setPriority: (a: string) => void;
}
export const TicketPriorityDropdown = ({
  setPage,
  setPriority,
}: TicketPriorityDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { control } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      value: "All",
    },
  });
  const priority = useWatch({ control, name: "value", defaultValue: "" });
  setPriority(priority);
  return (
    <div className="my-2">
      <form>
        <DropDown
          data={isOpen}
          setData={setIsOpen}
          control={control}
          values={PRIORITY_DROPDOWN_VALUES}
          label="Priority"
          onSelect={() => setPage(0)}
          name="value"
        />
      </form>
    </div>
  );
};
