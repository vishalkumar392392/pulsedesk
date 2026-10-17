import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { NavItems } from "../../NavBar/NavItems";
import { LoggedInUser } from "../../Util/LoggedInUser";
import { PulseIcon } from "../../Util/PulseIcon";
import { useBodyScrollLock } from "../../Util/useBodyScrollLock";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer = ({ isOpen, onClose }: MobileNavDrawerProps) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <nav
        aria-label="Main navigation"
        inert={!isOpen}
        className={`bg-pulse-gray absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-gray-300 shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
          <PulseIcon />
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <IoClose size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <LoggedInUser />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <NavItems
            variant="touch"
            isHamburgerMenuClicked
            setIsHamburgerMenuClicked={(isClicked) => {
              if (!isClicked) onClose();
            }}
          />
        </div>
      </nav>
    </div>
  );
};
