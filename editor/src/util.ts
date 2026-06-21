export type Path = (string | number)[];

export function getPath(obj: any, path: Path): any {
  return path.reduce((o, k) => (o == null ? o : o[k]), obj);
}

// イミュータブルに path の値を更新した新オブジェクトを返す
export function setPath<T>(obj: T, path: Path, value: any): T {
  if (path.length === 0) return value;
  const [k, ...rest] = path;
  const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  clone[k] = setPath(clone[k], rest, value);
  return clone;
}

export function assetUrl(file: string): string {
  return encodeURI("/assets/" + file);
}
