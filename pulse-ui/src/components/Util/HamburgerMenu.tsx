import { RxHamburgerMenu } from "react-icons/rx";

type HamburgerMenuProps = {
  setIsHamburgerMenuClicked: (x: boolean) => void;
  isHamburgerMenuClicked: boolean;
};

export const HamburgerMenu = ({
  setIsHamburgerMenuClicked,
  isHamburgerMenuClicked,
}: HamburgerMenuProps) => {
  return (
    <button className="cursor-pointer rounded-lg p-2 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200">
      <RxHamburgerMenu
        onClick={() => setIsHamburgerMenuClicked(!isHamburgerMenuClicked)}
        size={25}
      />
    </button>
  );
};
