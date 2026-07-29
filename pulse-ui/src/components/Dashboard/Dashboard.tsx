import { DesktopView } from "../View/DesktopView";
import { MobileView } from "../View/MobileView";

const Dashboard = () => {
  return (
    <div className="bg-blaze-haze">
      <div className="block md:hidden">
        <MobileView />
      </div>
      <div className="hidden md:block">
        <DesktopView />
      </div>
    </div>
  );
};

export default Dashboard;
