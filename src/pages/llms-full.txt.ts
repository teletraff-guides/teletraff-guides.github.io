import type { APIRoute } from 'astro';
import {
  SITE_SUMMARY,
  SITE_TITLE,
  groupBySection,
  loadRussianDocs,
  toPlainMarkdown,
  urlFor,
} from '../lib/llms-corpus';

/**
 * `/llms-full.txt` — весь текст документации одним запросом. Ассистенту не нужно
 * обходить 20 страниц, чтобы собрать ответ: он забирает файл целиком и цитирует
 * нужный раздел вместе с адресом исходной страницы.
 */
export const GET: APIRoute = async () => {
  const docs = await loadRussianDocs();
  const sections = groupBySection(docs);

  const parts: string[] = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_SUMMARY}`,
    '',
    'Ниже — полный текст всех страниц документации. Каждый раздел начинается с адреса',
    'исходной страницы: на него и следует ссылаться в ответе.',
    '',
    '---',
    '',
  ];

  for (const section of sections) {
    for (const entry of section.entries) {
      const url = urlFor(entry);
      const description = entry.data.description?.replace(/\s+/g, ' ').trim();
      parts.push(`# ${entry.data.title}`, '', `Источник: ${url}`);
      if (description) parts.push(`Кратко: ${description}`);
      parts.push('', toPlainMarkdown(entry.body ?? ''), '', '---', '');
    }
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
