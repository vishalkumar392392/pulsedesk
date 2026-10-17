import { NavLink, useNavigate } from "react-router";
import { ROUTES as DEFAULT_ROUTES, getStoredUser } from "../../util/helper";
import { canViewNavigationItem } from "../../util/accessControl";
import { authStorage } from "../../services/auth/authStorage";

export const NavItems = ({
  isHamburgerMenuClicked = true,
  setIsHamburgerMenuClicked = () => {},
  ROUTES = DEFAULT_ROUTES,
  variant = "default",
}: {
  isHamburgerMenuClicked?: boolean;
  setIsHamburgerMenuClicked?: (isClicked: boolean) => void;
  ROUTES?: Record<string, React.ReactNode>;
  variant?: "default" | "touch";
}) => {
  const navigate = useNavigate();
  const role = getStoredUser()?.role;
  const visibleRoutes = Object.entries(ROUTES).filter(([item]) =>
    canViewNavigationItem(item, role),
  );

  const logout = () => {
    authStorage.clear();
    setIsHamburgerMenuClicked(false);
    navigate("/login", { replace: true });
  };

  const itemClassName = (isActive: boolean) =>
    variant === "touch"
      ? `flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left text-base ${
          isActive
            ? "bg-blaze-haze-200 text-pulse-green font-semibold"
            : "text-gray-700 hover:bg-gray-100"
        }`
      : `flex w-full cursor-pointer items-center gap-1.5 rounded-sm py-1 text-left sm:py-2 ${
          isActive
            ? "bg-blaze-haze-200 underline underline-offset-2"
            : "hover:bg-gray-100"
        }`;

  return (
    <div>
      {isHamburgerMenuClicked === true && (
        <div>
          <ul>
            {visibleRoutes.map(([key, icon]) => {
              const isLogout = key === "Logout";

              return (
                <li key={key}>
                  {key === "Settings" ? (
                    <hr
                      className={`my-3 border-gray-300 ${variant === "touch" ? "w-full" : "w-[95%]"}`}
                    />
                  ) : null}
                  {isLogout ? (
                    <button
                      type="button"
                      onClick={logout}
                      className={itemClassName(false)}
                    >
                      {icon}
                      {key}
                    </button>
                  ) : (
                    <NavLink
                      to={`/${key.toLowerCase()}`}
                      onClick={() => setIsHamburgerMenuClicked(false)}
                      className={({ isActive }) => itemClassName(isActive)}
                    >
                      {icon}
                      {key}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
