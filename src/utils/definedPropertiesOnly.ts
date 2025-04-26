export function definedPropertiesOnly<T>(obj: T): Partial<T> {
  if (!obj) return {};

  return Object.fromEntries(
    Object.entries(obj as any).filter(([_, v]) => v != null),
  ) as Partial<T>;
}
