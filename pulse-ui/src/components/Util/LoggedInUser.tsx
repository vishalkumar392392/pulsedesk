import { useEffect, useState } from "react";
import { formatName, getStoredUser, titleCase } from "../../util/helper";
import { AUTH_USER_CHANGED_EVENT } from "../../services/auth/authStorage";

export const LoggedInUser = ({ compact = false }: { compact?: boolean }) => {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const refreshUser = () => setUser(getStoredUser());

    window.addEventListener(AUTH_USER_CHANGED_EVENT, refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  const getIntials = (name: string) => {
    return name
      ?.split(" ")
      .map((item: string) => item.charAt(0))
      .join("")
      .toUpperCase();
  };

  if (!user) return null;

  if (compact) {
    return (
      <div
        className="bg-blaze-haze-200 text-pulse-green flex size-10 items-center justify-center rounded-full border-2 border-gray-300 text-sm font-bold"
        title={`${formatName(user.name)} · ${titleCase(user.role)}`}
        aria-label={`Signed in as ${formatName(user.name)}`}
      >
        {getIntials(user.name)}
      </div>
    );
  }

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
