import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Home, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
    // Mock data - in a real app, fetch this from the contract/backend
    const stats = [
        {
            title: "Total Earnings",
            value: "2,450 STX",
            change: "+12.5% from last month",
            icon: DollarSign,
        },
        {
            title: "Active Listings",
            value: "3",
            change: "+1 new this month",
            icon: Home,
        },
        {
            title: "Total Bookings",
            value: "12",
            change: "+4 pending approval",
            icon: Users,
        },
        {
            title: "Occupancy Rate",
            value: "85%",
            change: "+5% from last month",
            icon: TrendingUp,
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your listings.</p>
                </div>
                <Link to="/host/create-listing">
                    <Button className="gradient-hero shadow-elegant hover:shadow-glow transition-smooth">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Listing
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
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

            {/* Recent Activity / Bookings Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="col-span-1 lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mock History Data */}
                            {[
                                { id: 1, action: "Booking Confirmed", property: "Modern Loft", guest: "SP3...9A2", amount: "+450 STX", date: "2 mins ago", status: "success" },
                                { id: 2, action: "New Listing", property: "Seaside Villa", guest: "-", amount: "-", date: "2 days ago", status: "info" },
                                { id: 3, action: "Payout Released", property: "Mountain Cabin", guest: "SP1...8B3", amount: "+1,200 STX", date: "5 days ago", status: "success" },
                                { id: 4, action: "Booking Cancelled", property: "Modern Loft", guest: "SP2...7C1", amount: "0 STX", date: "1 week ago", status: "destructive" },
                            ].map((item) => (
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
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Action Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Complete your profile</p>
                                    <p className="text-xs text-muted-foreground">Add a profile picture to increase trust.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Verify your identity</p>
                                    <p className="text-xs text-muted-foreground">Get the "Verified Host" badge.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
