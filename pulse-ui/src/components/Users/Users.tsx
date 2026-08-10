import { useState } from "react";
import { useForm } from "react-hook-form";
import { DropDown } from "../Util/DropDown";
import { useGetUsersQuery } from "../../services/users/userApi";
import type { User } from "../../types/user";
import { titleCase } from "../../util/helper";
import { GoChevronRight } from "react-icons/go";
import { GoChevronLeft } from "react-icons/go";
import { TableDropDown } from "../Util/TableDropDown";
const DROPDOWN_VALUES: Array<string> = ["All", "Employee", "Agent"];
interface FormData {
  value: string;
}
export const Users = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { control, getValues } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      value: "",
    },
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState("10");

  const { data } = useGetUsersQuery({
    page: page,
    pageSize: Number(pageSize),
    role: getValues("value"),
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
        />
      </form>
      <br />
      <div>
        <table className="min-w-full table-auto border-gray-300">
          <thead>
            <tr className="font-semibold">
              <td className="rounded-tl-lg border-t-0 border-b border-gray-300 bg-gray-100 p-4">
                NAME
              </td>
              <td className="border-t-0 border-b border-gray-300 bg-gray-100 p-4">
                EMAIL
              </td>
              <td className="border-t-0 border-b border-gray-300 bg-gray-100 p-4">
                ROLE
              </td>
              <td className="border-t-0 border-b border-gray-300 bg-gray-100 p-4">
                STATUS
              </td>
              <th className="rounded-tr-lg border-t-0 border-b border-gray-300 bg-gray-100 p-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="" key={user.id}>
                <td className="border-y border-gray-300 p-4">
                  {titleCase(user.name)}
                </td>
                <td className="border-y border-gray-300 p-4 text-gray-500">
                  {user.email}
                </td>
                <td className="border-y border-gray-300 p-4 text-gray-500">
                  {titleCase(user.role)}
                </td>
                <td className="border-y border-gray-300 p-4">
                  <span className="bg-pulse-green-100 rounded-4xl px-2 py-1 text-sm">
                    {user.status}
                  </span>
                </td>
                <td className="cursor-pointer border-y border-gray-300 p-4">
                  <span className="rounded-md border border-gray-300 px-2 py-1">
                    Edit
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="my-4 flex items-center justify-center gap-4">
          <div
            className={`rounded-md border border-gray-300 ${page - 1 < 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <GoChevronLeft
              fontSize={28}
              color="gray"
              onClick={() => {
                if (page - 1 < 0) {
                  return;
                }
                setPage(page - 1);
              }}
            />
          </div>

          <span className="text-gray-600">
            Page {page + 1} of {data?.totalPages}
          </span>

          <div
            className={`rounded-md border border-gray-300 ${page + 1 >= (data?.totalPages ?? 0) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <GoChevronRight
              fontSize={28}
              color="gray"
              onClick={() => {
                if ((data?.totalPages ?? 0) <= page + 1) {
                  return;
                }
                setPage(page + 1);
              }}
            />
          </div>
          <div className="text-gray-600">
            Rows:{" "}
            <TableDropDown
              options={["10", "20", "30"]}
              defaultValue={pageSize}
              onChange={setPageSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
