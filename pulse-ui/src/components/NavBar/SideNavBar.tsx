import { ROUTES } from "../../util/helper";
import { NavItems } from "./NavItems";
import { PulseIcon } from "../Util/PulseIcon";
import { IoClose } from "react-icons/io5";

interface SideNavBarProps {
  onClose?: () => void;
}

const SideNavBar = ({ onClose }: SideNavBarProps) => {
  return (
    <div className="bg-pulse-gray flex h-full min-h-screen flex-col border-r-[1.5px] border-gray-300 pt-6 pl-5 pr-4 lg:pt-10 lg:pl-8">
      <div className="flex items-center justify-between">
        <PulseIcon />
        {/* Close button shown only in mobile drawer */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 lg:hidden"
            aria-label="Close navigation"
          >
            <IoClose size={22} />
          </button>
        )}
      </div>
      <div className="mt-7 flex flex-col">
        <NavItems ROUTES={ROUTES} onNavItemClick={onClose} />
      </div>
    </div>
  );
};

export default SideNavBar;

