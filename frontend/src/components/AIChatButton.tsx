import { useState, useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ChatInterface from "./ChatInterface";


const AIChatButton = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsChatOpen(true)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="fixed bottom-6 right-6 z-50 group"
                aria-label="Open AI Assistant"
            >
                {/* Pulsing ring animation - REMOVED for subtlety */}
                {/* <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-75 animate-ping"></div> */}

                {/* Outer glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>

                {/* Main button */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary via-primary-glow to-accent rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 group-hover:shadow-primary/70 transition-all duration-300 group-hover:scale-110">
                    {/* Robot icon */}
                    <Bot className="w-8 h-8 text-white relative z-10" />

                    {/* Sparkle effect on hover */}
                    {isHovered && (
                        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-pulse" />
                    )}
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <p className="text-sm font-medium text-foreground">Ask AI Assistant</p>
                        <p className="text-xs text-muted-foreground">Get instant help</p>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full right-6 -mt-1">
                        <div className="w-2 h-2 bg-card border-r border-b border-border rotate-45"></div>
                    </div>
                </div>
            </button>

            {/* Chat Dialog */}
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
                    <ChatInterface onClose={() => setIsChatOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AIChatButton;
