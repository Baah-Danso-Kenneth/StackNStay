import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History as HistoryIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getUserBookings, getProperty } from "@/lib/escrow";
import { fetchIPFSMetadata, getIPFSImageUrl } from "@/lib/ipfs";
import { BookingCardHorizontal } from "@/components/BookingCardHorizontal";
import NoHistory from "@/components/NoHistory";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";

const History = () => {
    const { t } = useTranslation();
    const { userData } = useAuth();
    const [filter, setFilter] = useState<"all" | "guest" | "host" | "confirmed" | "completed" | "cancelled">("all");

    // Fetch current block height (approximate)
    const currentBlockHeight = 100000; // TODO: Fetch from API

    const {
        data: bookings = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["user-history", userData?.profile.stxAddress.testnet],
        enabled: !!userData,
        refetchOnMount: "always", // Always refetch when component mounts
        queryFn: async () => {
            if (!userData) return [];

            const userAddress = userData.profile.stxAddress.testnet;
            console.log("🔍 Fetching all bookings for user history:", userAddress);

            // Fetch ALL bookings where user is either guest OR host
            const allBookings = await getUserBookings(userAddress, 100);
            console.log(`✅ Found ${allBookings.length} total bookings (as guest or host)`);

            // Enrich bookings with property details and IPFS metadata
            const enrichedBookings = await Promise.all(
                allBookings.map(async (booking) => {
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

    // Filter bookings based on selected filter
    const filteredBookings = bookings.filter((booking) => {
        const userAddress = userData?.profile.stxAddress.testnet;
        const isGuest = booking.guest === userAddress;
        const isHost = booking.host === userAddress;

        // Role-based filtering
        if (filter === "guest") return isGuest;
        if (filter === "host") return isHost;

        // Status-based filtering
        if (filter === "confirmed" || filter === "completed" || filter === "cancelled") {
            return booking.status === filter;
        }

        // "all" shows everything
        return true;
    });

    // Count by role and status
    const guestBookingsCount = bookings.filter((b) => b.guest === userData?.profile.stxAddress.testnet).length;
    const hostBookingsCount = bookings.filter((b) => b.host === userData?.profile.stxAddress.testnet).length;
    const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
    const completedCount = bookings.filter((b) => b.status === "completed").length;
    const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

    if (!userData) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-24 max-w-5xl">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Booking History</h1>
                        <p className="text-muted-foreground">Connect your wallet to view your booking history</p>
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
                            <HistoryIcon className="w-8 h-8 text-primary" />
                            Activity History
                        </h1>
                        <p className="text-muted-foreground">Track all your bookings and activities on StackNStay</p>
                    </div>
                </div>

                {bookings.length > 0 ? (
                    <>
                        {/* Filter Tabs */}
                        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
                            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
                                <TabsTrigger value="guest">As Guest ({guestBookingsCount})</TabsTrigger>
                                <TabsTrigger value="host">As Host ({hostBookingsCount})</TabsTrigger>
                                <TabsTrigger value="confirmed">Confirmed ({confirmedCount})</TabsTrigger>
                                <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
                                <TabsTrigger value="cancelled">Cancelled ({cancelledCount})</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Bookings List */}
                        <div className="space-y-4">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => {
                                    const userAddress = userData?.profile.stxAddress.testnet;
                                    const userRole = booking.guest === userAddress ? "guest" : "host";

                                    return (
                                        <BookingCardHorizontal
                                            key={booking.id}
                                            booking={booking}
                                            userRole={userRole}
                                            currentBlockHeight={currentBlockHeight}
                                            onSuccess={() => refetch()}
                                        />
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">
                                        No {filter === "all" ? "" : filter} activities found
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <NoHistory />
                )}
            </div>
        </div>
    );
};

export default History;
