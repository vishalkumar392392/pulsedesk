import SideBar from "./AppShell/SideBar";
import SearchInput from "./AppShell/SearchInput";

export const DesktopLayout = () => {
  return (
    <div className="flex h-screen w-screen gap-10 px-10">
      <SideBar />
      <SearchInput />
    </div>
  );
};
