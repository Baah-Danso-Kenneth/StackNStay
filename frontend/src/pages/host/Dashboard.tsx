import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Home, Users, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getUserProperties } from "@/lib/escrow";
import { fetchIPFSMetadata, getIPFSImageUrl } from "@/lib/ipfs";
import NoProperties from "@/components/NoProperties";
import PropertyCard from "@/components/PropertyCard";
import Loader from "@/components/Loader";

const Dashboard = () => {
    const { userData } = useAuth();
    
    // Fetch user's properties from blockchain
    const { data: userProperties = [], isLoading } = useQuery({
        queryKey: ['user-properties', userData?.profile?.stxAddress?.testnet],
        enabled: !!userData?.profile?.stxAddress?.testnet,
        queryFn: async () => {
            if (!userData?.profile?.stxAddress?.testnet) {
                return [];
            }

            console.log('🔍 Fetching properties for user:', userData.profile.stxAddress.testnet);
            
            // Fetch properties owned by this user
            const blockchainProperties = await getUserProperties(
                userData.profile.stxAddress.testnet,
                50
            );
            
            console.log(`✅ Found ${blockchainProperties.length} properties for user`);

            // Enrich each property with IPFS metadata
            const enrichedProperties = await Promise.all(
                blockchainProperties.map(async (prop) => {
                    const metadata = await fetchIPFSMetadata(prop.metadataUri);

                    if (!metadata) {
                        console.warn(`⚠️ Could not fetch metadata for property #${prop.id}`);
                        return null;
                    }

                    // Get the first image URL
                    const coverImage = metadata.images && metadata.images.length > 0
                        ? getIPFSImageUrl(metadata.images[0])
                        : "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80";

                    return {
                        id: prop.id,
                        blockchain_id: prop.id,
                        title: metadata.title,
                        description: metadata.description,
                        location_city: metadata.location.split(',')[0]?.trim() || metadata.location,
                        location_country: metadata.location.split(',')[1]?.trim() || '',
                        price_per_night: Number(prop.pricePerNight),
                        max_guests: metadata.maxGuests,
                        bedrooms: metadata.bedrooms,
                        bathrooms: metadata.bathrooms,
                        amenities: metadata.amenities,
                        cover_image: coverImage,
                        images: metadata.images.map(getIPFSImageUrl),
                        active: prop.active,
                        owner: prop.owner,
                    };
                })
            );

            // Filter out null values (failed metadata fetches)
            const validProperties = enrichedProperties.filter(prop => prop !== null);
            console.log(`✅ Successfully enriched ${validProperties.length} properties with IPFS data`);

            return validProperties;
        }
    });

    const hasListings = userProperties.length > 0;
    
    // Calculate stats from user's properties
    const stats = hasListings ? [
        {
            title: "Total Listings",
            value: userProperties.length,
            change: `${userProperties.filter((p: any) => p.active).length} active`,
            icon: Home,
        },
        {
            title: "Total Revenue",
            value: "0 STX",
            change: "No bookings yet",
            icon: DollarSign,
        },
        {
            title: "Active Listings",
            value: userProperties.filter((p: any) => p.active).length,
            change: `${userProperties.filter((p: any) => !p.active).length} inactive`,
            icon: TrendingUp,
        },
        {
            title: "Total Capacity",
            value: userProperties.reduce((sum: number, p: any) => sum + (p.max_guests || 0), 0),
            change: "guests across all listings",
            icon: Users,
        },
    ] : [];
    
    const recentActivity: any[] = [];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back! Manage your listings and track your earnings.</p>
                </div>
                <Link to="/host/create-listing">
                    <Button className="gradient-hero shadow-elegant hover:shadow-glow transition-smooth">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Listing
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : !hasListings ? (
                <NoProperties variant="host" />
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat: any, index) => (
                            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-smooth">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <stat.icon className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.change}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* User's Properties List */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Your Listings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {userProperties.map((property: any) => (
                                    <PropertyCard
                                        key={property.id}
                                        id={property.blockchain_id}
                                        title={property.title || "Untitled Property"}
                                        location={`${property.location_city || ""}, ${property.location_country || ""}`}
                                        price={property.price_per_night}
                                        rating={4.8}
                                        reviews={0}
                                        guests={property.max_guests || 2}
                                        imageUrl={property.cover_image || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"}
                                        featured={false}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity / Bookings */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="col-span-1 lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No recent activity yet</p>
                                        </div>
                                    ) : (
                                        recentActivity.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-emerald-500' :
                                                        item.status === 'destructive' ? 'bg-red-500' : 'bg-blue-500'
                                                        }`} />
                                                    <div>
                                                        <p className="text-sm font-medium">{item.action}</p>
                                                        <p className="text-xs text-muted-foreground">{item.property} • {item.guest}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${item.amount.startsWith('+') ? 'text-emerald-500' : 'text-foreground'}`}>
                                                        {item.amount}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{item.date}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Quick Tips</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                                        <div>
                                            <p className="text-sm font-medium">List your first property</p>
                                            <p className="text-xs text-muted-foreground">Start earning by creating your first listing.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-accent" />
                                        <div>
                                            <p className="text-sm font-medium">Blockchain verified</p>
                                            <p className="text-xs text-muted-foreground">All transactions are secured on-chain.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;

