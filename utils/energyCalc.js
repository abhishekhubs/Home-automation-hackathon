export const DEVICE_WATTS = {
  lights: 60, fan: 60, ac: 1500, tv: 200, stove: 2000,
  refrigerator: 150, router: 20, securityCam: 30,
  washingMachine: 800, oven: 2000, speaker: 50, decorativeLights: 120,
};

export const DEVICE_TIERS = {
  refrigerator: 'essential', router: 'essential', securityCam: 'essential',
  ac: 'normal', washingMachine: 'normal', oven: 'normal', fan: 'normal', stove: 'normal', lights: 'normal',
  tv: 'luxury', decorativeLights: 'luxury', speaker: 'luxury',
};

export function computeTotalWatts(rooms, globalDevices = {}) {
  let total = 0;
  for (const room of Object.values(rooms)) {
    for (const [device, state] of Object.entries(room.devices)) {
      if (state === true) total += DEVICE_WATTS[device] ?? 0;
    }
  }
  for (const [device, info] of Object.entries(globalDevices)) {
    if (info?.on) total += DEVICE_WATTS[device] ?? 0;
  }
  return total;
}

export const BASE_TARIFF = 8;

export function computeCostPerHour(watts, peakHour = false) {
  const tariff = peakHour ? BASE_TARIFF * 2 : BASE_TARIFF;
  return (watts / 1000) * tariff;
}

export function computeDailyCost(watts, peakHour = false) {
  return computeCostPerHour(watts, peakHour) * 24;
}

export function loadPercentage(watts, budget = 5000) {
  return (watts / budget) * 100;
}
