export const assetStatusStyle = (status?: string) => {
  const baseStyle = "inline-flex rounded-full px-3 py-1 text-sm font-semibold";

  switch (status?.replaceAll(" ", "_").toUpperCase()) {
    case "IN_USE":
      return `${baseStyle} bg-blue-50 text-blue-700`;
    case "IN_STOCK":
      return `${baseStyle} bg-emerald-50 text-emerald-700`;
    case "IN_REPAIR":
      return `${baseStyle} bg-amber-50 text-amber-700`;
    case "RETIRED":
      return `${baseStyle} border border-gray-300 bg-gray-50 text-gray-600`;
    default:
      return `${baseStyle} bg-gray-100 text-gray-700`;
  }
};
