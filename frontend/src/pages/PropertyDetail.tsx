import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Star,
  Users,
  Wifi,
  UtensilsCrossed,
  Waves,
  Car,
  ArrowLeft,
  Check,
  Calendar,
  Shield,
} from "lucide-react";

const PropertyDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Mock property data
  const property = {
    id: "1",
    title: "Modern Villa with Ocean View",
    location: "Seminyak, Bali, Indonesia",
    price: "$250",
    rating: 4.9,
    reviews: 128,
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    ],
    description:
      "Experience luxury living in this stunning modern villa with breathtaking ocean views. Perfect for families or groups seeking a premium tropical getaway. The villa features contemporary design, infinity pool, and direct beach access.",
    amenities: [
      { icon: Wifi, label: "High-speed WiFi" },
      { icon: Waves, label: "Infinity Pool" },
      { icon: UtensilsCrossed, label: "Full Kitchen" },
      { icon: Car, label: "Free Parking" },
    ],
    highlights: [
      "Ocean view from every room",
      "Private infinity pool",
      "24/7 security",
      "Smart home features",
      "Beach access",
      "Fully equipped kitchen",
    ],
    host: {
      name: "Sarah Johnson",
      joinedYear: 2020,
      properties: 12,
    },
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link to="/properties" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-smooth" />
            <span>Back to Properties</span>
          </Link>

          {/* Title & Location */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3">{property.title}</h1>
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{property.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent fill-accent" />
                    <span className="text-lg font-semibold">{property.rating}</span>
                    <span className="text-lg">({property.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <Badge className="gradient-accent text-accent-foreground font-semibold shadow-glow px-4 py-2 text-sm">
                Verified
              </Badge>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="grid grid-cols-4 gap-4 rounded-3xl overflow-hidden mb-12 animate-scale-in">
            <div className="col-span-4 md:col-span-2 md:row-span-2 h-96 md:h-full">
              <img
                src={property.images[0]}
                alt="Main property view"
                className="w-full h-full object-cover hover:scale-105 transition-smooth duration-700"
              />
            </div>
            {property.images.slice(1).map((image, index) => (
              <div key={index} className="col-span-2 md:col-span-1 h-48">
                <img
                  src={image}
                  alt={`Property view ${index + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-smooth duration-700"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Property Stats */}
              <div className="flex items-center gap-8 pb-8 border-b border-border animate-fade-in">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold text-lg">{property.guests} Guests</div>
                    <div className="text-sm text-muted-foreground">Maximum capacity</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-2xl">🛏️</span>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{property.bedrooms} Bedrooms</div>
                    <div className="text-sm text-muted-foreground">Comfortable beds</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-2xl">🚿</span>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{property.bathrooms} Bathrooms</div>
                    <div className="text-sm text-muted-foreground">Modern facilities</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">Amenities</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-smooth"
                    >
                      <amenity.icon className="w-6 h-6 text-primary" />
                      <span className="font-medium">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">Property Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-28 p-8 shadow-elegant border-border animate-fade-in">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold">{property.price}</span>
                    <span className="text-muted-foreground">/ night</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Blockchain verified</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Check-in</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Select your dates</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Check-out</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Select your dates</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Guests</span>
                    </div>
                    <p className="text-sm text-muted-foreground">2 guests</p>
                  </div>
                </div>

                <Button className="w-full gradient-hero text-primary-foreground font-semibold shadow-elegant hover:shadow-glow transition-smooth h-14 text-lg rounded-xl mb-4">
                  Book Now with Wallet
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You won't be charged yet
                </p>

                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{property.price} × 3 nights</span>
                    <span className="font-semibold">$750</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee</span>
                    <span className="font-semibold">$45</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                    <span>Total</span>
                    <span>$795</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
