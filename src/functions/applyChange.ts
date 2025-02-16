// We keep this separate from ChangeMon so as to avoid functional confusion.  This
// function only does one thing.  It takes a target object and applies a change path
// to a value, creating missing arrays and objects along the way.
export default function applyChange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  path: { path: string | number | symbol; type: 'object' | 'array' | string }[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new_value: any
): void {
  let current = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i].path;
    const expectedType = path[i].type;
    if (!(key in current) || typeof current[key] !== 'object')
      current[key] = expectedType === 'array' ? [] : {};
    current = current[key];
  }
  const finalKey = path[path.length - 1].path;
  current[finalKey] = new_value;
}
