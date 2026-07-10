import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/** Render markdown to sanitized HTML (strips scripts/event handlers). */
export function renderMarkdown(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }) as string);
}
