import type { APIRoute, GetStaticPaths } from 'astro';
import { loadRussianDocs, normalizeId, toPlainMarkdown, urlFor } from '../lib/llms-corpus';

/**
 * Чистый Markdown рядом с каждой страницей: `/modules/inviting/` ↔
 * `/modules/inviting.md`. Агенту не нужно разбирать HTML Starlight —
 * он забирает исходный текст без навигации, меню и скриптов.
 *
 * Корневая страница доступна как `/index.md`: пустой slug дал бы `/.md`.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await loadRussianDocs();
  return docs.map((entry) => {
    const id = normalizeId(entry.id);
    return { params: { slug: id === '' ? 'index' : id }, props: { entry } };
  });
};

export const GET: APIRoute = ({ props }) => {
  const entry = props.entry as Awaited<ReturnType<typeof loadRussianDocs>>[number];
  const description = entry.data.description?.replace(/\s+/g, ' ').trim();

  const body = [
    `# ${entry.data.title}`,
    '',
    `Источник: ${urlFor(entry)}`,
    description ? `Кратко: ${description}` : '',
    '',
    toPlainMarkdown(entry.body ?? ''),
    '',
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
