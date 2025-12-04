import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award, MapPin, Calendar, ShieldCheck, Edit, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useBadges } from "@/hooks/use-badge";
import { useReputation } from "@/hooks/use-reputation";
import { WalletAddress } from "@/components/WalletAddress";
import NoBadges from "@/components/NoBadges";
import Navbar from "@/components/Navbar";

const Profile = () => {
    const { userData } = useAuth();
    const { badges, isLoading: badgesLoading, error: badgesError } = useBadges();
    const { stats, formattedRating, reviews, isLoading: reputationLoading } = useReputation();

    // Mock data for non-blockchain fields
    const userStats = {
        tripsTaken: 12, // TODO: Fetch from booking contract
        propertiesListed: 2, // TODO: Fetch from property contract
        joinedDate: "October 2023",
        verified: true,
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24 max-w-5xl animate-fade-in">
                {/* Header Section */}
                <div className="relative mb-12">
                    <div className="h-48 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-background border border-border/50 overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
                    </div>

                    <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-background shadow-xl bg-muted">
                            <img
                                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${userData?.profile.stxAddress.mainnet || 'user'}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="mb-4 space-y-1">
                            <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
                                User Account
                                {userStats.verified && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
                            </h1>
                            <div className="flex items-center gap-4">
                                <WalletAddress address={userData?.profile.stxAddress.mainnet || ""} className="scale-90 origin-left" />
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Joined {userStats.joinedDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-8">
                        <Button variant="outline" className="gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">
                    {/* Left Column: Stats & Reputation */}
                    <div className="space-y-6">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    Reputation Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reputationLoading ? (
                                    <div className="flex items-center gap-2 py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground">Loading stats...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-4xl font-bold">{formattedRating.toFixed(1)}</span>
                                            <span className="text-muted-foreground mb-1">/ 5.0</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Based on {stats?.totalReviews || 0} reviews</p>
                                    </>
                                )}

                                <div className="mt-6 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Trips Taken</span>
                                        <span className="font-medium">{userStats.tripsTaken}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Properties Listed</span>
                                        <span className="font-medium">{userStats.propertiesListed}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Reviews */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Reviews</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reputationLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.slice(0, 3).map((review) => (
                                            <div key={review.id} className="border-b border-border/50 last:border-0 pb-4 last:pb-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <WalletAddress address={review.reviewer} className="scale-75 origin-left" />
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-3 h-3 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(review.createdAt * 1000).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                                            </div>
                                        ))}
                                        {reviews.length > 3 && (
                                            <Button variant="link" className="w-full text-xs h-auto p-0 mt-2">
                                                View all {reviews.length} reviews
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Badges & Achievements */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-heading font-bold">Badges & Milestones</h2>
                            {badges.length > 0 && (
                                <span className="text-sm text-muted-foreground">{badges.length} Unlocked</span>
                            )}
                        </div>

                        {badgesLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-sm text-muted-foreground">Loading badges...</p>
                            </div>
                        ) : badgesError ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                <Award className="w-12 h-12 text-destructive mb-4" />
                                <p className="text-sm text-destructive">Error loading badges: {badgesError}</p>
                            </div>
                        ) : badges.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {badges.map((badge) => {
                                    const earnedDate = new Date(badge.earnedAt * 1000).toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric'
                                    });

                                    return (
                                        <div
                                            key={badge.id}
                                            className="relative group overflow-hidden rounded-xl border transition-all duration-500 bg-[#1a0b2e] border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:border-[#a855f7]"
                                        >
                                            {/* Cyberpunk Card Header */}
                                            <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest border-b bg-[#2d1b4e] text-[#d8b4fe] border-[#a855f7]/30">
                                                {badge.typeInfo?.name || 'Achievement'} Badge
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-6 flex flex-col items-center text-center relative z-10">
                                                {/* Hexagon Icon Container */}
                                                <div className="relative mb-6 group-hover:scale-110 transition-transform duration-500">
                                                    <div className="absolute inset-0 blur-xl rounded-full bg-[#a855f7]/40"></div>
                                                    <div
                                                        className="relative w-24 h-24 flex items-center justify-center clip-path-hexagon bg-gradient-to-br from-[#a855f7] to-[#7e22ce]"
                                                        style={{ backgroundColor: badge.color }}
                                                    >
                                                        <div className="w-[96%] h-[96%] bg-[#1a0b2e] clip-path-hexagon flex items-center justify-center">
                                                            <div className="text-4xl filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                                                                {badge.icon}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Details */}
                                                <div className="space-y-4 w-full">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-[#a855f7] font-mono uppercase tracking-wider">Achievement</p>
                                                        <h3 className="font-bold text-white text-lg">{badge.typeInfo?.name || 'Badge'}</h3>
                                                    </div>

                                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a855f7]/50 to-transparent"></div>

                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-[#a855f7] font-mono uppercase tracking-wider">Description</p>
                                                        <p className="text-xs text-gray-300 leading-relaxed">
                                                            {badge.typeInfo?.description || 'Achievement unlocked'}
                                                        </p>
                                                    </div>

                                                    <div className="pt-2">
                                                        <Badge variant="outline" className="border-[#a855f7] text-[#d8b4fe] bg-[#a855f7]/10 text-[10px] px-2 py-0.5">
                                                            UNLOCKED: {earnedDate}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Decorative Corners */}
                                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#a855f7] rounded-tl-md opacity-50"></div>
                                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#a855f7] rounded-tr-md opacity-50"></div>
                                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#a855f7] rounded-bl-md opacity-50"></div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#a855f7] rounded-br-md opacity-50"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <NoBadges />
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Profile;
