// Sound architecture stub. Currently no-op; wire real audio here later.
let enabled = false;
export function enableSound(v: boolean) {
  enabled = v;
}
export function isSoundEnabled() {
  return enabled;
}
export function playLoaderSound(_name: "start" | "tick" | "done") {
  if (!enabled) return;
  // future: play audio asset
}