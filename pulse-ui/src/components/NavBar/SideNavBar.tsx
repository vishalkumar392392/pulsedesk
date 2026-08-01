import { ROUTES } from "../../util/helper";
import { NavItems } from "./NavItems";
import { PulseIcon } from "../Util/PulseIcon";

const SideNavBar = () => {
  return (
    <div className="w-[20%] border-r-[1.5px] border-gray-300 pt-12">
      <PulseIcon />
      <div className="mt-7 flex flex-col">
        <NavItems ROUTES={ROUTES} />
      </div>
    </div>
  );
};

export default SideNavBar;
