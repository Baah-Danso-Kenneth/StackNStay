import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Sparkles, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';

interface ChatInterfaceProps {
    onClose?: () => void;
}

function ChatInterface({ onClose }: ChatInterfaceProps) {
    const [inputValue, setInputValue] = useState('');
    const { messages, isLoading, suggestedActions, sendMessage, sendSuggestedAction, clearChat } = useChat();
    const { userData } = useAuth();
    
    // Refs for scrolling logic
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const userName = userData?.profile?.name || 'Guest';

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Initial focus
    useEffect(() => {
        // Small timeout ensures the animation is done before focus
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleSend = () => {
        if (inputValue.trim() && !isLoading) {
            sendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestedAction = (action: string) => {
        sendSuggestedAction(action);
    };

    return (
        /* 
           MAIN CONTAINER - LAYOUT FIX
           1. h-full: Takes full height of parent.
           2. flex-col: Stacks Header, Messages, Input vertically.
           3. overflow-hidden: Prevents outer scrollbars.
        */
        <div className="flex flex-col h-full w-full bg-muted/10 relative overflow-hidden">
            
            {/* 1. HEADER (Fixed Height) */}
            <div className="flex-none h-16 px-4 border-b bg-background/80 backdrop-blur-md z-20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-md">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-semibold text-sm leading-none">Assistant</h2>
                        <span className="text-xs text-muted-foreground mt-1">Always active</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearChat}
                            title="Clear conversation"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                    {onClose && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose}
                            className="h-8 w-8 text-muted-foreground hover:bg-muted"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. MESSAGES AREA (Flexible Height, Scrollable) 
                - flex-1: Takes up all available space between header and input.
                - overflow-y-auto: Allows scrolling within this area only.
                - min-h-0: CRITICAL for nested flex scrolling to work properly.
            */}
            <div 
                className="flex-1 overflow-y-auto min-h-0 scroll-smooth px-4 py-4 space-y-6" 
                ref={scrollContainerRef}
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Hello, {userName}!</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px] mb-8">
                            I can help you browse properties, understand fees, or manage your bookings.
                        </p>
                        
                        <div className="grid gap-2 w-full max-w-xs">
                            {[
                                "Find me a 2-bedroom apartment",
                                "How do fees work?",
                                "Show me luxury stays"
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestedAction(action)}
                                    className="text-sm bg-background border border-border/50 hover:border-primary/50 hover:bg-accent/50 p-3 rounded-lg text-left transition-all duration-200"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} onClose={onClose} />
                        ))}
                        
                        {/* Loading State Bubble */}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                    <div className="flex space-x-1 h-4 items-center">
                                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Invisible element to scroll to */}
                        <div ref={messagesEndRef} className="h-px w-full" />
                    </>
                )}
            </div>

            {/* 3. INPUT AREA (Fixed at Bottom) 
                - flex-none: Prevents shrinking.
                - z-20: Ensures it sits above any scroll overlaps (though layout prevents this).
            */}
            <div className="flex-none p-4 bg-background border-t shadow-[0_-1px_10px_rgba(0,0,0,0.03)] z-20">
                
                {/* Quick Actions (only show if not loading and has messages) */}
                {suggestedActions.length > 0 && !isLoading && messages.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2 mask-linear-fade">
                        {suggestedActions.map((action, idx) => (
                            <Badge
                                key={idx}
                                variant="outline"
                                className="cursor-pointer whitespace-nowrap bg-background hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3 border-primary/20"
                                onClick={() => handleSuggestedAction(action)}
                            >
                                {action}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-muted/50 p-1.5 rounded-xl border border-transparent focus-within:border-primary/30 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="border-none shadow-none focus-visible:ring-0 bg-transparent min-h-[44px] max-h-32 py-3 px-3 resize-none"
                    />
                    
                    <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                        className={`h-9 w-9 mb-1 mr-1 rounded-lg transition-all duration-300 ${
                            inputValue.trim() 
                                ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg scale-100' 
                                : 'bg-muted-foreground/20 text-muted-foreground scale-95'
                        }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 ml-0.5" />
                        )}
                    </Button>
                </div>
                
                <div className="text-[10px] text-center text-muted-foreground/60 mt-2">
                    AI can make mistakes. Check important info.
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;