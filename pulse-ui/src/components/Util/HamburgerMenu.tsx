import { RxHamburgerMenu } from "react-icons/rx";

export const HamburgerMenu = () => {
  return (
    <button className="cursor-pointer rounded-lg p-2 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200">
      <RxHamburgerMenu size={25} />
    </button>
  );
};
