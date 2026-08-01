import { useState } from "react";
import { useNavigate } from "react-router";

export const NavItems = ({
  isHamburgerMenuClicked = true,
  setIsHamburgerMenuClicked = () => {},
  ROUTES,
}: {
  isHamburgerMenuClicked?: boolean;
  setIsHamburgerMenuClicked?: (isClicked: boolean) => void;
  ROUTES: Record<string, React.ReactNode>;
}) => {
  const [selectedMenu, setSelectedMenu] = useState<string>("Dashboard");

  const navigate = useNavigate();

  return (
    <div>
      {isHamburgerMenuClicked === true && (
        <div>
          <ul>
            {Object.keys(ROUTES).map((key: string, index: number) => {
              return (
                <li
                  key={key}
                  onClick={() => {
                    setSelectedMenu(key);
                    setIsHamburgerMenuClicked(!isHamburgerMenuClicked);
                    if (key === "Logout") {
                      navigate("/login");
                      return;
                    }
                    navigate(`/${key.toLocaleLowerCase()}`);
                  }}
                >
                  {index === 5 ? (
                    <hr className="my-3 w-[95%] border-gray-300" />
                  ) : null}
                  <div
                    className={`flex cursor-pointer items-center gap-1.5 rounded-sm py-1 sm:py-2 ${selectedMenu === key ? "bg-blaze-haze-200 underline underline-offset-2" : ""}`}
                  >
                    {ROUTES[key]}
                    {key}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
