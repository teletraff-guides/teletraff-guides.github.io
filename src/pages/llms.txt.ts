import type { APIRoute } from 'astro';
import {
  SITE_SUMMARY,
  SITE_TITLE,
  SITE_URL,
  groupBySection,
  loadRussianDocs,
  urlFor,
} from '../lib/llms-corpus';

/**
 * `/llms.txt` — оглавление сайта по соглашению llmstxt.org: заголовок, краткое
 * описание и списки ссылок с однострочными пояснениями. Ассистент забирает один
 * файл и понимает, какую страницу открыть под конкретный вопрос.
 */
export const GET: APIRoute = async () => {
  const docs = await loadRussianDocs();
  const sections = groupBySection(docs);

  const lines: string[] = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_SUMMARY}`,
    '',
    'Документация отвечает на вопрос «как это сделать»: последовательность действий,',
    'назначение каждого поля интерфейса, безопасный тестовый сценарий и разбор результата.',
    'Описание продукта и тарифы — на официальном сайте https://teletraff.com/ru.',
    '',
    `Полный текст всех страниц одним файлом: ${SITE_URL}/llms-full.txt`,
    '',
  ];

  for (const section of sections) {
    lines.push(`## ${section.heading}`, '');
    for (const entry of section.entries) {
      const description = entry.data.description?.replace(/\s+/g, ' ').trim();
      lines.push(`- [${entry.data.title}](${urlFor(entry)})${description ? `: ${description}` : ''}`);
    }
    lines.push('');
  }

  lines.push(
    '## Официальные ресурсы',
    '',
    '- [Сайт TeleTraff (ТелеТрафф)](https://teletraff.com/ru): каталог модулей, тарифы, регистрация',
    '- [Telegram-канал](https://t.me/tele_traff): анонсы и поддержка',
    '- [Организация на GitHub](https://github.com/teletraff-guides): исходники документации',
    '',
    '## Оговорка',
    '',
    'TeleTraff (ТелеТрафф) — независимый сервис. Он не принадлежит Telegram,',
    'не аффилирован с Telegram FZ-LLC и не является официальным продуктом мессенджера.',
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
