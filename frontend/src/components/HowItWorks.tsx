import { Wallet, Search, CheckCircle, ArrowRight, Star } from "lucide-react";

const HowItWorks = () => {
    const steps = [
        {
            number: "01",
            title: "Connect Wallet",
            description: "Link your Stacks wallet (like Hiro) to access the platform. No email or personal info required.",
            icon: Wallet,
            color: "from-emerald-500 to-teal-600",
            bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
            borderColor: "border-emerald-200 dark:border-emerald-800",
        },
        {
            number: "02",
            title: "Browse & Book",
            description: "Find your perfect stay and book instantly. The total cost includes a minimal 2% platform fee.",
            icon: Search,
            color: "from-amber-500 to-orange-600",
            bgColor: "bg-amber-50 dark:bg-amber-950/30",
            borderColor: "border-amber-200 dark:border-amber-800",
        },
        {
            number: "03",
            title: "Smart Escrow",
            description: "Your payment is held securely in a smart contract and only released when you check in.",
            icon: CheckCircle,
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-50 dark:bg-blue-950/30",
            borderColor: "border-blue-200 dark:border-blue-800",
        },
        {
            number: "04",
            title: "Enjoy & Review",
            description: "Enjoy your stay! Payment is automatically released to the host, and you can leave an on-chain review.",
            icon: Star,
            color: "from-purple-500 to-pink-600",
            bgColor: "bg-purple-50 dark:bg-purple-950/30",
            borderColor: "border-purple-200 dark:border-purple-800",
        },
    ];

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-block mb-4">
                        <span className="text-sm font-semibold tracking-wider uppercase text-primary bg-primary/10 px-4 py-2 rounded-full">
                            Simple Process
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        How It Works
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Get started in three simple steps
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="relative group">
                                    {/* Connector Arrow (hidden on mobile, shown on lg+) */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-24 -right-3 z-10">
                                            <ArrowRight className="w-6 h-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                        </div>
                                    )}

                                    {/* Card */}
                                    <div className={`relative h-full ${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1`}>
                                        {/* Step Number Badge */}
                                        <div className="absolute -top-4 -left-4">
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                                                <span className="text-white font-bold text-lg">{step.number}</span>
                                            </div>
                                        </div>

                                        {/* Icon */}
                                        <div className="mb-6 mt-4">
                                            <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${step.color} shadow-md`}>
                                                <Icon className="w-8 h-8 text-white" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <h3 className="text-2xl font-bold mb-3 text-foreground">
                                                {step.title}
                                            </h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>

                                        {/* Hover Effect Gradient */}
                                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom CTA */}
                {/* <div className="text-center mt-16">
                    <p className="text-muted-foreground mb-4">
                        Ready to experience the future of property booking?
                    </p>
                    <div className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-4 transition-all cursor-pointer group">
                        <span>Get Started Now</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div> */}
            </div>
        </section>
    );
};

export default HowItWorks;
