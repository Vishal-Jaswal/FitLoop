import type { WeightUnit } from "./types";

export function weightToKg(value: number, unit: WeightUnit): number {
  return unit === "lb" ? Math.round(value * 0.45359237 * 1000) / 1000 : value;
}

export function kgToWeight(value: number, unit: WeightUnit): number {
  return unit === "lb" ? Math.round(value / 0.45359237 * 10) / 10 : value;
}
