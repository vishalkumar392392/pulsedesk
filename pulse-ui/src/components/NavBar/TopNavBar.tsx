import { Outlet } from "react-router";
import { TextInput } from "../Util/TextInput";
import { LoggedInUser } from "../Util/LoggedInUser";

const TopNavBar = () => {
  return (
    <div className="flex-1">
      <div className="flex w-full items-center justify-between py-10">
        <TextInput />
        <div>
          <div></div>
          <div>
            <LoggedInUser />
          </div>
        </div>
      </div>
      <hr className="mb-5 border-gray-300" />
      <Outlet />
    </div>
  );
};

export default TopNavBar;
