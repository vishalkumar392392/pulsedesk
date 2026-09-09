export interface ReportBarItem {
  label: string;
  value: number;
  barClassName: string;
}

interface ReportBarCardProps {
  title: string;
  items: ReportBarItem[];
  maxBarWidth?: number;
  emptyMessage?: string;
}

export const ReportBarCard = ({
  title,
  items,
  maxBarWidth = 85,
  emptyMessage = "No report data for this range",
}: ReportBarCardProps) => {
  const largestValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="min-h-64 rounded-xl border border-gray-300 p-6">
      <h2 className="text-lg font-semibold tracking-widest text-gray-600 uppercase">
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="mt-6 space-y-5">
          {items.map(({ label, value, barClassName }) => {
            const width =
              value === 0 ? 0 : (value / largestValue) * maxBarWidth;

            return (
              <div
                key={label}
                className="grid grid-cols-[7.5rem_minmax(0,1fr)_2rem] items-center gap-4"
              >
                <span className="truncate text-gray-600" title={label}>
                  {label}
                </span>

                <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${barClassName}`}
                    style={{ width: `${width}%` }}
                    role="progressbar"
                    aria-label={`${label}: ${value}`}
                    aria-valuemin={0}
                    aria-valuemax={largestValue}
                    aria-valuenow={value}
                  />
                </div>

                <span className="text-right text-lg text-gray-900">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
