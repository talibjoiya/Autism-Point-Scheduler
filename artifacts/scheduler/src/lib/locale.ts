export const TZ = "Asia/Karachi";
export const CURRENCY = "PKR";
export const CURRENCY_SYMBOL = "₨";

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDayOfWeek(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date(date));
}

export function formatFullDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || amount === 0) return "Free";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isSamePKTDay(date1: Date | string, date2: Date | string): boolean {
  const opts: Intl.DateTimeFormatOptions = { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" };
  const fmt = new Intl.DateTimeFormat("en-CA", opts);
  return fmt.format(new Date(date1)) === fmt.format(new Date(date2));
}

export function subDaysPKT(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}
