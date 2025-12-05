import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink, User } from "lucide-react";
import { BookingActions } from "@/components/BookingActions";
import { DisputeModal } from "@/components/DisputeModal";
import type { Booking } from "@/lib/escrow";

interface EnrichedBooking extends Booking {
    id: number;
    propertyTitle?: string;
    propertyLocation?: string;
    propertyImage?: string;
}

interface BookingCardHorizontalProps {
    booking: EnrichedBooking;
    userRole: "guest" | "host";
    currentBlockHeight: number;
    onSuccess?: () => void;
}

export function BookingCardHorizontal({
    booking,
    userRole,
    currentBlockHeight,
    onSuccess,
}: BookingCardHorizontalProps) {
    return (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
            <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-64 h-40 md:h-auto relative overflow-hidden flex-shrink-0">
                    <img
                        src={booking.propertyImage || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"}
                        alt={booking.propertyTitle || "Property"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />

                    {/* Role Badge */}
                    <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground backdrop-blur-sm">
                        <User className="w-3 h-3 mr-1" />
                        {userRole === "guest" ? "Guest" : "Host"}
                    </Badge>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 flex flex-col md:flex-row justify-between gap-4">
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2 truncate">
                            {booking.propertyTitle || `Property #${booking.propertyId}`}
                        </h3>

                        <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-2 mb-3">
                            {booking.propertyLocation && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{booking.propertyLocation}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                Booking #{booking.id}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="ml-2 font-semibold">
                                    {(booking.totalAmount / 1_000_000).toFixed(2)} STX
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Check-in Block:</span>
                                <span className="ml-2 font-medium">{booking.checkIn}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Check-out Block:</span>
                                <span className="ml-2 font-medium">{booking.checkOut}</span>
                            </div>
                            {userRole === "host" && (
                                <div>
                                    <span className="text-muted-foreground">Your Payout:</span>
                                    <span className="ml-2 font-semibold text-emerald-500">
                                        {(booking.hostPayout / 1_000_000).toFixed(2)} STX
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Guest/Host Address (for reference) */}
                        <div className="mt-3 text-xs text-muted-foreground">
                            {userRole === "guest" ? (
                                <span>Host: {booking.host.slice(0, 8)}...{booking.host.slice(-6)}</span>
                            ) : (
                                <span>Guest: {booking.guest.slice(0, 8)}...{booking.guest.slice(-6)}</span>
                            )}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-col items-start md:items-end gap-3 md:min-w-[220px]">
                        {/* Booking Actions (Release/Cancel) */}
                        <BookingActions
                            booking={booking}
                            currentBlockHeight={currentBlockHeight}
                            onSuccess={onSuccess}
                        />

                        {/* Dispute Modal */}
                        {(booking.status === "confirmed" || booking.status === "completed") && (
                            <DisputeModal
                                bookingId={booking.id}
                                onSuccess={onSuccess}
                            />
                        )}

                        {/* View on Explorer */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 w-full md:w-auto"
                            asChild
                        >
                            <a
                                href={`https://explorer.hiro.so/txid/${booking.id}?chain=testnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View on Explorer
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
