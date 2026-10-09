import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "./MarkdownMessage.css";

import { Copy, Check, RotateCcw, ChevronRight, Square } from "lucide-react";

function CodeBlock({ className = "", children, ...props }) {
  const [copied, setCopied] = useState(false);
  const language = /language-([\w-]+)/.exec(className)?.[1] || "text";
  const source = String(children).replace(/\n$/, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-header">
        <span className="markdown-code-lang">{language}</span>
        <button type="button" className="markdown-code-copy" onClick={copy}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre><code className={className} {...props}>{children}</code></pre>
    </div>
  );
}

export function MarkdownActions({ text = "", onRegenerate, onContinue, onStop }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      const clean = text.replace(/(?:^|\n)```studyos-action[\s\S]*?(?:```|$)/gi, "").trim();
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="markdown-actions">
      <button type="button" className={`markdown-action-btn ${copied ? "copied" : ""}`} onClick={copy} title="Copy response">
        {copied ? <Check size={13} /> : <Copy size={13} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      {onRegenerate && (
        <button type="button" className="markdown-action-btn" onClick={onRegenerate} title="Regenerate response">
          <RotateCcw size={13} />
          <span>Regenerate</span>
        </button>
      )}
      {onContinue && (
        <button type="button" className="markdown-action-btn" onClick={onContinue} title="Continue generating">
          <ChevronRight size={13} />
          <span>Continue</span>
        </button>
      )}
      {onStop && (
        <button type="button" className="markdown-action-btn" onClick={onStop} title="Stop generation">
          <Square size={12} />
          <span>Stop</span>
        </button>
      )}
    </div>
  );
}

export default function MarkdownMessage({ text = "", className = "" }) {
  const cleanText = typeof text === "string"
    ? text.replace(/(?:^|\n)```studyos-action[\s\S]*?(?:```|$)/gi, "").trim()
    : "";

  return (
    <div className={`markdown-message ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          pre: ({ children }) => {
            const code = children?.props || {};
            return <CodeBlock className={code.className}>{code.children}</CodeBlock>;
          },
          h1: ({ children }) => <h2>{children}</h2>,
          code: ({ className, children, ...props }) => className
            ? <code className={className} {...props}>{children}</code>
            : <code className="markdown-inline-code" {...props}>{children}</code>,
          table: ({ children }) => <div className="markdown-table-scroll"><table>{children}</table></div>,
        }}
      >
        {cleanText}
      </ReactMarkdown>
    </div>
  );
}
