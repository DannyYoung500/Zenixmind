import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import { Copy, Check } from 'lucide-react';

interface MessageRendererProps {
  content: string;
  className?: string;
}

// Helper to render KaTeX safely
function renderKaTeX(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'html'
    });
  } catch (err) {
    return `<span class="text-red-400/80 font-mono text-xs font-light">${latex}</span>`;
  }
}

// Code Block with Syntax Highlighting and Copy Action
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'plaintext').toLowerCase();

  const highlightedCode = useMemo(() => {
    try {
      const grammar = Prism.languages[cleanLang] || Prism.languages.javascript || Prism.languages.plaintext;
      if (grammar) {
        return Prism.highlight(code, grammar, cleanLang);
      }
    } catch {}
    return code;
  }, [code, cleanLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-white/[.07] bg-[#09090c] shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-white/[.05] bg-[#101014] px-4 py-1.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-light">
            {language || 'code'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-zinc-400 font-light hover:bg-white/[.06] hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-light text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="overflow-x-auto p-3.5 text-xs sm:text-[12.5px] font-mono font-light leading-relaxed text-zinc-300">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
}

// Text paragraph renderer supporting inline LaTeX ($...$), bold, italic, and inline code (`...`)
function TextWithInlineFormatting({ text }: { text: string }) {
  // Regex to detect inline math $...$ and inline code `...`
  const elements = useMemo(() => {
    const regex = /(\$[^$\n]+\$|`[^`\n]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts: Array<{ type: 'text' | 'math' | 'code' | 'bold' | 'italic'; value: string }> = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ type: 'text', value: text.slice(lastIdx, match.index) });
      }

      const matchStr = match[0];
      if (matchStr.startsWith('$') && matchStr.endsWith('$')) {
        parts.push({ type: 'math', value: matchStr.slice(1, -1) });
      } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        parts.push({ type: 'code', value: matchStr.slice(1, -1) });
      } else if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        parts.push({ type: 'bold', value: matchStr.slice(2, -2) });
      } else if (matchStr.startsWith('*') && matchStr.endsWith('*')) {
        parts.push({ type: 'italic', value: matchStr.slice(1, -1) });
      }
      lastIdx = match.index + matchStr.length;
    }

    if (lastIdx < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIdx) });
    }

    return parts;
  }, [text]);

  return (
    <span>
      {elements.map((el, i) => {
        if (el.type === 'math') {
          const html = renderKaTeX(el.value, false);
          return (
            <span
              key={i}
              className="inline-block px-1 align-baseline font-light"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        if (el.type === 'code') {
          return (
            <code
              key={i}
              className="rounded-md border border-white/[.07] bg-[#141418] px-1.5 py-0.5 font-mono text-[11px] sm:text-xs text-amber-300/80 font-light"
            >
              {el.value}
            </code>
          );
        }
        if (el.type === 'bold') {
          return (
            <span key={i} className="font-normal text-zinc-100">
              {el.value}
            </span>
          );
        }
        if (el.type === 'italic') {
          return (
            <em key={i} className="italic text-zinc-300 font-light">
              {el.value}
            </em>
          );
        }
        return <span key={i} className="font-light text-zinc-300">{el.value}</span>;
      })}
    </span>
  );
}

export function MessageRenderer({ content, className = '' }: MessageRendererProps) {
  // Parse content into blocks: Code Blocks (```), Display LaTeX ($$...$$), and Paragraphs
  const blocks = useMemo(() => {
    const result: Array<{
      type: 'code' | 'display-math' | 'heading' | 'list' | 'table' | 'quote' | 'paragraph';
      content: string;
      language?: string;
      level?: number;
      items?: string[];
    }> = [];

    // Split on code blocks and display math first
    const mainRegex = /(```([a-zA-Z0-9_-]*)\n([\s\S]*?)```|\$\$([\s\S]*?)\$\$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const processTextSegment = (rawText: string) => {
      const paragraphs = rawText.split(/\n\s*\n/);
      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (!trimmed) continue;

        // Headings
        if (trimmed.startsWith('### ')) {
          result.push({ type: 'heading', level: 3, content: trimmed.replace('### ', '') });
        } else if (trimmed.startsWith('## ')) {
          result.push({ type: 'heading', level: 2, content: trimmed.replace('## ', '') });
        } else if (trimmed.startsWith('# ')) {
          result.push({ type: 'heading', level: 1, content: trimmed.replace('# ', '') });
        } else if (trimmed.startsWith('> ')) {
          // Blockquote
          result.push({ type: 'quote', content: trimmed.replace(/^>\s*/gm, '') });
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
          // List
          const lines = trimmed.split('\n').filter(Boolean);
          result.push({ type: 'list', content: trimmed, items: lines });
        } else {
          result.push({ type: 'paragraph', content: trimmed });
        }
      }
    };

    while ((match = mainRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        processTextSegment(content.slice(lastIndex, match.index));
      }

      if (match[1].startsWith('```')) {
        result.push({
          type: 'code',
          language: match[2] || 'plaintext',
          content: match[3]
        });
      } else if (match[1].startsWith('$$')) {
        result.push({
          type: 'display-math',
          content: match[4]
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      processTextSegment(content.slice(lastIndex));
    }

    return result;
  }, [content]);

  return (
    <div className={`space-y-2.5 leading-relaxed text-zinc-300 font-light ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.content} language={block.language || 'code'} />;
        }

        if (block.type === 'display-math') {
          const html = renderKaTeX(block.content, true);
          return (
            <div
              key={idx}
              className="my-2.5 overflow-x-auto rounded-xl border border-white/[.06] bg-[#09090b] p-3 text-center text-zinc-200 font-light shadow-inner"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h1 key={idx} className="text-base sm:text-lg font-normal text-zinc-100 tracking-tight mt-5 mb-1.5 border-b border-white/[.06] pb-1">
                <TextWithInlineFormatting text={block.content} />
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2 key={idx} className="text-sm sm:text-base font-normal text-zinc-100 tracking-tight mt-4 mb-1">
                <TextWithInlineFormatting text={block.content} />
              </h2>
            );
          }
          return (
            <h3 key={idx} className="text-xs sm:text-sm font-normal text-zinc-200 mt-3 mb-0.5">
              <TextWithInlineFormatting text={block.content} />
            </h3>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={idx}
              className="my-2 border-l-2 border-amber-400/40 bg-[#121215]/80 px-3.5 py-1.5 text-xs sm:text-[13px] text-zinc-400 italic font-light rounded-r-xl"
            >
              <TextWithInlineFormatting text={block.content} />
            </blockquote>
          );
        }

        if (block.type === 'list' && block.items) {
          const isNumbered = /^\d+\./.test(block.items[0]);
          return isNumbered ? (
            <ol key={idx} className="list-decimal list-outside ml-5 space-y-1 my-2 text-xs sm:text-[13px] text-zinc-300 font-light">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="pl-1">
                  <TextWithInlineFormatting text={item.replace(/^\d+\.\s*/, '')} />
                </li>
              ))}
            </ol>
          ) : (
            <ul key={idx} className="list-disc list-outside ml-5 space-y-1 my-2 text-xs sm:text-[13px] text-zinc-300 font-light">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="pl-1">
                  <TextWithInlineFormatting text={item.replace(/^[-*]\s*/, '')} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-[13px] text-zinc-300 font-light leading-relaxed whitespace-pre-line">
            <TextWithInlineFormatting text={block.content} />
          </p>
        );
      })}
    </div>
  );
}
