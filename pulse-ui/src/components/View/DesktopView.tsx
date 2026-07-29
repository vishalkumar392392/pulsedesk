import DashboardContent from "../Dashboard/DashboardContent";
import SideBar from "../Dashboard/SideBar";

export const DesktopView = () => {
  return (
    <div className="view flex h-screen w-screen justify-center gap-5 p-5">
      <SideBar />
      <DashboardContent />
    </div>
  );
};
