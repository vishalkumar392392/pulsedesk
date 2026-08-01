import { titleCase } from "../../util/helper";

type UserProps = {
  name: string;
  role: "admin" | "employee" | "agent";
};
export const LoggedInUser = () => {
  const user: UserProps = {
    name: "vishal palla",
    role: "admin",
  };
  const getIntials = (name: string) => {
    return name
      ?.split(" ")
      .map((item: string) => item.charAt(0))
      .join("")
      .toUpperCase();
  };
  const formatName = (name: string) => {
    const firstName = name.split(" ");
    return titleCase(firstName[0]) + " " + titleCase(firstName[1][0]) + ".";
  };
  return (
    <div>
      <div className="flex items-center gap-4 rounded-4xl border-2 border-gray-300 px-3 py-1">
        <div className="bg-blaze-haze-200 rounded-full p-1.5 text-sm font-bold">
          {getIntials(user.name)}
        </div>
        <div className="flex flex-col">
          <div className="text-md font-bold">{formatName(user?.name)}</div>
          <div className="text-sm text-gray-500">{titleCase(user?.role)}</div>
        </div>
      </div>
    </div>
  );
};
