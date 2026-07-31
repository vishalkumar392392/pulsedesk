import { NavItems } from "../../../NavBar/NavItems";
import { PulseIcon } from "../../../Util/PulseIcon";

const SideBar = () => {
  return (
    <div className="w-[30%] border-r-[1.5px] border-gray-300 pt-12">
      <PulseIcon />
      <div className="mt-7 flex flex-col">
        <NavItems />
      </div>
    </div>
  );
};

export default SideBar;
