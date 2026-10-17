interface ReportMetricCardProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

export const ReportMetricCard = ({
  label,
  value,
  valueClassName = "text-gray-900",
}: ReportMetricCardProps) => {
  return (
    <section className="min-h-36 rounded-xl border border-gray-300 px-6 py-5 max-sm:min-h-0 max-sm:px-4 max-sm:py-4">
      <h2 className="text-sm font-medium tracking-widest text-gray-600 uppercase max-sm:text-xs max-sm:tracking-wide">
        {label}
      </h2>
      <p
        className={`mt-3 text-3xl font-light max-sm:mt-2 max-sm:text-2xl ${valueClassName}`}
      >
        {value}
      </p>
    </section>
  );
};
