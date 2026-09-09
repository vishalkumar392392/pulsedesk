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
    <section className="min-h-36 rounded-xl border border-gray-300 px-6 py-5">
      <h2 className="text-sm font-medium tracking-widest text-gray-600 uppercase">
        {label}
      </h2>
      <p className={`mt-3 text-3xl font-light ${valueClassName}`}>{value}</p>
    </section>
  );
};
