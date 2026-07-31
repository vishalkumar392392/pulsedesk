import { useState } from "react";
import { NavItems } from "../NavBar/NavItems";
import { HamburgerMenu } from "../Util/HamburgerMenu";
import { PulseIcon } from "../Util/PulseIcon";

export const MobileDashboard = () => {
  const [isHamburgerMenuClicked, setIsHamburgerMenuClicked] = useState(false);
  return (
    <div className="p-10">
      <div className="flex justify-between">
        <PulseIcon />
        <HamburgerMenu
          setIsHamburgerMenuClicked={setIsHamburgerMenuClicked}
          isHamburgerMenuClicked={isHamburgerMenuClicked}
        />
      </div>
      <div className="mt-4 flex flex-col items-center">
        <NavItems isHamburgerMenuClicked={isHamburgerMenuClicked} />
      </div>
    </div>
  );
};
