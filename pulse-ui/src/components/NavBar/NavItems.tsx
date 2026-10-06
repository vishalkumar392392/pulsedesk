import { NavLink, useNavigate } from "react-router";
import { ROUTES as DEFAULT_ROUTES, getStoredUser } from "../../util/helper";
import { canViewNavigationItem } from "../../util/accessControl";
import { authStorage } from "../../services/auth/authStorage";

export const NavItems = ({
  setIsHamburgerMenuClicked = () => {},
  ROUTES = DEFAULT_ROUTES,
  onNavItemClick,
}: {
  isHamburgerMenuClicked?: boolean;
  setIsHamburgerMenuClicked?: (isClicked: boolean) => void;
  ROUTES?: Record<string, React.ReactNode>;
  onNavItemClick?: () => void;
}) => {
  const navigate = useNavigate();
  const role = getStoredUser()?.role;
  const visibleRoutes = Object.entries(ROUTES).filter(([item]) =>
    canViewNavigationItem(item, role),
  );

  const logout = () => {
    authStorage.clear();
    setIsHamburgerMenuClicked(false);
    onNavItemClick?.();
    navigate("/login", { replace: true });
  };

  const itemClassName = (isActive: boolean) =>
    `flex w-full cursor-pointer items-center gap-2 rounded-lg py-2 px-3 text-left text-sm font-medium transition-colors ${
      isActive
        ? "bg-blaze-haze-200 text-pulse-green underline underline-offset-2"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div>
      <ul className="space-y-0.5">
        {visibleRoutes.map(([key, icon]) => {
          const isLogout = key === "Logout";

          return (
            <li key={key}>
              {key === "Settings" ? (
                <hr className="my-3 w-[95%] border-gray-300" />
              ) : null}
              {isLogout ? (
                <button
                  type="button"
                  onClick={logout}
                  className={itemClassName(false)}
                >
                  <span className="text-base">{icon}</span>
                  {key}
                </button>
              ) : (
                <NavLink
                  to={`/${key.toLowerCase()}`}
                  onClick={() => {
                    setIsHamburgerMenuClicked(false);
                    onNavItemClick?.();
                  }}
                  className={({ isActive }) => itemClassName(isActive)}
                >
                  <span className="text-base">{icon}</span>
                  {key}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

