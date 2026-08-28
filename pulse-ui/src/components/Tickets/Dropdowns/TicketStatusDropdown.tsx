import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DropDown } from "../../Util/DropDown";

const STATUS_DROPDOWN_VALUES: Array<string> = [
  "All",
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
];

interface FormData {
  value: string;
}

interface TicketStatusDropdownProps {
  setPage: (a: number) => void;
  setStatus: (a: string) => void;
}
export const TicketStatusDropdown = ({
  setPage,
  setStatus,
}: TicketStatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { control } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      value: "All",
    },
  });
  const status = useWatch({ control, name: "value", defaultValue: "" });
  setStatus(status);
  return (
    <div>
      <form>
        <DropDown
          data={isOpen}
          setData={setIsOpen}
          control={control}
          values={STATUS_DROPDOWN_VALUES}
          label="Status"
          onSelect={() => setPage(0)}
          name="value"
        />
      </form>
    </div>
  );
};
