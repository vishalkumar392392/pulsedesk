import DashboardContent from "../Dashboard/DashboardContent";
import Icon from "../Dashboard/Icon";

export const DesktopDashboard = () => {
  return (
    <div className="flex h-screen w-screen gap-10 px-10">
      <Icon />
      <DashboardContent />
    </div>
  );
};
