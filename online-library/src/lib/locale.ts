import { routing, type Locale } from "@/i18n/routing";

type Messages = typeof import("../messages/ja.json");

let messageCache: Partial<Record<Locale, Messages>> = {};

export async function getMessages(locale: Locale): Promise<Messages> {
  if (!messageCache[locale]) {
    messageCache[locale] = (await import(`../messages/${locale}.json`)).default;
  }
  return messageCache[locale]!;
}

export function getLocaleFromRequest(request: Request): Locale {
  const url = new URL(request.url);
  const queryLocale = url.searchParams.get("locale");
  if (queryLocale && routing.locales.includes(queryLocale as Locale)) {
    return queryLocale as Locale;
  }

  const headerLocale = request.headers.get("x-locale");
  if (headerLocale && routing.locales.includes(headerLocale as Locale)) {
    return headerLocale as Locale;
  }

  const acceptLang = request.headers.get("accept-language");
  if (acceptLang) {
    for (const part of acceptLang.split(",")) {
      const lang = part.split(";")[0].trim();
      if (routing.locales.includes(lang as Locale)) {
        return lang as Locale;
      }
      const base = lang.split("-")[0];
      const match = routing.locales.find(
        (l) => l === lang || l.startsWith(base)
      );
      if (match) return match;
    }
  }

  return routing.defaultLocale;
}

type ErrorKey = keyof Messages["errors"];

export async function tError(
  locale: Locale,
  key: ErrorKey,
  params?: Record<string, string | number>
): Promise<string> {
  const messages = await getMessages(locale);
  let text: string = messages.errors[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export function clearMessageCache() {
  messageCache = {};
}
