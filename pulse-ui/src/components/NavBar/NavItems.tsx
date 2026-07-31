import { useState } from "react";
import { ROUTES } from "../../util/helper";
import { useNavigate } from "react-router";

export const NavItems = ({
  isHamburgerMenuClicked = true,
}: {
  isHamburgerMenuClicked?: boolean;
}) => {
  const [selectedMenu, setSelectedMenu] = useState<string>("Dashboard");

  const navigate = useNavigate();

  return (
    <div>
      {isHamburgerMenuClicked === true && (
        <div>
          <ul>
            {Object.keys(ROUTES).map((key: string) => (
              <li
                key={key}
                onClick={() => {
                  setSelectedMenu(key);
                  navigate(`/${key.toLocaleLowerCase()}`);
                }}
                className={`flex cursor-pointer items-center gap-1.5 rounded-sm py-1 ${selectedMenu === key ? "bg-blaze-haze-200 underline underline-offset-2" : ""}`}
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
