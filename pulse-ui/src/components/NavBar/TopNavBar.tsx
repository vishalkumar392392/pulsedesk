import { Outlet } from "react-router";
import { LoggedInUser } from "../Util/LoggedInUser";
import { PageBreadcrumb } from "./PageBreadcrumb";

const TopNavBar = () => {
  return (
    <div className="flex-1">
      <div className="flex w-full items-center justify-between py-10">
        <PageBreadcrumb />
        <div>
          <div></div>
          <div>
            <LoggedInUser />
          </div>
        </div>
      </div>
      {/* <hr className="mb-5 border-gray-300" /> */}
      <Outlet />
    </div>
  );
};

export default TopNavBar;
