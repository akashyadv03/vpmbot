"use client";
import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { MessageCircle } from "lucide-react";
// import ChatBot from "@/components/ChatBot";

// export default function ChatBotPage() {
//   const [isChatOpen, setIsChatOpen] = useState(false);

//   return (
//     <div className="min-h-screen ">
//       <Button
//         onClick={() => setIsChatOpen(true)}
//         className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm"
//       >
//         <MessageCircle className="w-4 h-4" />
//         <span className="hidden sm:inline">Chat with us</span>
//       </Button>
//       <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
//     </div>
//   );
// }
// "use client";

import ChatBot from "@/components/ChatBot";

export default function ChatBotPage() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  return (
    <>
      <ChatBot />
    </>
  );
}
