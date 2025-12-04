import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const host = accounts.get("wallet_1")!;
const guest = accounts.get("wallet_2")!;
const guest2 = accounts.get("wallet_3")!;

describe("StackStay Reputation Contract", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Review Submission", () => {
    it("allows a user to submit a review", () => {
      const bookingId = 1;
      const rating = 5;
      const comment = "Great experience!";

      const { result } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [
          Cl.uint(bookingId),
          Cl.principal(host),
          Cl.uint(rating),
          Cl.stringUtf8(comment),
        ],
        guest
      );

      expect(result).toBeOk(Cl.uint(0)); // First review ID should be 0
    });

    it("stores review details correctly", () => {
      const bookingId = 1;
      const rating = 4;
      const comment = "Nice place";

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [
          Cl.uint(bookingId),
          Cl.principal(host),
          Cl.uint(rating),
          Cl.stringUtf8(comment),
        ],
        guest
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-review",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeSome(
        Cl.tuple({
          "booking-id": Cl.uint(bookingId),
          reviewer: Cl.principal(guest),
          reviewee: Cl.principal(host),
          rating: Cl.uint(rating),
          comment: Cl.stringUtf8(comment),
          "created-at": Cl.uint(simnet.blockHeight),
        })
      );
    });

    it("increments review ID for each new review", () => {
      // Submit first review
      const { result: result1 } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Great!")],
        guest
      );
      expect(result1).toBeOk(Cl.uint(0));

      // Submit second review
      const { result: result2 } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(2), Cl.principal(host), Cl.uint(4), Cl.stringUtf8("Good!")],
        guest2
      );
      expect(result2).toBeOk(Cl.uint(1));
    });

    it("rejects review with rating below minimum", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [
          Cl.uint(1),
          Cl.principal(host),
          Cl.uint(0), // Invalid: below MIN_RATING (1)
          Cl.stringUtf8("Bad"),
        ],
        guest
      );

      expect(result).toBeErr(Cl.uint(203)); // ERR-INVALID-RATING
    });

    it("rejects review with rating above maximum", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [
          Cl.uint(1),
          Cl.principal(host),
          Cl.uint(6), // Invalid: above MAX_RATING (5)
          Cl.stringUtf8("Amazing"),
        ],
        guest
      );

      expect(result).toBeErr(Cl.uint(203)); // ERR-INVALID-RATING
    });

    it("rejects self-review", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [
          Cl.uint(1),
          Cl.principal(guest), // Trying to review themselves
          Cl.uint(5),
          Cl.stringUtf8("I'm great!"),
        ],
        guest
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR-NOT-AUTHORIZED
    });

    it("rejects duplicate review for same booking", () => {
      const bookingId = 1;

      // Submit first review
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(bookingId), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Great!")],
        guest
      );

      // Try to submit second review for same booking
      const { result } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(bookingId), Cl.principal(host), Cl.uint(4), Cl.stringUtf8("Still great!")],
        guest
      );

      expect(result).toBeErr(Cl.uint(202)); // ERR-ALREADY-REVIEWED
    });
  });

  describe("User Statistics", () => {
    it("initializes user stats correctly after first review", () => {
      const rating = 5;

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(rating), Cl.stringUtf8("Great!")],
        guest
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-stats",
        [Cl.principal(host)],
        guest
      );

      expect(result).toBeSome(
        Cl.tuple({
          "total-reviews": Cl.uint(1),
          "total-rating-sum": Cl.uint(rating),
          "average-rating": Cl.uint(rating * 100), // 5.0 = 500
        })
      );
    });

    it("updates user stats correctly after multiple reviews", () => {
      // First review: 5 stars
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Excellent!")],
        guest
      );

      // Second review: 3 stars
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(2), Cl.principal(host), Cl.uint(3), Cl.stringUtf8("Okay")],
        guest2
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-stats",
        [Cl.principal(host)],
        guest
      );

      // Average: (5 + 3) / 2 = 4.0 = 400
      expect(result).toBeSome(
        Cl.tuple({
          "total-reviews": Cl.uint(2),
          "total-rating-sum": Cl.uint(8),
          "average-rating": Cl.uint(400), // 4.0 = 400
        })
      );
    });

    it("calculates average rating correctly with decimal precision", () => {
      // Reviews: 5, 4, 5 = Average 4.666... = 466
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Great!")],
        guest
      );

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(2), Cl.principal(host), Cl.uint(4), Cl.stringUtf8("Good")],
        guest2
      );

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(3), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Excellent!")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-stats",
        [Cl.principal(host)],
        guest
      );

      // (5 + 4 + 5) * 100 / 3 = 1400 / 3 = 466
      expect(result).toBeSome(
        Cl.tuple({
          "total-reviews": Cl.uint(3),
          "total-rating-sum": Cl.uint(14),
          "average-rating": Cl.uint(466),
        })
      );
    });

    it("returns none for user with no reviews", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-stats",
        [Cl.principal(guest2)],
        guest
      );

      expect(result).toBeNone();
    });

    it("tracks stats separately for different users", () => {
      // Review for host
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Great host!")],
        guest
      );

      // Review for guest2
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(2), Cl.principal(guest2), Cl.uint(3), Cl.stringUtf8("Okay guest")],
        host
      );

      // Check host stats
      const { result: hostStats } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-stats",
        [Cl.principal(host)],
        guest
      );

      expect(hostStats).toBeSome(
        Cl.tuple({
          "total-reviews": Cl.uint(1),
          "total-rating-sum": Cl.uint(5),
          "average-rating": Cl.uint(500),
        })
      );

      // Check guest2 stats
      const { result: guestStats } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-stats",
        [Cl.principal(guest2)],
        guest
      );

      expect(guestStats).toBeSome(
        Cl.tuple({
          "total-reviews": Cl.uint(1),
          "total-rating-sum": Cl.uint(3),
          "average-rating": Cl.uint(300),
        })
      );
    });
  });

  describe("Review Tracking", () => {
    it("correctly tracks if booking has been reviewed", () => {
      const bookingId = 1;

      // Before review
      const { result: beforeReview } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "has-reviewed",
        [Cl.uint(bookingId), Cl.principal(guest)],
        guest
      );
      expect(beforeReview).toBeBool(false);

      // Submit review
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(bookingId), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Great!")],
        guest
      );

      // After review
      const { result: afterReview } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "has-reviewed",
        [Cl.uint(bookingId), Cl.principal(guest)],
        guest
      );
      expect(afterReview).toBeBool(true);
    });

    it("tracks reviews separately for different reviewers on same booking", () => {
      const bookingId = 1;

      // Guest reviews
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(bookingId), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Great!")],
        guest
      );

      // Check guest has reviewed
      const { result: guestReviewed } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "has-reviewed",
        [Cl.uint(bookingId), Cl.principal(guest)],
        guest
      );
      expect(guestReviewed).toBeBool(true);

      // Check host hasn't reviewed
      const { result: hostReviewed } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "has-reviewed",
        [Cl.uint(bookingId), Cl.principal(host)],
        guest
      );
      expect(hostReviewed).toBeBool(false);
    });
  });

  describe("Average Rating Queries", () => {
    it("returns correct average rating for user", () => {
      // Submit reviews: 5, 4, 3 = Average 4.0
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Excellent!")],
        guest
      );

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(2), Cl.principal(host), Cl.uint(4), Cl.stringUtf8("Good")],
        guest2
      );

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(3), Cl.principal(host), Cl.uint(3), Cl.stringUtf8("Okay")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-average-rating",
        [Cl.principal(host)],
        guest
      );

      // (5 + 4 + 3) * 100 / 3 = 1200 / 3 = 400
      expect(result).toBeOk(Cl.uint(400));
    });

    it("returns 0 for user with no reviews", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-average-rating",
        [Cl.principal(guest2)],
        guest
      );

      expect(result).toBeOk(Cl.uint(0));
    });
  });

  describe("Review Count", () => {
    it("returns correct total review count", () => {
      // Initially 0
      const { result: initial } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-review-count",
        [],
        guest
      );
      expect(initial).toBeOk(Cl.uint(0));

      // Add 3 reviews
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Great!")],
        guest
      );

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(2), Cl.principal(host), Cl.uint(4), Cl.stringUtf8("Good")],
        guest2
      );

      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(3), Cl.principal(guest), Cl.uint(5), Cl.stringUtf8("Excellent!")],
        host
      );

      const { result: final } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-review-count",
        [],
        guest
      );
      expect(final).toBeOk(Cl.uint(3));
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum rating correctly", () => {
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8("Perfect!")],
        guest
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-average-rating",
        [Cl.principal(host)],
        guest
      );

      expect(result).toBeOk(Cl.uint(500)); // 5.0 = 500
    });

    it("handles minimum rating correctly", () => {
      simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(1), Cl.stringUtf8("Terrible")],
        guest
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-user-average-rating",
        [Cl.principal(host)],
        guest
      );

      expect(result).toBeOk(Cl.uint(100)); // 1.0 = 100
    });

    it("returns none for non-existent review", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-reputation",
        "get-review",
        [Cl.uint(999)],
        guest
      );

      expect(result).toBeNone();
    });

    it("handles long comments correctly", () => {
      const longComment = "A".repeat(500); // Max length

      const { result } = simnet.callPublicFn(
        "stackstay-reputation",
        "submit-review",
        [Cl.uint(1), Cl.principal(host), Cl.uint(5), Cl.stringUtf8(longComment)],
        guest
      );

      expect(result).toBeOk(Cl.uint(0));
    });
  });
});
