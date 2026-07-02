export const CATEGORY_KEYS = [
  "文学",
  "児童文学",
  "ファンタジー",
  "SF",
  "自己啓発",
  "歴史",
  "一般",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

export function translateCategory(
  tCat: (key: CategoryKey) => string,
  category: string
): string {
  return isCategoryKey(category) ? tCat(category) : category;
}
