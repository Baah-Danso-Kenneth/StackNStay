import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

const Properties = () => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Mock property data - will be replaced with blockchain data
  const properties = [
    {
      id: "1",
      title: "Modern Villa with Ocean View",
      location: "Bali, Indonesia",
      price: "$250",
      rating: 4.9,
      reviews: 128,
      guests: 6,
      imageUrl: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
      featured: true,
    },
    {
      id: "2",
      title: "Cozy Mountain Cabin",
      location: "Aspen, Colorado",
      price: "$180",
      rating: 4.8,
      reviews: 95,
      guests: 4,
      imageUrl: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80",
      featured: false,
    },
    {
      id: "3",
      title: "Downtown Luxury Apartment",
      location: "New York, USA",
      price: "$320",
      rating: 4.7,
      reviews: 203,
      guests: 4,
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      featured: true,
    },
    {
      id: "4",
      title: "Beachfront Paradise",
      location: "Maldives",
      price: "$450",
      rating: 5.0,
      reviews: 87,
      guests: 8,
      imageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
      featured: true,
    },
    {
      id: "5",
      title: "Historic City Loft",
      location: "Paris, France",
      price: "$280",
      rating: 4.9,
      reviews: 156,
      guests: 3,
      imageUrl: "https://images.unsplash.com/photo-1502672260066-6bc09da47849?w=800&q=80",
      featured: false,
    },
    {
      id: "6",
      title: "Tropical Garden Villa",
      location: "Phuket, Thailand",
      price: "$195",
      rating: 4.8,
      reviews: 142,
      guests: 5,
      imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      featured: false,
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold mb-4">Explore Properties</h1>
            <p className="text-xl text-muted-foreground">
              Discover verified rental spaces from around the world
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12 animate-slide-up">
            <SearchBar />
          </div>

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
          <div className={`grid gap-8 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          } animate-scale-in`}>
            {properties.map((property, index) => (
              <div
                key={property.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <PropertyCard {...property} />
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
        </div>
      </div>
    </div>
  );
};

export default Properties;
