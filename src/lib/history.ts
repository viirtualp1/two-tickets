export function hasBackEntry () {
  const state: unknown = window.history.state;

  return typeof state === 'object' && state !== null && 'back' in state && Boolean(state.back);
}
