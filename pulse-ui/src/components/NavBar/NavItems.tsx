import { useState } from "react";
import { ROUTES } from "../../util/helper";

export const NavItems = ({
  isHamburgerMenuClicked,
}: {
  isHamburgerMenuClicked: boolean;
}) => {
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");
  return (
    <div>
      {isHamburgerMenuClicked === true && (
        <div>
          <ul>
            {Object.keys(ROUTES).map((key: string) => (
              <li
                key={key}
                onClick={() => setSelectedMenu(key)}
                className={`active:bg-blaze-haze-100 flex cursor-pointer items-center gap-1.5 rounded-sm py-1 ${selectedMenu === key ? "bg-blaze-haze-100 underline underline-offset-2" : ""}`}
              >
                {ROUTES[key]}
                {key}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
