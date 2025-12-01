import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Users } from "lucide-react";

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  guests: number;
  imageUrl: string;
  featured?: boolean;
}

const PropertyCard = ({
  id,
  title,
  location,
  price,
  rating,
  reviews,
  guests,
  imageUrl,
  featured,
}: PropertyCardProps) => {
  return (
    <Link to={`/property/${id}`} className="group block">
      <div className="bg-card rounded-2xl overflow-hidden shadow-elegant hover:shadow-lift transition-smooth border border-border">
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-110"
          />
          {featured && (
            <Badge className="absolute top-4 left-4 gradient-accent text-accent-foreground font-semibold shadow-glow">
              Featured
            </Badge>
          )}
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-semibold">{rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{price}</span>
              <span className="text-sm text-muted-foreground"> / night</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{guests} guests</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{reviews} reviews</span>
            <span className="text-xs font-semibold text-primary group-hover:text-primary-glow transition-smooth">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
