import { useCallback, useMemo, useReducer } from "react";

const createPlaceholder = (orderIndex) => ({
  id: `placeholder_${orderIndex}`,
  orderIndex,
  title: `Insight ${orderIndex + 1}`,
  content: "",
  answer: "",
  excerpt: "",
  isPlaceholder: true,
  status: "pending",
});

const hasContent = (tile = {}) =>
  Boolean(tile.content || tile.answer || tile.excerpt);

const buildArray = (tiles, total) => {
  const safeTotal = Math.max(total || 0, tiles.length);
  if (safeTotal === 0) {
    return [];
  }

  const result = Array.from({ length: safeTotal }, (_unused, index) =>
    createPlaceholder(index)
  );

  tiles.forEach((tile) => {
    if (!tile) return;
    const orderIndex =
      typeof tile.orderIndex === "number" && tile.orderIndex >= 0
        ? tile.orderIndex
        : result.findIndex((placeholder) => placeholder.isPlaceholder);

    if (orderIndex >= 0 && orderIndex < result.length) {
      result[orderIndex] = {
        ...tile,
        orderIndex,
        isPlaceholder: false,
      };
    }
  });

  return result;
};

const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let idx = 0; idx < a.length; idx++) {
    const left = a[idx];
    const right = b[idx];
    if (!left && !right) continue;
    if (!left || !right) return false;
    if (left.id !== right.id) return false;
    if (hasContent(left) !== hasContent(right)) return false;
  }
  return true;
};

const initialState = (initialTotal = 0) => ({
  expectedTotal: Math.max(initialTotal, 0),
  byIndex: buildArray([], Math.max(initialTotal, 0)),
});

function reducer(state, action) {
  switch (action.type) {
    case "BOOTSTRAP": {
      const { tiles = [], total = 0 } = action.payload;
      const computedTotal = Math.max(total || 0, tiles.length);
      const nextArray = buildArray(tiles, computedTotal);

      if (
        arraysEqual(state.byIndex, nextArray) &&
        state.expectedTotal === computedTotal
      ) {
        return state;
      }

      return {
        expectedTotal: computedTotal,
        byIndex: nextArray,
      };
    }

    case "UPSERT": {
      const { tile } = action.payload;
      if (!tile) return state;

      const orderIndex =
        typeof tile.orderIndex === "number" && tile.orderIndex >= 0
          ? tile.orderIndex
          : 0;

      const desiredTotal = Math.max(state.expectedTotal, orderIndex + 1);
      const base = buildArray(state.byIndex, desiredTotal);
      const nextArray = base.slice();
      nextArray[orderIndex] = {
        ...tile,
        orderIndex,
        isPlaceholder: false,
      };

      if (
        arraysEqual(state.byIndex, nextArray) &&
        state.expectedTotal === desiredTotal
      ) {
        return state;
      }

      return {
        expectedTotal: desiredTotal,
        byIndex: nextArray,
      };
    }

    case "SET_TOTAL": {
      const { total } = action.payload;
      const safeTotal = Math.max(total || 0, state.byIndex.length);
      if (safeTotal === state.expectedTotal) {
        return state;
      }

      const nextArray = buildArray(state.byIndex, safeTotal);
      if (arraysEqual(state.byIndex, nextArray)) {
        return {
          expectedTotal: safeTotal,
          byIndex: state.byIndex,
        };
      }

      return {
        expectedTotal: safeTotal,
        byIndex: nextArray,
      };
    }

    case "RESET": {
      if (state.byIndex.length === 0 && state.expectedTotal === 0) {
        return state;
      }
      return initialState();
    }

    default:
      return state;
  }
}

export function useTilesState(initialTotal = 0) {
  const [state, dispatch] = useReducer(reducer, initialTotal, initialState);

  const bootstrap = useCallback((tiles, total) => {
    dispatch({ type: "BOOTSTRAP", payload: { tiles, total } });
  }, []);

  const upsert = useCallback((tile) => {
    dispatch({ type: "UPSERT", payload: { tile } });
  }, []);

  const setTotal = useCallback((total) => {
    dispatch({ type: "SET_TOTAL", payload: { total } });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const tiles = useMemo(() => state.byIndex, [state.byIndex]);

  return {
    tiles,
    expectedTotal: state.expectedTotal,
    bootstrap,
    upsert,
    setTotal,
    reset,
  };
}
