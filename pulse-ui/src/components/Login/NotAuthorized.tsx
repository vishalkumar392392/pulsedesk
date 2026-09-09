import { MdBlock } from "react-icons/md";
import { Link } from "react-router";

export const NotAuthorized = () => {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-lg rounded-2xl border border-gray-300 bg-white p-10 text-center shadow-sm">
        <div className="bg-blaze-haze-200 text-pulse-green mx-auto flex size-14 items-center justify-center rounded-2xl">
          <MdBlock className="text-3xl" aria-hidden="true" />
        </div>
        <p className="text-blaze-haze-700 mt-5 text-sm font-bold tracking-widest uppercase">
          403
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Not authorized
        </h1>
        <p className="mt-3 text-gray-600">
          Your account does not have permission to view this page.
        </p>
        <Link
          to="/dashboard"
          className="bg-blaze-haze-700 hover:bg-blaze-haze-600 mt-7 inline-flex rounded-xl px-5 py-2.5 font-semibold text-white transition"
        >
          Go to Dashboard
        </Link>
      </section>
    </main>
  );
};
