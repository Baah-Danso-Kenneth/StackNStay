/**
 * Property Chat Card
 * Simplified property card for chat interface
 */
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Bed, Bath, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getIPFSImageUrl } from '@/lib/ipfs';
import type { Property } from '@/lib/api/chat';

interface PropertyChatCardProps {
    property: Property;
    onClose?: () => void;
}

export function PropertyChatCard({ property, onClose }: PropertyChatCardProps) {
    const navigate = useNavigate();

    const imageUrl = property.images && property.images.length > 0
        ? getIPFSImageUrl(property.images[0])
        : '/placeholder-property.jpg';

    const matchScore = property.match_score ? Math.round(property.match_score * 100) : null;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="relative h-32">
                <img
                    src={imageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.currentTarget.src = '/placeholder-property.jpg';
                    }}
                />
                {matchScore && (
                    <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm">
                        <Star className="w-3 h-3 mr-1" />
                        {matchScore}% match
                    </Badge>
                )}
            </div>

            <CardContent className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-base line-clamp-1">
                    {property.title}
                </h3>

                {/* Location */}
                {property.location_city && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1" />
                        {property.location_city}
                        {property.location_country && `, ${property.location_country}`}
                    </div>
                )}

                {/* Details */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {property.max_guests && (
                        <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {property.max_guests}
                        </div>
                    )}
                    {property.bedrooms && (
                        <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            {property.bedrooms}
                        </div>
                    )}
                    {property.bathrooms && (
                        <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            {property.bathrooms}
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                        <span className="text-lg font-bold text-primary">
                            {property.price_per_night} STX
                        </span>
                        <span className="text-sm text-muted-foreground"> /night</span>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => {
                            navigate(`/property/${property.property_id}`);
                            onClose?.();
                        }}
                    >
                        View
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
