import { LoggedInUser } from "../Util/LoggedInUser";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { NotificationBell } from "../Notifications/NotificationBell";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoClose } from "react-icons/io5";

interface TopNavBarProps {
  isMobileNavOpen?: boolean;
  setIsMobileNavOpen?: (open: boolean) => void;
}

const TopNavBar = ({ isMobileNavOpen, setIsMobileNavOpen }: TopNavBarProps) => {
  return (
    <header className="flex w-full items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-5 sm:py-4 md:px-6 lg:border-b-0 lg:bg-transparent lg:py-6 lg:px-8">
      {/* Hamburger button — only on mobile/tablet */}
      <button
        type="button"
        onClick={() => setIsMobileNavOpen?.(!isMobileNavOpen)}
        className="mr-3 cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 lg:hidden"
        aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isMobileNavOpen}
      >
        {isMobileNavOpen ? <IoClose size={22} /> : <RxHamburgerMenu size={22} />}
      </button>

      <div className="min-w-0 flex-1">
        <PageBreadcrumb />
      </div>

      <div className="ml-3 flex items-center gap-3">
        <NotificationBell />
        <LoggedInUser />
      </div>
    </header>
  );
};

export default TopNavBar;

