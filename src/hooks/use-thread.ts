import { api } from "convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useEffect, useState } from "react";




export function useThread() {
    const createThread = useAction(api.thread.createNewThread);

    const [threadId , setThreadId ] = useState<string |undefined>(
        typeof window !=="undefined" ?getThreadIdFromHash() :undefined,
    );

    //Listen for hash changes 
    useEffect(() =>{
        function onHashChange() {
            setThreadId(getThreadIdFromHash());
        }

        window.addEventListener("hashchange",onHashChange);
        return () => window.removeEventListener("hashchange",onHashChange);
    },[]);


}






function getThreadIdFromHash() {
    return window.location.hash.replace(/^#/, "") || undefined;
  }