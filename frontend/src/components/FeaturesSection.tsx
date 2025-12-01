import { Shield, Zap, Globe, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeaturesSection = () => {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Why Choose StacksStay?</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
                        Decentralized <span className="text-primary">Freedom</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Experience the future of property rental with our blockchain-powered platform.
                        Secure, transparent, and built for everyone.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 max-w-7xl mx-auto">

                    {/* Feature 1: Instant Setup */}
                    <div className="group">
                        {/* Card */}
                        <div className="bg-muted/30 rounded-[2rem] aspect-square relative mb-8 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                            {/* Badge */}
                            <div className="absolute top-6 left-6 bg-foreground text-background text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider z-10">
                                Instant Setup
                            </div>

                            {/* Icon */}
                            <div className="relative z-0 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                                <Zap className="w-32 h-32 text-emerald-400 fill-emerald-400/20" strokeWidth={1.5} />
                                {/* Decorative blob behind */}
                                <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full -z-10 scale-150"></div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold font-heading">Instant Booking</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Connect your wallet and book properties instantly. No intermediaries, no delays, just seamless peer-to-peer transactions.
                            </p>
                        </div>
                    </div>

                    {/* Feature 2: Lower Fees */}
                    <div className="group">
                        {/* Card */}
                        <div className="bg-muted/30 rounded-[2rem] aspect-square relative mb-8 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                            {/* Badge */}
                            <div className="absolute bottom-6 left-6 bg-foreground text-background text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider z-10">
                                Lower Fees
                            </div>

                            {/* Icon */}
                            <div className="relative z-0 transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                                <ArrowRight className="w-32 h-32 text-purple-400 rotate-45" strokeWidth={2.5} />
                                {/* Decorative blob behind */}
                                <div className="absolute inset-0 bg-purple-400/20 blur-3xl rounded-full -z-10 scale-150"></div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold font-heading">Minimal Fees</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Say goodbye to hefty platform fees. Pay only a 2% protocol fee per successful booking, with no hidden charges.
                            </p>
                        </div>
                    </div>

                    {/* Feature 3: Global Access */}
                    <div className="group">
                        {/* Card */}
                        <div className="bg-muted/30 rounded-[2rem] aspect-square relative mb-8 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                            {/* Badge */}
                            <div className="absolute top-6 right-6 bg-foreground text-background text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider z-10">
                                Global Access
                            </div>

                            {/* Icon */}
                            <div className="relative z-0 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                                <Globe className="w-32 h-32 text-amber-400" strokeWidth={1.5} />
                                {/* Decorative blob behind */}
                                <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full -z-10 scale-150"></div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold font-heading">Borderless Travel</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Access properties from around the world with consistent quality standards and verified reviews stored on-chain.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Bottom CTA */}
                {/* <div className="mt-20 text-center">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 h-12 rounded-full transition-all hover:scale-105 shadow-lg shadow-primary/20">
                        Start Exploring
                    </Button>
                </div> */}
            </div>
        </section>
    );
};

export default FeaturesSection;
