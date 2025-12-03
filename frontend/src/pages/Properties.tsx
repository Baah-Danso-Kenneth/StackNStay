import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import NoProperties from "@/components/NoProperties";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllProperties } from "@/lib/escrow";
import { fetchIPFSMetadata, getIPFSImageUrl } from "@/lib/ipfs";
import "@/lib/debug"; // Load blockchain debug utilities

const Properties = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: properties = [], isLoading, error, refetch } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      console.log('🔍 Fetching properties from blockchain...');

      // Fetch properties from blockchain
      const blockchainProperties = await getAllProperties(20);
      console.log(`✅ Found ${blockchainProperties.length} properties on blockchain`);

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
            price_per_night: prop.pricePerNight,
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

  const handleRefresh = () => {
    console.log('🔄 Manually refreshing properties...');
    refetch();
  };

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error loading properties</h2>
          <p className="text-muted-foreground">{(error as Error).message}</p>
          <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold mb-4">Explore Properties</h1>
                <p className="text-xl text-muted-foreground">
                  Discover verified rental spaces from around the world
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-12 animate-slide-up">
            <SearchBar />
          </div>

          {properties.length > 0 ? (
            <>
              {/* View Toggle & Results Count */}
              <div className="flex items-center justify-between mb-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold">{properties.length} Properties Available</h2>
                  <p className="text-sm text-muted-foreground mt-1">Verified listings on the blockchain</p>
                </div>

                <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "gradient-hero text-primary-foreground" : ""}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "gradient-hero text-primary-foreground" : ""}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Property Grid */}
              <div className={`grid gap-8 ${viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
                } animate-scale-in`}>
                {properties.map((property: any, index: number) => (
                  <div
                    key={property.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <PropertyCard
                      id={property.blockchain_id}
                      title={property.title || "Untitled Property"}
                      location={`${property.location_city || ""}, ${property.location_country || ""}`}
                      price={`${(property.price_per_night / 1_000_000).toFixed(2)} STX`}
                      rating={4.8} // Mock rating
                      reviews={12} // Mock reviews
                      guests={property.max_guests || 2}
                      imageUrl={property.cover_image || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"}
                      featured={index === 0}
                    />
                  </div>
                ))}
              </div>

              {/* Load More */}
              <div className="mt-16 text-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-border hover:border-primary transition-smooth px-12 h-14 rounded-xl font-semibold"
                >
                  Load More Properties
                </Button>
              </div>
            </>
          ) : (
            <NoProperties variant="general" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Properties;