import { useMemo } from "react";
import type { Ticket } from "../../types/ticket";

type Priority = Ticket["priority"];

interface PriorityBreakdownProps {
  tickets: ReadonlyArray<Pick<Ticket, "priority">>;
}

const PRIORITY_ROWS: Array<{
  priority: Priority;
  label: string;
  barClassName: string;
}> = [
  { priority: "HIGH", label: "High", barClassName: "bg-red-700" },
  { priority: "MEDIUM", label: "Medium", barClassName: "bg-amber-600" },
  { priority: "LOW", label: "Low", barClassName: "bg-slate-600" },
];

export const PriorityBreakdown = ({ tickets }: PriorityBreakdownProps) => {
  const counts = useMemo(
    () =>
      tickets.reduce<Record<Priority, number>>(
        (result, ticket) => {
          result[ticket.priority] += 1;
          return result;
        },
        { HIGH: 0, MEDIUM: 0, LOW: 0 },
      ),
    [tickets],
  );

  const highestCount = Math.max(...Object.values(counts), 1);

  return (
    <section className="h-full min-w-0 rounded-xl border border-gray-300 p-6">
      <h2 className="text-lg font-semibold tracking-wider text-gray-600">
        PRIORITY BREAKDOWN
      </h2>

      <div className="mt-6 space-y-5">
        {PRIORITY_ROWS.map(({ priority, label, barClassName }) => {
          const count = counts[priority];
          const width = count === 0 ? 0 : (count / highestCount) * 80;

          return (
            <div
              key={priority}
              className="grid grid-cols-[7rem_minmax(0,1fr)_2rem] items-center gap-4"
            >
              <span className="text-md text-gray-600">{label}</span>

              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${barClassName}`}
                  style={{ width: `${width}%` }}
                  role="progressbar"
                  aria-label={`${label} priority tickets`}
                  aria-valuemin={0}
                  aria-valuemax={highestCount}
                  aria-valuenow={count}
                />
              </div>

              <span className="text-right text-lg text-gray-900">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
