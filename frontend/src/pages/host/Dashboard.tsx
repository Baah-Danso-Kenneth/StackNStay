import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Home, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import NoProperties from "@/components/NoProperties";

const Dashboard = () => {
    // TODO: Fetch host data from blockchain
    const hasListings = false;
    const stats = [];
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

            {!hasListings ? (
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

