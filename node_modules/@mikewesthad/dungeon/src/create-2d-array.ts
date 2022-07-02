/**
 * Creates a 2D array of width x height, filled with the given value.
 */
export default function create2DArray<T>(width: number, height: number, value?: T): T[][] {
  return [...Array(height)].map(() => Array(width).fill(value));
}
