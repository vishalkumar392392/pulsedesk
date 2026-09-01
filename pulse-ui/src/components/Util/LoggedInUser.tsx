import type { User } from "../../types/user";
import { titleCase } from "../../util/helper";

const getStoredUser = (): User | null => {
  const storedUser =
    localStorage.getItem("user") ?? sessionStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
};

export const LoggedInUser = () => {
  const user = getStoredUser();

  const getIntials = (name: string) => {
    return name
      ?.split(" ")
      .map((item: string) => item.charAt(0))
      .join("")
      .toUpperCase();
  };
  const formatName = (name: string) => {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) return "";

    const firstName = titleCase(nameParts[0]);
    const lastInitial = nameParts.at(-1)?.charAt(0).toUpperCase();

    return nameParts.length > 1 && lastInitial
      ? `${firstName} ${lastInitial}.`
      : firstName;
  };

  if (!user) return null;

  return (
    <div>
      <div className="flex items-center gap-4 rounded-4xl border-2 border-gray-300 px-3 py-1">
        <div className="bg-blaze-haze-200 rounded-full p-1.5 text-sm font-bold">
          {getIntials(user.name)}
        </div>
        <div className="flex flex-col">
          <div className="text-md font-bold">{formatName(user.name)}</div>
          <div className="text-sm text-gray-500">{titleCase(user.role)}</div>
        </div>
      </div>
    </div>
  );
};
