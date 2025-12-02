import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const History = () => {
    const { t } = useTranslation();

    // Mock data - replace with contract calls
    const historyItems = [
        {
            id: 1,
            type: "booking",
            property: "Modern Loft in Downtown",
            location: "New York, NY",
            dates: "Oct 12 - Oct 15, 2024",
            amount: "450 STX",
            status: "completed",
            txId: "0x123...abc",
            image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: 2,
            type: "booking",
            property: "Seaside Villa",
            location: "Miami, FL",
            dates: "Sep 05 - Sep 10, 2024",
            amount: "1,200 STX",
            status: "cancelled",
            txId: "0x456...def",
            image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
        },
        {
            id: 3,
            type: "booking",
            property: "Mountain Cabin",
            location: "Aspen, CO",
            dates: "Aug 20 - Aug 25, 2024",
            amount: "800 STX",
            status: "completed",
            txId: "0x789...ghi",
            image: "https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?auto=format&fit=crop&w=800&q=80",
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
            case "cancelled": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
            case "upcoming": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
            default: return "bg-gray-500/10 text-gray-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return <CheckCircle className="w-4 h-4 mr-1" />;
            case "cancelled": return <XCircle className="w-4 h-4 mr-1" />;
            case "upcoming": return <Clock className="w-4 h-4 mr-1" />;
            default: return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-24 max-w-5xl animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold tracking-tight mb-2">History</h1>
                    <p className="text-muted-foreground">View your past trips and transaction history.</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">All</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">Completed</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">Cancelled</Button>
                </div>
            </div>

            <div className="space-y-6">
                {historyItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row">
                            {/* Image Section */}
                            <div className="w-full md:w-48 h-32 md:h-auto relative overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.property}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary" className={getStatusColor(item.status)}>
                                                {getStatusIcon(item.status)}
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-mono">{item.amount}</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-1">{item.property}</h3>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {item.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.dates}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <Button variant="outline" size="sm" className="gap-2 w-full md:w-auto">
                                            <ExternalLink className="w-3 h-3" />
                                            View Receipt
                                        </Button>
                                        {item.status === "completed" && (
                                            <Button size="sm" className="gap-2 w-full md:w-auto gradient-hero">
                                                Write Review
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default History;
