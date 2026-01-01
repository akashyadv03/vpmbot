"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { api } from "convex/_generated/api";
import {

  toUIMessages,
  useSmoothText,
  useThreadMessages,
  useUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useAction } from "convex/react";


interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}



export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  // const createThread = useMutation(api.agent.createThread);
  const createThread = useAction(api.agent.createNewThread);
  const [threadId, setThreadId] = useState<string>("");

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sendMessageTOAgent = useAction(api.agent.sendMessageToAgent);


  async function handleSendMessage() {
    if (!inputValue.trim()) return;
    // Ensure we have a thread id. Create one only when the user sends the first message.
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const id = await createThread();
      setThreadId(id);
      currentThreadId = id;
    }

    // Start loading state, call the action and wait for server-side streaming to finish.
    setIsLoading(true);
    try {
      await sendMessageTOAgent({
        message: inputValue,
        threadId: currentThreadId,
      });
    } finally {
      setIsLoading(false);
    }
    setInputValue("");
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full sm:w-96 max-h-[90vh] sm:max-h-[600px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
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
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="flex-1 rounded-full border-slate-300 focus:ring-blue-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
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
  const { results } = useThreadMessages(
    api.agent.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );
  const messages = toUIMessages(results ?? []);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <MessageBubble message={message} />
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const [visibleText] = useSmoothText(message.text);

  return (
    <div
      className={cn(
        "max-w-xs px-4 py-3 rounded-xl text-sm leading-relaxed",
        message.role === "user"
          ? "bg-blue-600 text-white rounded-br-none"
          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
      )}
    >
      {visibleText}
    </div>
  );
}
