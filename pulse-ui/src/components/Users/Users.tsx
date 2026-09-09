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
import { EditUserModal } from "./EditUserModal";
const DROPDOWN_VALUES: Array<string> = ["All", "Employee", "Agent"];

const userStatusStyle = (status: User["status"]) =>
  status === "ACTIVE"
    ? "bg-pulse-green-100 text-emerald-800"
    : "border border-gray-300 bg-gray-50 text-gray-600";

const getUserColumns = (
  onEdit: (user: User) => void,
): DataGridColumn<User>[] => [
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
      <span
        className={`rounded-4xl px-2 py-1 text-sm ${userStatusStyle(user.status)}`}
      >
        {titleCase(user.status)}
      </span>
    ),
  },
  {
    key: "id",
    header: "",
    render: (user) => (
      <button
        type="button"
        onClick={() => onEdit(user)}
        className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50"
      >
        Edit
      </button>
    ),
  },
];
interface FormData {
  value: string;
}
export const Users = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
  const userColumns = getUserColumns(setEditingUser);

  return (
    <div>
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
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
        columns={userColumns}
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
