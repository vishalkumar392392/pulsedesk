import { DesktopLayout } from "./Desktop/DesktopLayout";

export const Layout = () => {
  return (
    <div className="">
      {/* <div className="block sm:hidden">
        <MobileLayout />
      </div> */}
      <div>
        <DesktopLayout />
      </div>
    </div>
  );
};
