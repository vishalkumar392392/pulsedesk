import { MdSpaceDashboard } from "react-icons/md";
import { BsTicketPerforated } from "react-icons/bs";
import { BsFillLaptopFill } from "react-icons/bs";
import { HiUserCircle } from "react-icons/hi2";
import { IoTriangle } from "react-icons/io5";

export type RouteProp = Record<string, React.ReactNode>;

export const ROUTES: RouteProp = {
  Dashboard: <MdSpaceDashboard />,
  Tickets: <BsTicketPerforated />,
  Assets: <BsFillLaptopFill />,
  Users: <HiUserCircle />,
  Reports: <IoTriangle />,
};
