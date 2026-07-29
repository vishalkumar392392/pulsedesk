import { HamburgerMenu } from "../Util/HamburgerMenu";
import { PulseIcon } from "../Util/PulseIcon";

export const MobileView = () => {
  return (
    <div className="flex items-center justify-between p-10">
      <PulseIcon />
      <HamburgerMenu />
    </div>
  );
};
