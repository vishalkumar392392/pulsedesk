import { DesktopLayout } from "./Desktop/DesktopLayout";
import { MobileLayout } from "./Mobile/MobileLayout";

export const Layout = () => {
  return (
    <div className="">
      <div className="block sm:hidden">
        <MobileLayout />
      </div>
      <div className="hidden sm:block">
        <DesktopLayout />
      </div>
    </div>
  );
};
