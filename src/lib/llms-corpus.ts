import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Общая подготовка корпуса для /llms.txt и /llms-full.txt.
 *
 * Языковым моделям отдаём русскую локаль: она корневая и полная, а переводы
 * повторяют её содержание — дубли в выжимке только размывают ответ.
 */

export const SITE_URL = 'https://teletraff-guides.github.io';

export const SITE_TITLE = 'Документация TeleTraff (ТелеТрафф)';

export const SITE_SUMMARY =
  'Публичные пошаговые руководства по панели TeleTraff (ТелеТрафф) — сервису автоматизации ' +
  'Telegram: нейрокомментинг, прогрев аккаунтов, инвайтинг, рассылки, парсеры, прокси, ' +
  'массовые реакции, просмотры историй и статистика задач.';

/** Порядок разделов повторяет боковое меню сайта. */
const SECTIONS: { heading: string; match: (id: string) => boolean }[] = [
  { heading: 'Начало работы', match: (id) => id === '' || id.startsWith('getting-started') },
  { heading: 'Модули', match: (id) => id.startsWith('modules') },
  {
    heading: 'Правила и безопасность',
    match: (id) => ['troubleshooting', 'security', 'responsible-use'].includes(id),
  },
  { heading: 'Справка', match: (id) => ['faq', 'about'].includes(id) },
];

export type DocEntry = CollectionEntry<'docs'>;

/** Русские страницы без служебной 404. */
export async function loadRussianDocs(): Promise<DocEntry[]> {
  const docs = await getCollection('docs');
  return docs.filter((entry) => {
    const id = normalizeId(entry.id);
    if (id === '404') return false;
    return !id.startsWith('en/') && !id.startsWith('uk/') && id !== 'en' && id !== 'uk';
  });
}

/** `index` и `modules/index` в URL превращаются в `/` и `/modules/`. */
export function normalizeId(rawId: string): string {
  return rawId.replace(/\/?index$/, '').replace(/^\//, '');
}

export function urlFor(entry: DocEntry): string {
  const id = normalizeId(entry.id);
  return id === '' ? `${SITE_URL}/` : `${SITE_URL}/${id}/`;
}

export function groupBySection(entries: DocEntry[]): { heading: string; entries: DocEntry[] }[] {
  return SECTIONS.map(({ heading, match }) => ({
    heading,
    entries: entries
      .filter((entry) => match(normalizeId(entry.id)))
      .sort((a, b) => normalizeId(a.id).localeCompare(normalizeId(b.id))),
  })).filter((section) => section.entries.length > 0);
}

/**
 * MDX-исходник содержит импорты и JSX-компоненты Starlight. Модели это читают
 * как мусор, поэтому оставляем только текст: разметка компонентов снимается,
 * их содержимое сохраняется.
 */
export function toPlainMarkdown(body: string): string {
  return body
    .replace(/^import\s.+?;?\s*$/gm, '')
    .replace(/^export\s.+?;?\s*$/gm, '')
    .replace(/<\/?[A-Z][A-Za-z0-9]*(\s[^>]*?)?\/?>/g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
