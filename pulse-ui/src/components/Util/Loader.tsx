import { useSelector } from "react-redux";

import type { RootState } from "../../app/store";

const Loader = () => {
  const loadingCount = useSelector(
    (state: RootState) => state.loader.loadingCount,
  );

  if (loadingCount === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
      <div className="dot-spinner">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="dot-spinner__dot" />
        ))}
      </div>
    </div>
  );
};

export default Loader;
