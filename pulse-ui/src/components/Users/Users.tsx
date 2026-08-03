import { useState } from "react";
import { useForm } from "react-hook-form";
import { DropDown } from "../Util/DropDown";
import { useGetUsersQuery } from "../../services/users/userApi";
import type { User } from "../../types/user";
import { titleCase } from "../../util/helper";

const DROPDOWN_VALUES: Array<string> = ["All", "Employee", "Agent"];
interface FormData {
  value: string;
}
export const Users = () => {
  const [role, setRole] = useState(false);
  const { data } = useGetUsersQuery();
  const users: User[] = data ?? [];

  const { control } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      value: "",
    },
  });

  return (
    <div>
      <form>
        <DropDown
          data={role}
          setData={setRole}
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
      </div>
    </div>
  );
};
