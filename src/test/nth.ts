/** The item at `index` (negative counts from the end), failing the test when it is missing. */
export function nth<T>(items: readonly T[], index: number): T {
  const item = items.at(index);
  if (item === undefined) throw new Error(`No item at ${index} of ${items.length}`);
  return item;
}
