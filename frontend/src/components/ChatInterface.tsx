import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Sparkles } from 'lucide-react';
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get user's name or address for personalization
    const userName = userData?.profile?.name ||
        (userData?.profile?.stxAddress?.testnet ?
            `${userData.profile.stxAddress.testnet.slice(0, 4)}...${userData.profile.stxAddress.testnet.slice(-4)}`
            : 'Guest');

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
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
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
            {/* FIXED HEADER - Never scrolls */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-background/80 backdrop-blur-md shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 animate-in zoom-in duration-500">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            StackNStay AI
                        </h2>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* SCROLLABLE MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef}>
                <div className="p-4 space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 relative group">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                                <Sparkles className="w-12 h-12 text-primary relative z-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                                Hi {userName}! 👋
                            </h3>
                            <p className="text-muted-foreground max-w-md mb-8 text-lg">
                                I'm your personal assistant. How can I help you find your perfect stay today?
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                                <Badge
                                    variant="outline"
                                    className="cursor-pointer hover:bg-accent px-3 py-1.5 text-sm"
                                    onClick={() => handleSuggestedAction("What is StackNStay?")}
                                >
                                    What is StackNStay?
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="cursor-pointer hover:bg-accent px-3 py-1.5 text-sm"
                                    onClick={() => handleSuggestedAction("Find me a 2-bedroom apartment")}
                                >
                                    Find properties
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="cursor-pointer hover:bg-accent px-3 py-1.5 text-sm"
                                    onClick={() => handleSuggestedAction("How do fees work?")}
                                >
                                    How do fees work?
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatMessage key={message.id} message={message} onClose={onClose} />
                        ))
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex gap-3 animate-in fade-in duration-300">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                            <div className="flex-1">
                                <div className="rounded-2xl px-4 py-3 bg-muted max-w-[80%] shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suggested Actions (Bottom) */}
                    {suggestedActions.length > 0 && !isLoading && messages.length > 0 && (
                        <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">💡 You might want to ask:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedActions.map((action, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 shadow-sm px-3 py-1.5"
                                        onClick={() => handleSuggestedAction(action)}
                                    >
                                        {action}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FIXED INPUT AREA - Always visible at bottom */}
            <div className="flex-shrink-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 shadow-lg">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                        className="flex-shrink-0 shadow-sm hover:shadow-md transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;