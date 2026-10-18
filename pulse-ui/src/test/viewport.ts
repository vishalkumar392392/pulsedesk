import { act } from "@testing-library/react";

// jsdom has no layout engine, so `window.matchMedia` is emulated here by
// evaluating `min-width` / `max-width` queries against a configurable width.
type Listener = (event: MediaQueryListEvent) => void;

let viewportWidth = 1440;
const listeners = new Map<string, Set<Listener>>();

const evaluate = (query: string) => {
  const min = /min-width:\s*(\d+)px/.exec(query);
  const max = /max-width:\s*(\d+)px/.exec(query);
  if (min && viewportWidth < Number(min[1])) return false;
  if (max && viewportWidth > Number(max[1])) return false;
  return Boolean(min || max);
};

const matchMedia = (query: string): MediaQueryList => {
  const queryListeners = listeners.get(query) ?? new Set<Listener>();
  listeners.set(query, queryListeners);

  return {
    media: query,
    get matches() {
      return evaluate(query);
    },
    onchange: null,
    addEventListener: (_type: string, listener: Listener) =>
      queryListeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) =>
      queryListeners.delete(listener),
    addListener: (listener: Listener) => queryListeners.add(listener),
    removeListener: (listener: Listener) => queryListeners.delete(listener),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
};

export const setViewportWidth = (width: number) => {
  viewportWidth = width;
  window.matchMedia = matchMedia;
};

/** Resize after render and notify subscribed `matchMedia` listeners. */
export const resizeViewport = (width: number) => {
  act(() => {
    setViewportWidth(width);
    listeners.forEach((queryListeners, query) =>
      queryListeners.forEach((listener) =>
        listener({
          matches: evaluate(query),
          media: query,
        } as MediaQueryListEvent),
      ),
    );
  });
};
