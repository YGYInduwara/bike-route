import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLKR(amount: number): string {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("en-LK", { maximumFractionDigits: 1 })} km`;
}

export function formatLiters(l: number): string {
  return `${l.toFixed(2)} L`;
}

export function formatKmpl(kmpl: number): string {
  return `${kmpl.toFixed(1)} km/L`;
}
