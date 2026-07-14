/**
 * Server-authoritative watch state. `durationSec` MUST be the DB's own value, never the
 * client's — this is what prevents a forged "completed" state. Position is clamped into range.
 */
export function watchState(positionSec: number, durationSec: number) {
  const positionClamped = Math.min(Math.max(positionSec, 0), durationSec);
  // "Near the end" scales with length: min(5s, 15% of duration) so short clips don't
  // count as completed at the halfway mark.
  const nearEnd = Math.min(5, durationSec * 0.15);
  const completed = durationSec > 0 && positionSec >= durationSec - nearEnd;
  return { positionSec: positionClamped, durationSec, completed };
}
