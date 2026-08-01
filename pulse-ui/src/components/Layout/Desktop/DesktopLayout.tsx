import SideNavBar from "../../NavBar/SideNavBar";
import SearchInput from "../../NavBar/TopNavBar";

export const DesktopLayout = () => {
  return (
    <div className="flex h-screen w-screen gap-10 px-10">
      <SideNavBar />
      <SearchInput />
    </div>
  );
};
