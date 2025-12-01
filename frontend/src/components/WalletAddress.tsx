import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface WalletAddressProps {
    address: string;
}

export const WalletAddress = ({ address }: WalletAddressProps) => {
    const [copied, setCopied] = useState(false);

    const truncateAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            onClick={copyToClipboard}
            className="group relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-primary-glow/10 hover:from-primary/20 hover:to-primary-glow/20 rounded-full cursor-pointer transition-all duration-300 border border-primary/20"
            title={address}
        >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono font-medium text-foreground">
                {truncateAddress(address)}
            </span>
            {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
            ) : (
                <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}

            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                {copied ? "Copied!" : "Click to copy"}
            </div>
        </div>
    );
};
