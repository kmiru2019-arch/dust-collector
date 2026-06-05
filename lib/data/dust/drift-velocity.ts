// EP 드리프트 속도 (m/s) — 분진 종류별
// 출처: EPA Lesson 3 ESP, Theodore "Air Pollution Control Equipment"

export const DRIFT_VELOCITY: Record<string, [number, number]> = {
  fly_ash:           [0.05, 0.15],
  cement_kiln:       [0.06, 0.08],
  cement_dust:       [0.05, 0.10],
  pulp_black_liquor: [0.10, 0.20],
  carbon_black:      [0.05, 0.10],
  alumina:           [0.20, 0.30],
  iron_oxide:        [0.10, 0.20],
  limestone:         [0.15, 0.25],
  glass_dust:        [0.06, 0.10],
  msw_fly_ash:       [0.04, 0.08],
  generic:           [0.07, 0.12],
};

export function lookupDriftVelocity(industry?: string): [number, number] {
  if (!industry) return DRIFT_VELOCITY.generic;
  const direct: Record<string, string> = {
    cement_kiln: "cement_kiln",
    cement_mill: "cement_dust",
    coal_power: "fly_ash",
    msw_incineration: "msw_fly_ash",
    iron_eaf: "iron_oxide",
    glass_furnace: "glass_dust",
  };
  const key = direct[industry] ?? "generic";
  return DRIFT_VELOCITY[key] ?? DRIFT_VELOCITY.generic;
}
