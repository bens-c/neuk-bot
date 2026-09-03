const DURATION_PATTERN = /^(\d+)\s*(m|min|h|d)$/i;

export const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

export function parseDuration(input) {
  const match = input.trim().match(DURATION_PATTERN);
  if (!match) {
    throw new Error('Ungültige Dauer. Beispiele: 10m, 2h oder 7d.');
  }

  const value = Number(match[1]);
  const unitMs = { m: 60_000, min: 60_000, h: 3_600_000, d: 86_400_000 }[
    match[2].toLowerCase()
  ];
  const duration = value * unitMs;

  if (!Number.isSafeInteger(duration) || duration < 60_000 || duration > MAX_TIMEOUT_MS) {
    throw new Error('Die Dauer muss zwischen 1 Minute und 28 Tagen liegen.');
  }

  return duration;
}
