import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 font-heading">Common Questions</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to know about fees, support, and how StacksStay works.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {/* Fees */}
                        <AccordionItem value="item-1" className="bg-card px-6 rounded-xl border border-border">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                What are the platform fees?
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                StacksStay charges a minimal <strong>2% platform fee</strong> on all bookings. This is significantly lower than traditional platforms (15-20%) because our smart contracts automate the process, eliminating expensive intermediaries.
                                <br /><br />
                                Example: For a 5,000 STX booking, the fee is only 100 STX.
                            </AccordionContent>
                        </AccordionItem>

                        {/* Transaction Pending */}
                        <AccordionItem value="item-2" className="bg-card px-6 rounded-xl border border-border">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                My transaction is pending forever
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Check the Stacks blockchain explorer with your transaction ID. Transactions usually confirm within 10-30 minutes depending on network congestion.
                            </AccordionContent>
                        </AccordionItem>

                        {/* Not Enough STX */}
                        <AccordionItem value="item-3" className="bg-card px-6 rounded-xl border border-border">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                I don't have enough STX
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                You need enough STX to cover the booking cost plus a small transaction fee (~0.1 STX). You can buy more STX on exchanges like Coinbase, Binance, or Kraken.
                            </AccordionContent>
                        </AccordionItem>

                        {/* Host Not Responding */}
                        <AccordionItem value="item-4" className="bg-card px-6 rounded-xl border border-border">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                Host isn't responding
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Hosts have 24 hours to respond. If there is no response, you can cancel for a full refund (if more than 7 days before check-in).
                            </AccordionContent>
                        </AccordionItem>

                        {/* Property Mismatch */}
                        <AccordionItem value="item-5" className="bg-card px-6 rounded-xl border border-border">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                Property doesn't match listing
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Take photos and raise a dispute immediately through the platform. An admin will review your case and determine a fair refund percentage based on the evidence.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
