import { GoChevronRight } from "react-icons/go";
import { Link, useLocation } from "react-router";
import { ROUTES, titleCase } from "../../util/helper";

const ROUTE_LABELS: Record<string, string> = {
  assets: "Assets",
  create: "New Ticket",
  dashboard: "Dashboard",
  example: "Example",
  "not-authorized": "Not Authorized",
  reports: "Reports",
  settings: "Settings",
  tickets: "Tickets",
  users: "Users",
};

const PAGE_CONTEXT: Record<string, string> = {
  assets: "Inventory management",
  create: "Create support request",
  dashboard: "Workspace overview",
  example: "Component preview",
  "not-authorized": "Access restricted",
  reports: "Performance insights",
  settings: "Account settings",
  tickets: "Support workspace",
  users: "Team directory",
};

const getSegmentLabel = (segment: string) => {
  if (ROUTE_LABELS[segment]) return ROUTE_LABELS[segment];
  if (/^\d+$/.test(segment)) return `#${segment}`;

  return titleCase(decodeURIComponent(segment));
};

export const PageBreadcrumb = () => {
  const { pathname } = useLocation();
  const pathSegments = pathname.split("/").filter(Boolean);
  const segments = pathSegments.length > 0 ? pathSegments : ["dashboard"];
  const currentSegment = segments.at(-1) ?? "dashboard";
  const sectionLabel = getSegmentLabel(segments[0]);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="bg-blaze-haze-200 text-pulse-green ring-blaze-haze-200 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm ring-1 sm:h-11 sm:w-11 sm:text-xl">
        {ROUTES[sectionLabel] ?? (
          <span className="bg-pulse-green h-3 w-3 rounded-sm" />
        )}
      </div>

      <div className="min-w-0">
        {/* Context subtitle — hidden on mobile */}
        <p className="text-blaze-haze-700 mb-0.5 hidden text-[0.65rem] font-bold tracking-[0.18em] uppercase sm:block">
          {PAGE_CONTEXT[currentSegment] ?? "PulseDesk workspace"}
        </p>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-base font-semibold leading-tight sm:gap-1.5 sm:text-xl">
            {segments.map((segment, index) => {
              const isCurrentPage = index === segments.length - 1;
              const route = `/${segments.slice(0, index + 1).join("/")}`;
              const label = getSegmentLabel(segment);

              return (
                <li key={route} className="flex items-center gap-1 sm:gap-1.5">
                  {index > 0 && (
                    <GoChevronRight
                      className="text-base text-gray-400"
                      aria-hidden="true"
                    />
                  )}
                  {isCurrentPage ? (
                    <span className="text-gray-800 truncate max-w-[8rem] sm:max-w-none" aria-current="page">
                      {label}
                    </span>
                  ) : (
                    <Link
                      to={route}
                      className="hover:text-blaze-haze-700 text-gray-500 transition-colors"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};

