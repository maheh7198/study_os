import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "./MarkdownMessage.css";

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
        <span>{language}</span>
        <button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre><code className={className} {...props}>{children}</code></pre>
    </div>
  );
}

export function MarkdownActions({ text = "", onRegenerate, onContinue, onStop }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };
  return <div className="markdown-actions"><button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>{onRegenerate && <button type="button" onClick={onRegenerate}>Regenerate</button>}{onContinue && <button type="button" onClick={onContinue}>Continue</button>}{onStop && <button type="button" onClick={onStop}>Stop</button>}</div>;
}

export default function MarkdownMessage({ text = "", className = "" }) {
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
        {text}
      </ReactMarkdown>
    </div>
  );
}
