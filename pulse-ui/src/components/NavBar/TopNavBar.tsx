import { Outlet } from "react-router";
import { LoggedInUser } from "../Util/LoggedInUser";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { NotificationBell } from "../Notifications/NotificationBell";

const TopNavBar = () => {
  return (
    <div className="flex-1">
      <div className="flex w-full items-center justify-between py-10">
        <PageBreadcrumb />
        <div className="flex items-center gap-3">
          <NotificationBell />
          <LoggedInUser />
        </div>
      </div>
      {/* <hr className="mb-5 border-gray-300" /> */}
      <Outlet />
    </div>
  );
};

export default TopNavBar;
