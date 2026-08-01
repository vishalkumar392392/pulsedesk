import { MdSpaceDashboard } from "react-icons/md";
import { BsTicketPerforated } from "react-icons/bs";
import { BsFillLaptopFill } from "react-icons/bs";
import { HiUserCircle } from "react-icons/hi2";
import { IoTriangle } from "react-icons/io5";
import { MdOutlineSettings } from "react-icons/md";
import { IoMdLogOut } from "react-icons/io";

export type RouteProp = Record<string, React.ReactNode>;

export const ROUTES: RouteProp = {
  Dashboard: <MdSpaceDashboard />,
  Tickets: <BsTicketPerforated />,
  Assets: <BsFillLaptopFill />,
  Users: <HiUserCircle />,
  Reports: <IoTriangle />,
  Settings: <MdOutlineSettings />,
  Logout: <IoMdLogOut />,
};

export const titleCase = (input: string) => {
  return (
    input.charAt(0).toUpperCase() +
    input
      .split("")
      .filter((_, index) => index != 0)
      .map((ch) => ch)
      .toString()
      .replaceAll(",", "")
  );
};
