import { useState } from "react";
import { Outlet } from "react-router";
import SideNavBar from "../NavBar/SideNavBar";
import TopNavBar from "../NavBar/TopNavBar";

export const Layout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — visible on lg+ screens */}
      <div className="hidden lg:block lg:w-64 xl:w-72 lg:shrink-0">
        <SideNavBar />
      </div>

      {/* Mobile drawer overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in nav drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SideNavBar onClose={() => setIsMobileNavOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavBar
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
        />
        <main className="flex-1 px-4 pb-10 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
