import DashboardContent from "../DashboardContent";
import Icon from "../Icon";

export const DesktopDashboard = () => {
  return (
    <div className="flex h-screen w-screen md:gap-5 md:px-5 lg:gap-10 lg:px-10">
      <Icon />
      <DashboardContent />
    </div>
  );
};
