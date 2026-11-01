// Note: This code ignores a number of eslint/tslint style choices.  Mostly because
// we have to use "any" quite often based on the extreme dynamitisim of the task of
// proxying standard object properties.  We've carefully considered the choice, and
// disabled eslint errors where deemed appropriate.

export type changemon_cb_t = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  old_value: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new_value: any,
  path: { path: string | number | symbol; type: string }[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changemon_ref: ChangeMon<any>
) => void;

export type changemon_path_t = {
  path: string | number | symbol;
  type: string;
}[];

export default class ChangeMon<extra_t> {
  proxyToOriginalMap = new WeakMap<object, object>();
  extra: extra_t;
  constructor(extra: extra_t) {
    this.extra = extra;
  }

  watch<T extends object>(obj: T, callback: changemon_cb_t): T {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const changemon_ref = this;
    function createProxy(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: any,
      path: { path: string | number | symbol; type: string }[]
    ) {
      if (changemon_ref.proxyToOriginalMap.has(target)) return target;
      const proxy = new Proxy(target, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
          if (value && typeof value === 'object')
            return createProxy(value, [
              ...path,
              { path: prop, type: Array.isArray(value) ? 'array' : 'object' }
            ]);
          return value;
        },
        set(target, prop, value, receiver) {
          const old_value = Reflect.get(target, prop, receiver);
          const new_path = [
            ...path,
            { path: prop, type: Array.isArray(value) ? 'array' : typeof value }
          ];
          if (old_value !== value)
            callback(old_value, value, new_path, changemon_ref);
          return Reflect.set(target, prop, value, receiver);
        },
        deleteProperty(target, prop) {
          const old_value = target[prop];
          const new_path = [
            ...path,
            {
              path: prop,
              type: Array.isArray(old_value) ? 'array' : typeof old_value
            }
          ];
          if (prop in target)
            callback(old_value, undefined, new_path, changemon_ref);
          return Reflect.deleteProperty(target, prop);
        }
      });
      changemon_ref.proxyToOriginalMap.set(proxy, target);
      return proxy;
    }
    return createProxy(obj, []);
  }

  unwatch<T extends object>(proxy: T): T {
    const original = this.proxyToOriginalMap.get(proxy);
    if (!original) return proxy;
    this.proxyToOriginalMap.delete(proxy);
    if (typeof original === 'object') {
      for (const key of Object.keys(original)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (original as any)[key];
        if (typeof value === 'object' && this.proxyToOriginalMap.has(value)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (original as any)[key] = this.unwatch(value);
        }
      }
    }
    return original as T;
  }
}
