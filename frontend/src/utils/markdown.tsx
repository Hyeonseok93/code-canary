
import { isSafeHref } from './urlSafety';

const parseInlineMarkdown = (text: string) => {
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[') && part.includes('](')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [, label, url] = match;
        const linkClassName =
          'text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-all font-semibold inline-flex items-center gap-0.5';

        if (!isSafeHref(url)) {
          return (
            <span key={i} className={`${linkClassName} text-neutral-400 no-underline cursor-not-allowed`} title="Link blocked for security">
              {label}
            </span>
          );
        }

        return (
          <a
            key={i}
            href={url.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {label}
          </a>
        );
      }
    }
    return part;
  });
};

interface SafeMarkdownProps {
  content: string;
}

export const SafeMarkdown = ({ content }: SafeMarkdownProps) => {
  if (!content) return null;

  const parts = content.split(/(```[a-zA-Z]*\n[\s\S]*?\n```)/g);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const lang = lines[0].replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={index} className="my-3 border border-white/5 rounded-2xl overflow-hidden bg-black/60 shadow-inner">
              <div className="flex items-center justify-between bg-neutral-900/60 px-4 py-2 border-b border-white/5 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                <span>{lang} block</span>
              </div>
              <pre className="p-4 text-[11px] font-mono text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-2 text-[13px] text-neutral-300 leading-relaxed font-medium">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              if (trimmed.startsWith('###')) {
                return (
                  <h4 key={lIdx} className="text-[12px] font-black text-white uppercase tracking-wider mt-5 mb-2.5 pl-1.5 border-l-2 border-emerald-500">
                    {parseInlineMarkdown(trimmed.replace(/^###\s*/, ''))}
                  </h4>
                );
              }
              if (trimmed.startsWith('##')) {
                return (
                  <h3 key={lIdx} className="text-[14px] font-black text-white uppercase tracking-wider mt-6 mb-3 pl-2 border-l-2 border-emerald-500">
                    {parseInlineMarkdown(trimmed.replace(/^##\s*/, ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('#')) {
                return (
                  <h2 key={lIdx} className="text-[16px] font-black text-white uppercase tracking-wider mt-8 mb-4">
                    {parseInlineMarkdown(trimmed.replace(/^#\s*/, ''))}
                  </h2>
                );
              }

              const isListItem = /^([-*])\s+/.test(trimmed) && !trimmed.startsWith('**');
              if (isListItem) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-3 py-0.5">
                    <span className="text-emerald-500 mt-1.5 shrink-0 select-none text-[8px]">■</span>
                    <span className="text-neutral-300">{parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="leading-relaxed">
                  {parseInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
