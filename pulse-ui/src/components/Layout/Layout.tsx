import { useIsDesktop } from "../../util/useMediaQuery";
import { DesktopLayout } from "./Desktop/DesktopLayout";
import { MobileLayout } from "./Mobile/MobileLayout";

export const Layout = () => {
  // Render a single layout so the routed page (and its queries) mounts once.
  const isDesktop = useIsDesktop();

  return (
    <div className="">{isDesktop ? <DesktopLayout /> : <MobileLayout />}</div>
  );
};
