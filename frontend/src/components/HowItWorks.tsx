import React from "react";
import { Wallet, Search, CheckCircle, Star, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      title: "Connect Wallet",
      description: "Link your Stacks wallet to access the platform. No email required.",
      icon: Wallet,
      color: "emerald",
      badge: "Secure Login",
      rotation: "group-hover:-rotate-6",
    },
    {
      number: "02",
      title: "Browse & Book",
      description: "Find your perfect stay and book instantly with minimal platform fees.",
      icon: Search,
      color: "amber",
      badge: "Instant Search",
      rotation: "group-hover:rotate-6",
    },
    {
      number: "03",
      title: "Smart Escrow",
      description: "Funds are held securely in a smart contract until you check in.",
      icon: CheckCircle,
      color: "primary",
      badge: "Protected",
      rotation: "group-hover:-rotate-3",
    },
    {
      number: "04",
      title: "Enjoy & Review",
      description: "Payment releases automatically. Leave a verified on-chain review.",
      icon: Star,
      color: "purple",
      badge: "Earn Rewards",
      rotation: "group-hover:rotate-12",
    },
  ];

  // Helper to get color classes based on the step color configuration
  const getColorClasses = (color: string) => {
    switch (color) {
      case "emerald":
        return {
          icon: "text-emerald-400 fill-emerald-400/10",
          glow: "bg-emerald-400/20",
          badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "amber":
        return {
          icon: "text-amber-400 fill-amber-400/10",
          glow: "bg-amber-400/20",
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      case "primary":
        return {
          icon: "text-primary fill-primary/10",
          glow: "bg-primary/20",
          badge: "bg-primary/10 text-primary border-primary/20",
        };
      case "purple":
        return {
          icon: "text-purple-400 fill-purple-400/10",
          glow: "bg-purple-400/20",
          badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
      default:
        return {
          icon: "text-foreground",
          glow: "bg-muted/20",
          badge: "bg-muted/10 text-foreground",
        };
    }
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Seamless Experience</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
            How It <span className="text-primary">Works</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the future of property booking in four simple steps.
            <span className="text-foreground/80"> Decentralized, secure, and instant.</span>
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 max-w-7xl mx-auto">

          {/* Connecting Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-[28%] left-[12%] right-[12%] h-px z-0">
            <div className="w-full h-full border-t-2 border-dashed border-border/30 relative"></div>
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const style = getColorClasses(step.color);

            return (
              <div key={index} className="group relative z-10">

                {/* Visual Card - Matching FeaturesSection Style */}
                <div className="bg-muted/30 rounded-[2rem] aspect-square relative mb-8 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-lg">

                  {/* Badge Pill */}
                  <div className={`absolute top-6 left-6 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md z-20 ${style.badge}`}>
                    {step.badge}
                  </div>

                  {/* Step Number (Watermark) */}
                  <div className="absolute top-4 right-6 text-9xl font-bold text-foreground/5 select-none font-heading transition-opacity duration-500 group-hover:text-foreground/10">
                    {step.number}
                  </div>

                  {/* Icon Container */}
                  <div className="relative z-0 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Icon
                      className={`w-32 h-32 ${style.icon}`}
                      strokeWidth={1.5}
                    />
                    {/* Decorative blob behind */}
                    <div className={`absolute inset-0 ${style.glow} blur-3xl rounded-full -z-10 scale-150`}></div>
                  </div>

                  {/* Interactive Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground border border-border/50 px-2 py-0.5 rounded">
                      {step.number}
                    </span>
                    <h3 className="text-2xl font-bold font-heading">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Mobile Connector Arrow (Only show between items on mobile/tablet) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center py-6">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/20 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Decorative Element */}
        <div className="mt-24 flex justify-center opacity-30">
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-border to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;