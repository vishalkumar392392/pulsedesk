import { DesktopDashboard } from "./View/DesktopDashboard";
import { MobileDashboard } from "./View/MobileDashboard";

const Dashboard = () => {
  return (
    <div className="">
      <div className="block md:hidden">
        <MobileDashboard />
      </div>
      <div className="hidden md:block">
        <DesktopDashboard />
      </div>
    </div>
  );
};

export default Dashboard;
