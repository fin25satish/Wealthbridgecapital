import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || isNaN(value)) return 'N/A'
  if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (Math.abs(value) >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`
  if (Math.abs(value) >= 1e5) return `${(value / 1e5).toFixed(2)}L`
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return 'N/A'
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toFixed(2)
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return 'N/A'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function getChangeColor(value: number | null | undefined): string {
  if (value == null) return 'text-slate-400'
  return value >= 0 ? 'text-success' : 'text-danger'
}
