import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, ExternalLink, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getUserBookings, getProperty } from "@/lib/escrow";
import { fetchIPFSMetadata, getIPFSImageUrl } from "@/lib/ipfs";
import { BookingActions } from "@/components/BookingActions";
import { DisputeModal } from "@/components/DisputeModal";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";

const MyBookings = () => {
    const { t } = useTranslation();
    const { userData } = useAuth();
    const [filter, setFilter] = useState<"all" | "confirmed" | "completed" | "cancelled">("all");

    // Fetch current block height (approximate)
    const currentBlockHeight = 100000; // TODO: Fetch from API

    const {
        data: bookings = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["my-bookings", userData?.profile.stxAddress.testnet],
        enabled: !!userData,
        refetchOnMount: "always", // Always refetch when component mounts
        queryFn: async () => {
            if (!userData) return [];

            const userAddress = userData.profile.stxAddress.testnet;
            console.log("🔍 Fetching my bookings for user:", userAddress);

            const allBookings = await getUserBookings(userAddress, 100);

            // Filter: Only bookings where user is GUEST
            const myBookings = allBookings.filter(b => b.guest === userAddress);
            console.log(`✅ Found ${myBookings.length} bookings where user is guest`);

            // Enrich bookings with property details and IPFS metadata
            const enrichedBookings = await Promise.all(
                myBookings.map(async (booking) => {
                    try {
                        // Fetch property details
                        const property = await getProperty(booking.propertyId);
                        if (!property) {
                            console.warn(`⚠️ Property #${booking.propertyId} not found`);
                            return null;
                        }

                        // Fetch IPFS metadata
                        const metadata = await fetchIPFSMetadata(property.metadataUri);
                        if (!metadata) {
                            console.warn(`⚠️ Metadata not found for property #${booking.propertyId}`);
                            return null;
                        }

                        // Get cover image
                        const coverImage =
                            metadata.images && metadata.images.length > 0
                                ? getIPFSImageUrl(metadata.images[0])
                                : "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80";

                        return {
                            ...booking,
                            propertyTitle: metadata.title,
                            propertyLocation: metadata.location,
                            propertyImage: coverImage,
                        };
                    } catch (error) {
                        console.error(`Error enriching booking #${booking.id}:`, error);
                        return null;
                    }
                })
            );

            return enrichedBookings.filter((b) => b !== null);
        },
    });

    // Filter bookings
    const filteredBookings = bookings.filter((booking) => {
        if (filter === "all") return true;
        return booking.status === filter;
    });

    // Count by status
    const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
    const completedCount = bookings.filter((b) => b.status === "completed").length;
    const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

    if (!userData) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-24 max-w-5xl">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">My Bookings</h1>
                        <p className="text-muted-foreground">Connect your wallet to view your bookings</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) return <Loader />;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24 max-w-5xl animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-heading font-bold tracking-tight mb-2 flex items-center gap-3">
                            <ShoppingBag className="w-8 h-8 text-primary" />
                            My Bookings
                        </h1>
                        <p className="text-muted-foreground">View and manage your property bookings</p>
                    </div>
                </div>

                {bookings.length > 0 ? (
                    <>
                        {/* Filter Tabs */}
                        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
                            <TabsList>
                                <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
                                <TabsTrigger value="confirmed">Confirmed ({confirmedCount})</TabsTrigger>
                                <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
                                <TabsTrigger value="cancelled">Cancelled ({cancelledCount})</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Bookings List */}
                        <div className="space-y-6">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => (
                                    <Card key={booking.id} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Image Section */}
                                            <div className="w-full md:w-48 h-32 md:h-auto relative overflow-hidden">
                                                <img src={booking.propertyImage} alt={booking.propertyTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                                                <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
                                                    {booking.status}
                                                </Badge>
                                            </div>

                                            {/* Content Section */}
                                            <div className="flex-1 p-6 flex flex-col md:flex-row justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold mb-1">{booking.propertyTitle}</h3>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-4 mb-3">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {booking.propertyLocation}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Booking #{booking.id}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mb-2">
                                                        <p>
                                                            <strong>Total:</strong> {(booking.totalAmount / 1_000_000).toFixed(2)} STX
                                                        </p>
                                                        <p>
                                                            <strong>Check-in Block:</strong> {booking.checkIn}
                                                        </p>
                                                        <p>
                                                            <strong>Check-out Block:</strong> {booking.checkOut}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions Section */}
                                                <div className="flex flex-col items-end gap-2 min-w-[200px]">
                                                    <BookingActions booking={booking} currentBlockHeight={currentBlockHeight} onSuccess={() => refetch()} />

                                                    {/* Dispute Actions */}
                                                    {(booking.status === "confirmed" || booking.status === "completed") && (
                                                        <DisputeModal
                                                            bookingId={booking.id}
                                                            onSuccess={() => refetch()}
                                                        />
                                                    )}

                                                    <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                                                        <a href={`https://explorer.hiro.so/txid/${booking.id}?chain=testnet`} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-3 h-3" />
                                                            View on Explorer
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No {filter} bookings found</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            You haven't made any bookings yet. Start exploring properties!
                        </p>
                        <Button asChild>
                            <a href="/properties">Browse Properties</a>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
