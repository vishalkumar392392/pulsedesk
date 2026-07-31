import { DesktopDashboard } from "../Desktop/DesktopDashboard";
import { MobileDashboard } from "../Mobile/MobileDashboard";

const Dashboard = () => {
  return (
    <div className="">
      <div className="block sm:hidden">
        <MobileDashboard />
      </div>
      <div className="hidden sm:block">
        <DesktopDashboard />
      </div>
    </div>
  );
};

export default Dashboard;
