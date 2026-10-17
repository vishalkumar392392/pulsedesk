import { useCallback, useState } from "react";
import { Outlet } from "react-router";
import { RxHamburgerMenu } from "react-icons/rx";
import { NotificationBell } from "../../Notifications/NotificationBell";
import { PageBreadcrumb } from "../../NavBar/PageBreadcrumb";
import { LoggedInUser } from "../../Util/LoggedInUser";
import { PulseIcon } from "../../Util/PulseIcon";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { MobileTabBar } from "./MobileTabBar";

// Phones (< md) navigate with a bottom tab bar; tablets (md – lg) use the
// hamburger drawer. Both share the same drawer for the full menu.
export const MobileLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openMenu}
              className="-ml-2 hidden size-10 cursor-pointer items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 md:flex"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <RxHamburgerMenu size={24} aria-hidden="true" />
            </button>
            <PulseIcon />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <LoggedInUser compact />
          </div>
        </div>
      </header>

      <MobileNavDrawer isOpen={isMenuOpen} onClose={closeMenu} />

      <main className="px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-6 md:pb-10">
        <div className="mb-5 md:mb-6">
          <PageBreadcrumb />
        </div>
        <Outlet />
      </main>

      <MobileTabBar onOpenMenu={openMenu} />
    </div>
  );
};
