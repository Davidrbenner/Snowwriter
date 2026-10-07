export interface History {
  past: string[];
  present: string;
  future: string[];
}

/** Cap undo depth so long sessions don't grow memory unbounded. */
export const MAX_HISTORY = 200;

export const emptyHistory = (present = ''): History => ({ past: [], present, future: [] });

export function push(h: History, value: string): History {
  if (h.present === value) return h;
  const past = [...h.past, h.present];
  if (past.length > MAX_HISTORY) past.shift();
  return { past, present: value, future: [] };
}

export function undo(h: History): History {
  if (h.past.length === 0) return h;
  return {
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future],
  };
}

export function redo(h: History): History {
  if (h.future.length === 0) return h;
  return {
    past: [...h.past, h.present],
    present: h.future[0],
    future: h.future.slice(1),
  };
}
