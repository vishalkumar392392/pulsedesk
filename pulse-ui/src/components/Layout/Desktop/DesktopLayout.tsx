import SideNavBar from "../../NavBar/SideNavBar";
import SearchInput from "../../NavBar/TopNavBar";

export const DesktopLayout = () => {
  return (
    <div className="flex min-h-screen gap-10 pr-10">
      <SideNavBar />
      <SearchInput />
    </div>
  );
};
