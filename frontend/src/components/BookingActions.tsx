import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { openContractCall } from "@stacks/connect";
import { releasePayment, cancelBooking, type Booking } from "@/lib/escrow";
import { CheckCircle, XCircle, Clock, DollarSign, AlertTriangle } from "lucide-react";

interface BookingActionsProps {
    booking: Booking & { id: number };
    currentBlockHeight: number;
    onSuccess?: () => void;
}

/**
 * Calculate refund percentage based on blocks until check-in
 * Matches smart contract logic:
 * - 1008+ blocks (7 days): 100% refund
 * - 432-1008 blocks (3-7 days): 50% refund
 * - <432 blocks (3 days): 0% refund
 */
function calculateRefundPercentage(blocksUntilCheckIn: number): number {
    if (blocksUntilCheckIn >= 1008) return 100;
    if (blocksUntilCheckIn >= 432) return 50;
    return 0;
}

/**
 * Convert blocks to approximate days (144 blocks per day)
 */
function blocksToDays(blocks: number): number {
    return Math.floor(blocks / 144);
}

export function BookingActions({ booking, currentBlockHeight, onSuccess }: BookingActionsProps) {
    const { userData } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!userData) return null;

    const userAddress = userData.profile.stxAddress.testnet;
    const isHost = userAddress === booking.host;
    const isGuest = userAddress === booking.guest;
    const blocksUntilCheckIn = Math.max(0, booking.checkIn - currentBlockHeight);
    const daysUntilCheckIn = blocksToDays(blocksUntilCheckIn);
    const canRelease = isHost && booking.status === "confirmed" && currentBlockHeight >= booking.checkIn && booking.escrowedAmount > 0;
    const canCancel = (isHost || isGuest) && booking.status === "confirmed" && currentBlockHeight < booking.checkIn && booking.escrowedAmount > 0;
    const refundPercentage = calculateRefundPercentage(blocksUntilCheckIn);
    const refundAmount = (booking.totalAmount / 1_000_000) * (refundPercentage / 100);

    const handleReleasePayment = async () => {
        setIsProcessing(true);
        try {
            const contractCallOptions = await releasePayment(booking.id);

            await openContractCall({
                ...contractCallOptions,
                onFinish: async (data) => {
                    toast({
                        title: "Payment Released",
                        description: `Payment of ${(booking.hostPayout / 1_000_000).toFixed(2)} STX has been released to the host.`,
                    });
                    onSuccess?.();
                },
                onCancel: () => {
                    toast({
                        title: "Transaction Cancelled",
                        description: "Payment release was cancelled",
                        variant: "destructive",
                    });
                    setIsProcessing(false);
                },
            });
        } catch (error) {
            console.error("Error releasing payment:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to release payment",
                variant: "destructive",
            });
            setIsProcessing(false);
        }
    };

    const handleCancelBooking = async () => {
        setIsProcessing(true);
        try {
            const contractCallOptions = await cancelBooking(booking.id);

            await openContractCall({
                ...contractCallOptions,
                onFinish: async (data) => {
                    toast({
                        title: "Booking Cancelled",
                        description: `Refund of ${refundAmount.toFixed(2)} STX (${refundPercentage}%) will be processed.`,
                    });
                    onSuccess?.();
                },
                onCancel: () => {
                    toast({
                        title: "Transaction Cancelled",
                        description: "Booking cancellation was cancelled",
                        variant: "destructive",
                    });
                    setIsProcessing(false);
                },
            });
        } catch (error) {
            console.error("Error cancelling booking:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to cancel booking",
                variant: "destructive",
            });
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
                {booking.status === "confirmed" && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Confirmed
                    </Badge>
                )}
                {booking.status === "completed" && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                )}
                {booking.status === "cancelled" && (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelled
                    </Badge>
                )}
            </div>

            {/* Countdown for confirmed bookings */}
            {booking.status === "confirmed" && blocksUntilCheckIn > 0 && (
                <p className="text-xs text-muted-foreground">
                    Check-in in ~{daysUntilCheckIn} {daysUntilCheckIn === 1 ? "day" : "days"}
                </p>
            )}

            {/* Escrowed amount display */}
            {booking.escrowedAmount > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {(booking.escrowedAmount / 1_000_000).toFixed(2)} STX in escrow
                </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
                {/* Release Payment Button (Host only, after check-in) */}
                {canRelease && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" className="gradient-hero" disabled={isProcessing}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Release Payment
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Release Payment to Host?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will release {(booking.hostPayout / 1_000_000).toFixed(2)} STX to the host and{" "}
                                    {(booking.platformFee / 1_000_000).toFixed(2)} STX as platform fee. The booking will be marked as completed.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleReleasePayment} disabled={isProcessing}>
                                    {isProcessing ? "Processing..." : "Confirm Release"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {/* Cancel Booking Button (Guest or Host, before check-in) */}
                {canCancel && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" disabled={isProcessing}>
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancel Booking
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel This Booking?</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                    <p>
                                        Based on the cancellation policy, you will receive a <strong>{refundPercentage}% refund</strong> (
                                        {refundAmount.toFixed(2)} STX).
                                    </p>
                                    {refundPercentage < 100 && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-semibold text-amber-500">Cancellation Fee Applied</p>
                                                <p className="text-muted-foreground">
                                                    Cancelling {daysUntilCheckIn} {daysUntilCheckIn === 1 ? "day" : "days"} before check-in results in a{" "}
                                                    {100 - refundPercentage}% fee.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelBooking} disabled={isProcessing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {isProcessing ? "Processing..." : "Confirm Cancellation"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
}
