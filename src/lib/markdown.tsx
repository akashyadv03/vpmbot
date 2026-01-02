"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import toast from "react-hot-toast";

function isDownloadable(href?: string) {
  if (!href) return false;
  return /\.(pdf|docx?|zip|png|jpe?g|gif|txt|csv|xlsx?)($|\?)/i.test(href);
}

export default function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({ node, ...props }: any) => {
          const href = props.href as string | undefined;
          const download = isDownloadable(href);
          return (
            <a
              {...props}
              href={href}
              target={download ? undefined : "_blank"}
              rel={download ? undefined : "noopener noreferrer"}
              download={download}
              className="text-blue-600 underline"
            />
          );
        },
        code: ({ inline, className, children, ...props }: any) => {
          const codeText = String(children).replace(/\n$/, "");
          if (inline) {
            return (
              <code className={(className ?? "") + " bg-slate-100 px-1 rounded"} {...props}>
                {codeText}
              </code>
            );
          }

          return (
            <div className="relative">
              <pre className="bg-slate-900 text-white rounded p-3 overflow-auto text-sm">
                <code className={className} {...props}>
                  {codeText}
                </code>
              </pre>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(codeText);
                    toast.success("Copied code");
                  } catch (err) {
                    toast.error("Copy failed");
                  }
                }}
                className="absolute right-2 top-2 bg-white/10 text-xs text-white px-2 py-1 rounded"
              >
                Copy
              </button>
            </div>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
