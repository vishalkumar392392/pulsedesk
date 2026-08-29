import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DropDown } from "../Util/DropDown";
import { useGetUsersQuery } from "../../services/users/userApi";
import type { User } from "../../types/user";
import { titleCase } from "../../util/helper";
import {
  DataGrid,
  type DataGridColumn,
  type SortState,
} from "../Util/DataGrid";
const DROPDOWN_VALUES: Array<string> = ["All", "Employee", "Agent"];

const USER_COLUMNS: DataGridColumn<User>[] = [
  {
    key: "name",
    header: "NAME",
    sortable: true,
    render: (user) => titleCase(user.name),
  },
  {
    key: "email",
    header: "EMAIL",
    render: (user) => <span className="text-gray-500">{user.email}</span>,
  },
  {
    key: "role",
    header: "ROLE",
    render: (user) => (
      <span className="text-gray-500">{titleCase(user.role)}</span>
    ),
  },
  {
    key: "status",
    header: "STATUS",
    render: (user) => (
      <span className="bg-pulse-green-100 rounded-4xl px-2 py-1 text-sm">
        {titleCase(user.status)}
      </span>
    ),
  },
  {
    key: "id",
    header: "",
    render: () => (
      <span className="cursor-pointer rounded-md border border-gray-300 px-2 py-1">
        Edit
      </span>
    ),
  },
];
interface FormData {
  value: string;
}
export const Users = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { control } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      value: "",
    },
  });
  const role = useWatch({ control, name: "value", defaultValue: "" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState("10");
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });

  const { data } = useGetUsersQuery({
    page: page,
    pageSize: Number(pageSize),
    role: role,
    sort: sort.key,
    direction: sort.direction,
  });
  const users: User[] = data?.content || [];

  return (
    <div>
      <form>
        <DropDown
          data={isOpen}
          setData={setIsOpen}
          control={control}
          values={DROPDOWN_VALUES}
          label="Role"
          onSelect={() => setPage(0)}
          name="value"
        />
      </form>
      <br />
      <DataGrid
        columns={USER_COLUMNS}
        data={users}
        rowKey="id"
        onSortChange={setSort}
        pagination={{
          page,
          totalPages: data?.totalPages,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </div>
  );
};
