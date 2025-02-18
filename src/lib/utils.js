import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatDate(date) {
    return format(date, "HH:mm:ss");
}
export function formatNumber(value, decimals = 1) {
    return value.toFixed(decimals);
}
export const TIMEFRAMES = [
    { label: "3 minutes", value: "3m" },
    { label: "1 hour", value: "1h" },
    { label: "24 hours", value: "24h" },
    { label: "1 week", value: "1w" },
    { label: "1 month", value: "1m" },
    { label: "1 year", value: "1y" },
];
