import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Calendar, History, LogOut, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { WalletAddress } from "./WalletAddress";

interface UserMenuProps {
    address: string;
    onDisconnect: () => void;
}

export const UserMenu = ({ address, onDisconnect }: UserMenuProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                    <WalletAddress address={address} />
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="flex items-center gap-2 cursor-pointer">
                        <Calendar className="w-4 h-4" />
                        <span>My Bookings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/history" className="flex items-center gap-2 cursor-pointer">
                        <History className="w-4 h-4" />
                        <span>History</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/host/dashboard" className="flex items-center gap-2 cursor-pointer font-medium">
                        <User className="w-4 h-4" />
                        <span>Switch to Hosting</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onDisconnect}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect Wallet</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
