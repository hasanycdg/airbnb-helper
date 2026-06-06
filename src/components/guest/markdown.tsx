import { Fragment } from "react";

/**
 * Minimal, dependency-free Markdown renderer for guide content. Supports
 * headings (#/##), bold (**), italic (*), inline code (`), links [t](u),
 * unordered lists (-/*), and paragraphs. Renders to React elements (no raw
 * HTML injection).
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${i++}`;
    if (match[2]) nodes.push(<strong key={key}>{match[2]}</strong>);
    else if (match[4]) nodes.push(<em key={key}>{match[4]}</em>);
    else if (match[6])
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {match[6]}
        </code>,
      );
    else if (match[8])
      nodes.push(
        <a key={key} href={match[9]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
          {match[8]}
        </a>,
      );
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length) {
      const items = [...list];
      blocks.push(
        <ul key={`ul-${key++}`} className="my-2 list-disc space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    flushList();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const size = level <= 1 ? "text-lg" : level === 2 ? "text-base" : "text-sm";
      blocks.push(
        <p key={key++} className={`mt-3 font-semibold ${size}`}>
          {renderInline(heading[2], `h-${key}`)}
        </p>,
      );
    } else if (line.trim() === "") {
      // paragraph break — handled by spacing
    } else {
      blocks.push(<p key={key++} className="leading-relaxed">{renderInline(line, `p-${key}`)}</p>);
    }
  }
  flushList();

  return <div className={className}>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
