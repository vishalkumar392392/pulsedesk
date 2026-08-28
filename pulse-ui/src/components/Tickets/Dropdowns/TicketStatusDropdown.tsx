import { useState } from "react";
import { useForm } from "react-hook-form";
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
            setPage(0);
            setStatus(value);
          }}
          name="value"
        />
      </form>
    </div>
  );
};
