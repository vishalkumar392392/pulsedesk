import { MdSpaceDashboard } from "react-icons/md";
import { BsTicketPerforated } from "react-icons/bs";
import { BsFillLaptopFill } from "react-icons/bs";
import { HiUserCircle } from "react-icons/hi2";
import { IoTriangle } from "react-icons/io5";
import { MdOutlineSettings } from "react-icons/md";
import { IoMdLogOut } from "react-icons/io";
import type { User } from "../types/user";

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
  return input
    .trim()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getStoredUser = (): User | null => {
  const storedUser =
    localStorage.getItem("user") ?? sessionStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
};

export const formatName = (name: string) => {
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length === 0) return "";

  const firstName = titleCase(nameParts[0]);
  const lastInitial = nameParts.at(-1)?.charAt(0).toUpperCase();

  return nameParts.length > 1 && lastInitial
    ? `${firstName} ${lastInitial}.`
    : firstName;
};

export const getBrowserStorage = () => {
  return localStorage.getItem("user") ? localStorage : sessionStorage;
};

export const statusStyle = (status: string) => {
  const baseStyle =
    "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold";

  switch (status) {
    case "OPEN":
      return `${baseStyle} bg-blue-50 text-blue-700`;
    case "IN_PROGRESS":
      return `${baseStyle} bg-amber-50 text-amber-700`;
    case "RESOLVED":
      return `${baseStyle} bg-emerald-50 text-emerald-700`;
    case "CLOSED":
      return `${baseStyle} border border-gray-300 bg-gray-50 text-gray-600`;
    default:
      return `${baseStyle} bg-gray-100 text-gray-700`;
  }
};

export const priorityStyle = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return "bg-red-600";
    case "MEDIUM":
      return "bg-amber-600";
    case "LOW":
      return "bg-slate-600";
    default:
      return "bg-gray-400";
  }
};
