import { RxHamburgerMenu } from "react-icons/rx";
import { NavLink } from "react-router";
import { canViewNavigationItem } from "../../../util/accessControl";
import { getStoredUser, ROUTES } from "../../../util/helper";

const MAX_TABS = 4;
const MENU_ONLY_ITEMS = new Set(["Settings", "Logout"]);

const tabClassName = (isActive: boolean) =>
  `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[0.7rem] font-medium transition-colors ${
    isActive ? "text-pulse-green" : "text-gray-500 hover:text-gray-800"
  }`;

export const MobileTabBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => {
  const role = getStoredUser()?.role;
  const tabs = Object.entries(ROUTES)
    .filter(
      ([item]) =>
        !MENU_ONLY_ITEMS.has(item) && canViewNavigationItem(item, role),
    )
    .slice(0, MAX_TABS);

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {tabs.map(([item, icon]) => (
          <li key={item} className="flex min-w-0 flex-1">
            <NavLink
              to={`/${item.toLowerCase()}`}
              className={({ isActive }) => tabClassName(isActive)}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full text-xl transition-colors ${
                      isActive ? "bg-blaze-haze-200" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                  <span className="truncate">{item}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenMenu}
            className={`${tabClassName(false)} cursor-pointer`}
          >
            <span
              className="flex h-7 w-12 items-center justify-center text-xl"
              aria-hidden="true"
            >
              <RxHamburgerMenu />
            </span>
            <span>Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
