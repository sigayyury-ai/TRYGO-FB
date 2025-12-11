export function removeTypenameDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeTypenameDeep) as unknown as T;
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      if (key === "__typename") continue;
      newObj[key] = removeTypenameDeep((obj as any)[key]);
    }
    return newObj;
  }
  return obj;
}
