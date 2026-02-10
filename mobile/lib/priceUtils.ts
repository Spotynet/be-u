/**
 * Format a price with comma as thousand separator and no decimals.
 * e.g. 1000 -> "$1,000", 1500.99 -> "$1,501"
 */
export function formatPrice(
  price: number | string,
  options?: { suffix?: string }
): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(num)) return "$0";
  const integer = Math.round(num);
  const withCommas = integer.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formatted = `$${withCommas}`;
  return options?.suffix ? `${formatted}${options.suffix}` : formatted;
}
