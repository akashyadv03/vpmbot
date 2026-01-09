"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, MessageCircle } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import { cn } from "@/lib/utils";
import { isRateLimitError } from "@convex-dev/rate-limiter";
import { api } from "convex/_generated/api";
import { getOrCreateSessionId } from "@/lib/session";
import {

  optimisticallySendMessage,
  toUIMessages,
  useSmoothText,
  useThreadMessages,
  useUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useAction, useMutation } from "convex/react";


import Markdown from "@/lib/markdown";
import { string } from "zod/v4";
interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}



export default function ChatBot() {
  // const createThread = useMutation(api.agent.createThread);
  const createThread = useAction(api.agent.createNewThread);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const sendMessageTOAgent = useMutation(api.agent.sendMessageToAgent).withOptimisticUpdate(optimisticallySendMessage(api.agent.listThreadMessages));
  const [open, setOpen] = useState(true);



  async function handleSendMessage() {
    if (!inputValue.trim()) return;
    const sessionId = getOrCreateSessionId();

    let currentThreadId = threadId;
    if (!currentThreadId) {
      const id = await createThread();
      setThreadId(id);
      currentThreadId = id;
    }

    // Start loading state, call the action and wait for server-side streaming to finish.
    setIsLoading(true);
    try {
      sendMessageTOAgent({
        prompt: inputValue,
        threadId: currentThreadId,
        // sessionId,
      });
    } catch (e) {
      if (isRateLimitError(e)) {
        toast.error("You have exceeded the message limit");
        setRateLimited(true);
        return;
      }
    }
    finally {
      setIsLoading(false);
      setInputValue("");
    }

  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  function onClose() {
    setOpen(false);

    window.parent.postMessage(
      { type: "CHAT_CLOSE" },
      "*"
    );

    console.log("CHAT_CLOSE message sent");
  }

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // parent origin (ASP.NET)
      if (event.origin !== "https://localhost:44356") return;

      if (event.data?.type === "CHAT_OPEN") {
        setOpen(true);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
      <Toaster />
      <div className="bg-white rounded-2xl shadow-2xl w-full sm:w-96 max-h-[90vh] sm:max-h-150 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">College Assistant</h2>
              <p className="text-blue-100 text-sm">Always here to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-blue-800 rounded-lg p-2 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"></div>
        {/* 
    <MyComponent threadId={threadId}/> */}
        {threadId && <MyComponent threadId={threadId} />}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-800 border border-slate-200 px-4 py-3 rounded-xl rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 bg-white p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                className="flex-1 rounded-full border-slate-300 focus:ring-blue-500"
                disabled={isLoading || rateLimited}
              />
              {rateLimited && (
                <p className="text-sm text-red-500 mt-1">You have exceeded the message limit</p>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || rateLimited || !inputValue.trim()}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white p-2 h-10 w-10 flex items-center justify-center"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyComponent({ threadId }: { threadId: string }) {
  const messages = useThreadMessages(
    api.agent.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  useEffect(() => {
    console.log(`Messages`, messages.results)
  }, [messages.results]);


  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
      {messages.results
        .filter((m) => {
          // Filter out tool result messages
          if (m.parts) return true;
          // return !m.parts.some((part) => part.type === "tool-result");
        })
        .map((m) => (
          <MessageRow key={m.key} message={m} />
        ))}

    </div>
  );
}



// function MessageBubble({ message }: { message: string }) {
//   const messageEndRef = useRef<HTMLDivElement | null>(null);

//   const scrollToBottom = () => {
//     messageEndRef.current?.scrollIntoView({
//       behavior: "smooth"
//     });
//   }
//   useEffect(() => {
//     scrollToBottom();
//   }, [message]);
//   // const isUser = message.role === "user";

//   const [visibleText] = useSmoothText(message);
//   // console.log(visibleText);
//   return (
//     <div ref={messageEndRef}
//       className={cn(
//         "max-w-xs px-4 py-3 rounded-xl text-sm leading-relaxed",
//         // isUser
//         //   ? "bg-blue-600 text-white rounded-br-none"
//         //   : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
//       )}
//     >
//       <Markdown text={visibleText} />
//     </div>
//   );
// }


function MessageRow({ message }: { message: UIMessage }) {
  if (!message.role) return null;

  const text = getMessageText(message);
  if (!text) return null;

  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <MessageBubble
        text={text}
        role={message.role}
        streaming={message.status === "streaming"}
      />
    </div>
  );
}



function AssistantMessage({ message }: { message: UIMessage }) {
  //   const hasToolParts = message.parts?.some((part) => part.type === "tool-call" || part.type === "tool-result");
  //   if (hasToolParts) return <ToolMessage message={message} />;

  const [visibleText] = useSmoothText(message.text ?? "", {
    startStreaming: message.status === "streaming",
  });
  console.log("visible ", visibleText);

  return (
    <div>
      {/* <MessageBubble message={visibleText} /> */}
    </div>
  )
}

function MessageBubble({
  text,
  role,
  streaming,
}: {
  text: string;
  role: "user" | "assistant" | "system";
  streaming?: boolean;
}) {
  const [visibleText] = useSmoothText(text, {
    startStreaming: streaming,
  });

  return (
    <div
      className={cn(
        "max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed",
        role === "user"
          ? "bg-blue-600 text-white rounded-br-none"
          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
      )}
    >
      <Markdown text={visibleText} />
    </div>
  );
}

function getMessageText(message: UIMessage): string {
  if (message.text) return message.text;

  if (!message.parts) return "";

  return message.parts
    .filter((p) => p.type === "text")
    .map((p: any) => p.text)
    .join("");
}


function UserMessage({ message }: { message: UIMessage }) {
  let userMessage = message.text ?? "";
  try {
    userMessage = parseUserMessageJSON(message.text).message;

  } catch (e) {
  }
  return (
    <div>
      {/* <MessageBubble message={userMessage} /> */}
    </div>
  )
}

type UserMessageJSON = {
  message: string,
}
function parseUserMessageJSON(message: string): UserMessageJSON {
  return JSON.parse(message) as UserMessageJSON;
};

// function ToolMessage({ message }: { message: UIMessage }) {
//   if (message.role != "assistant") return null;
//   if (!message.parts) return null;
//   return (
//     <div>
//       {message.parts.map((part, idx) => {
//         if (part.type === "tool-call") {
//           const toolCallPart = part as unknown as { type: "tool-call"; toolCallId: string; toolName?: string; args?: any };
//           if (!toolCallPart.toolName) return null;
//           return (
//             <div key={idx}>
//               vpm bot  used <span style={{ fontWeight: 500 }}>{toolCallPart.toolName}</span>
//             </div>
//           );
//         }

//         if (part.type == "tool-result") return null;
//         return null;
//       })}

//     </div>
//   );
// }

// function UserMessage ({ message }: { message: UIMessage }) {
//   if (!message.text) return null;
//   let userMessage = message.text ?? "";
//   return (
//     <div>
//       <MessageBubble message={message}/>
//     </div>
//   )}