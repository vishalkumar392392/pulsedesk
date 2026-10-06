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
import { CreateUserModal } from "./CreateUserModal";
import { IoAdd } from "react-icons/io5";
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
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createdUserName, setCreatedUserName] = useState("");
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
      {isCreateUserOpen && (
        <CreateUserModal
          onClose={() => setIsCreateUserOpen(false)}
          onCreated={(user) => {
            setIsCreateUserOpen(false);
            setCreatedUserName(user.name);
            setPage(0);
          }}
        />
      )}
      {createdUserName && (
        <div
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {titleCase(createdUserName)} was created successfully.
        </div>
      )}

      {/* Toolbar — stack on mobile */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <form className="w-full sm:w-auto sm:min-w-[180px]">
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
        <button
          type="button"
          onClick={() => {
            setCreatedUserName("");
            setIsCreateUserOpen(true);
          }}
          className="bg-blaze-haze-700 hover:bg-blaze-haze-600 inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white shadow-sm transition-colors"
        >
          <IoAdd aria-hidden="true" fontSize={20} />
          Add user
        </button>
      </div>

      {/* Mobile card list — visible on < lg */}
      <div className="lg:hidden space-y-3">
        {users.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No users found.</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{titleCase(user.name)}</p>
                  <p className="mt-0.5 text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${userStatusStyle(user.status)}`}
                >
                  {titleCase(user.status)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{titleCase(user.role)}</span>
                <button
                  type="button"
                  onClick={() => setEditingUser(user)}
                  className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
        {/* Mobile pagination */}
        {data && (data.totalElements ?? 0) >= 10 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">Page {page + 1} of {data?.totalPages}</span>
            <button
              disabled={page + 1 >= (data?.totalPages ?? 0)}
              onClick={() => setPage(page + 1)}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Desktop table — hidden on < lg */}
      <div className="hidden lg:block">
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
    </div>
  );
};

