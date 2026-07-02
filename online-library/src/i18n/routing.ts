import { defineRouting } from "next-intl/routing";

export const locales = [
  "ja",
  "en",
  "zh-CN",
  "zh-TW",
  "ko",
  "th",
  "vi",
  "id",
  "hi",
  "ms",
] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
  th: "ไทย",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  hi: "हिन्दी",
  ms: "Bahasa Melayu",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "ja",
  localePrefix: "always",
});
