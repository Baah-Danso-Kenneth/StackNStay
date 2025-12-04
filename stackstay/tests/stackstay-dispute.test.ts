import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const host = accounts.get("wallet_1")!;
const guest = accounts.get("wallet_2")!;
const guest2 = accounts.get("wallet_3")!;

describe("StackStay Dispute Contract", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  // Helper function to create a booking
  const createBooking = (propertyOwner: string, bookingGuest: string) => {
    // List a property
    simnet.callPublicFn(
      "stackstay-escrow",
      "list-property",
      [Cl.uint(1000000), Cl.uint(1), Cl.stringAscii("ipfs://test")],
      propertyOwner
    );

    // Book the property
    const { result } = simnet.callPublicFn(
      "stackstay-escrow",
      "book-property",
      [Cl.uint(0), Cl.uint(1000), Cl.uint(1005), Cl.uint(5)],
      bookingGuest
    );

    return result;
  };

  describe("Raising Disputes", () => {
    it("allows guest to raise a dispute", () => {
      createBooking(host, guest);

      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [
          Cl.uint(0), // booking-id
          Cl.stringUtf8("Property not as described"),
          Cl.stringUtf8("Photos show different furniture"),
        ],
        guest
      );

      expect(result).toBeOk(Cl.uint(0)); // First dispute ID should be 0
    });

    it("allows host to raise a dispute", () => {
      createBooking(host, guest);

      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [
          Cl.uint(0),
          Cl.stringUtf8("Guest caused damage"),
          Cl.stringUtf8("Broken furniture and stains"),
        ],
        host
      );

      expect(result).toBeOk(Cl.uint(0));
    });

    it("stores dispute details correctly", () => {
      createBooking(host, guest);

      const reason = "Cleanliness issues";
      const evidence = "Photos of dirty rooms";

      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8(reason), Cl.stringUtf8(evidence)],
        guest
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeSome(
        Cl.tuple({
          "booking-id": Cl.uint(0),
          "raised-by": Cl.principal(guest),
          reason: Cl.stringUtf8(reason),
          evidence: Cl.stringUtf8(evidence),
          status: Cl.stringAscii("pending"),
          resolution: Cl.stringUtf8(""),
          "refund-percentage": Cl.uint(0),
          "created-at": Cl.uint(simnet.blockHeight),
          "resolved-at": Cl.uint(0),
        })
      );
    });

    it("increments dispute ID for each new dispute", () => {
      // Create two bookings
      createBooking(host, guest);
      createBooking(host, guest2);

      // Raise first dispute
      const { result: result1 } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Issue 1"), Cl.stringUtf8("Evidence 1")],
        guest
      );
      expect(result1).toBeOk(Cl.uint(0));

      // Raise second dispute
      const { result: result2 } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(1), Cl.stringUtf8("Issue 2"), Cl.stringUtf8("Evidence 2")],
        guest2
      );
      expect(result2).toBeOk(Cl.uint(1));
    });

    it("rejects dispute from unauthorized user", () => {
      createBooking(host, guest);

      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [
          Cl.uint(0),
          Cl.stringUtf8("Unauthorized dispute"),
          Cl.stringUtf8("Should fail"),
        ],
        guest2 // Not guest or host
      );

      expect(result).toBeErr(Cl.uint(300)); // ERR-NOT-AUTHORIZED
    });

    it("rejects duplicate dispute for same booking", () => {
      createBooking(host, guest);

      // Raise first dispute
      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("First issue"), Cl.stringUtf8("Evidence")],
        guest
      );

      // Try to raise second dispute for same booking
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Second issue"), Cl.stringUtf8("More evidence")],
        host
      );

      expect(result).toBeErr(Cl.uint(303)); // ERR-DISPUTE-ALREADY-EXISTS
    });

    it("rejects dispute for non-existent booking", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(999), Cl.stringUtf8("Issue"), Cl.stringUtf8("Evidence")],
        guest
      );

      expect(result).toBeErr(Cl.uint(301)); // ERR-BOOKING-NOT-FOUND
    });
  });

  describe("Dispute Resolution", () => {
    beforeEach(() => {
      // Create booking and raise dispute
      createBooking(host, guest);
      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Issue"), Cl.stringUtf8("Evidence")],
        guest
      );
    });

    it("allows contract owner to resolve dispute", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [
          Cl.uint(0),
          Cl.stringUtf8("Resolved in favor of guest"),
          Cl.uint(50), // 50% refund
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("updates dispute status to resolved", () => {
      simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("Resolved"), Cl.uint(100)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute-status",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeOk(Cl.stringAscii("resolved"));
    });

    it("stores resolution details correctly", () => {
      const resolution = "Guest receives full refund";
      const refundPercentage = 100;

      simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8(resolution), Cl.uint(refundPercentage)],
        deployer
      );

      // Verify status changed to resolved
      const { result: statusResult } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute-status",
        [Cl.uint(0)],
        guest
      );
      expect(statusResult).toBeOk(Cl.stringAscii("resolved"));

      // Verify dispute is marked as resolved
      const { result: isResolved } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "is-dispute-resolved",
        [Cl.uint(0)],
        guest
      );
      expect(isResolved).toBeBool(true);
    });

    it("rejects resolution by non-owner", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("Unauthorized resolution"), Cl.uint(50)],
        guest // Not contract owner
      );

      expect(result).toBeErr(Cl.uint(300)); // ERR-NOT-AUTHORIZED
    });

    it("rejects resolution of already resolved dispute", () => {
      // Resolve once
      simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("First resolution"), Cl.uint(50)],
        deployer
      );

      // Try to resolve again
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("Second resolution"), Cl.uint(100)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(304)); // ERR-DISPUTE-ALREADY-RESOLVED
    });

    it("rejects invalid refund percentage (>100)", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("Invalid refund"), Cl.uint(150)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(305)); // ERR-INVALID-REFUND
    });

    it("accepts 0% refund", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("No refund warranted"), Cl.uint(0)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("accepts 100% refund", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("Full refund"), Cl.uint(100)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects resolution of non-existent dispute", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(999), Cl.stringUtf8("Resolution"), Cl.uint(50)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(302)); // ERR-DISPUTE-NOT-FOUND
    });
  });

  describe("Dispute Queries", () => {
    it("returns correct booking dispute information", () => {
      createBooking(host, guest);

      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Issue"), Cl.stringUtf8("Evidence")],
        guest
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-booking-dispute",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeSome(
        Cl.tuple({
          "dispute-id": Cl.uint(0),
          exists: Cl.bool(true),
        })
      );
    });

    it("returns none for booking without dispute", () => {
      createBooking(host, guest);

      const { result } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-booking-dispute",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeNone();
    });

    it("correctly checks if dispute is resolved", () => {
      createBooking(host, guest);

      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Issue"), Cl.stringUtf8("Evidence")],
        guest
      );

      // Before resolution
      const { result: before } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "is-dispute-resolved",
        [Cl.uint(0)],
        guest
      );
      expect(before).toBeBool(false);

      // Resolve dispute
      simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8("Resolved"), Cl.uint(50)],
        deployer
      );

      // After resolution
      const { result: after } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "is-dispute-resolved",
        [Cl.uint(0)],
        guest
      );
      expect(after).toBeBool(true);
    });

    it("returns false for non-existent dispute resolution check", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "is-dispute-resolved",
        [Cl.uint(999)],
        guest
      );

      expect(result).toBeBool(false);
    });

    it("returns correct dispute count", () => {
      // Initially 0
      const { result: initial } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute-count",
        [],
        guest
      );
      expect(initial).toBeOk(Cl.uint(0));

      // Create bookings and raise disputes
      createBooking(host, guest);
      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Issue 1"), Cl.stringUtf8("Evidence 1")],
        guest
      );

      createBooking(host, guest2);
      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(1), Cl.stringUtf8("Issue 2"), Cl.stringUtf8("Evidence 2")],
        guest2
      );

      const { result: final } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute-count",
        [],
        guest
      );
      expect(final).toBeOk(Cl.uint(2));
    });

    it("returns none for non-existent dispute", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute",
        [Cl.uint(999)],
        guest
      );

      expect(result).toBeNone();
    });

    it("returns error for status of non-existent dispute", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute-status",
        [Cl.uint(999)],
        guest
      );

      expect(result).toBeErr(Cl.uint(302)); // ERR-DISPUTE-NOT-FOUND
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum length reason and evidence", () => {
      createBooking(host, guest);

      const maxReason = "A".repeat(500);
      const maxEvidence = "B".repeat(1000);

      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8(maxReason), Cl.stringUtf8(maxEvidence)],
        guest
      );

      expect(result).toBeOk(Cl.uint(0));
    });

    it("handles maximum length resolution", () => {
      createBooking(host, guest);

      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Issue"), Cl.stringUtf8("Evidence")],
        guest
      );

      const maxResolution = "C".repeat(500);

      const { result } = simnet.callPublicFn(
        "stackstay-dispute",
        "resolve-dispute",
        [Cl.uint(0), Cl.stringUtf8(maxResolution), Cl.uint(50)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("tracks multiple disputes for different bookings", () => {
      // Create 3 bookings
      createBooking(host, guest);
      createBooking(host, guest2);
      createBooking(host, guest);

      // Raise disputes for all
      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(0), Cl.stringUtf8("Issue 1"), Cl.stringUtf8("Evidence 1")],
        guest
      );

      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(1), Cl.stringUtf8("Issue 2"), Cl.stringUtf8("Evidence 2")],
        guest2
      );

      simnet.callPublicFn(
        "stackstay-dispute",
        "raise-dispute",
        [Cl.uint(2), Cl.stringUtf8("Issue 3"), Cl.stringUtf8("Evidence 3")],
        guest
      );

      // Verify all disputes exist
      const { result: count } = simnet.callReadOnlyFn(
        "stackstay-dispute",
        "get-dispute-count",
        [],
        guest
      );
      expect(count).toBeOk(Cl.uint(3));
    });
  });
});
