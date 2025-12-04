import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { useReputation } from "@/hooks/use-reputation";

interface ReviewModalProps {
    bookingId: number;
    reviewee: string;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function ReviewModal({ bookingId, reviewee, trigger, onSuccess }: ReviewModalProps) {
    const { submitReview, isSubmitting } = useReputation();
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);

    const handleSubmit = async () => {
        if (!comment.trim()) return;

        await submitReview(bookingId, reviewee, rating, comment);
        setIsOpen(false);
        setComment("");
        setRating(5);
        onSuccess?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Write a Review</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rate your experience</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(null)}
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoveredRating ?? rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground/30"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            {hoveredRating ?? rating} out of 5 stars
                        </span>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !comment.trim()}
                        className="w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Review"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
