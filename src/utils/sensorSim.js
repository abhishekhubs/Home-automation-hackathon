// Gaussian random number (Box-Muller transform)
export function gaussianRandom(mean = 0, std = 1) {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

// Room-specific temperature ranges
export const ROOM_TEMP_RANGES = {
  livingRoom: { min: 18, max: 38, base: 24 },
  bedroom:    { min: 16, max: 36, base: 22 },
  kitchen:    { min: 18, max: 55, base: 26 },
  bathroom:   { min: 18, max: 40, base: 25 },
};

// Random walk for temperature
export function walkTemp(current, roomId) {
  const range = ROOM_TEMP_RANGES[roomId];
  const next = current + gaussianRandom(0, 0.3);
  return Math.max(range.min, Math.min(range.max, next));
}

// Random walk for humidity
export function walkHumidity(current) {
  const next = current + gaussianRandom(0, 1);
  return Math.max(30, Math.min(90, next));
}

// Markov chain for motion
// Returns true/false based on current state and time-of-hour occupancy probs
export function markovMotion(currentMotion, roomId, hour) {
  // Occupancy probability by room and time
  const occProbs = {
    livingRoom: getOccupancyProb(roomId, hour, [
      { start: 7, end: 9, prob: 0.7 },
      { start: 17, end: 23, prob: 0.8 },
      { start: 0, end: 6, prob: 0.05 },
    ]),
    bedroom: getOccupancyProb(roomId, hour, [
      { start: 22, end: 24, prob: 0.85 },
      { start: 0, end: 7, prob: 0.85 },
      { start: 7, end: 9, prob: 0.4 },
    ]),
    kitchen: getOccupancyProb(roomId, hour, [
      { start: 7, end: 9, prob: 0.8 },
      { start: 12, end: 13, prob: 0.6 },
      { start: 18, end: 20, prob: 0.75 },
      { start: 0, end: 6, prob: 0.02 },
    ]),
    bathroom: getOccupancyProb(roomId, hour, [
      { start: 6, end: 8, prob: 0.7 },
      { start: 20, end: 22, prob: 0.5 },
      { start: 0, end: 5, prob: 0.05 },
    ]),
  };

  const baseProb = occProbs[roomId] ?? 0.3;
  // Transition probabilities
  const pStayOn = currentMotion ? 0.85 : baseProb;
  const pTurnOn = currentMotion ? baseProb * 0.3 : baseProb * 0.15;
  return Math.random() < (currentMotion ? pStayOn : pTurnOn);
}

function getOccupancyProb(roomId, hour, slots) {
  for (const slot of slots) {
    if (hour >= slot.start && hour < slot.end) return slot.prob;
  }
  return 0.15;
}
