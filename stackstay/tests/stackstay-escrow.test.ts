import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const host = accounts.get("wallet_1")!;
const guest = accounts.get("wallet_2")!;
const guest2 = accounts.get("wallet_3")!;

describe("StackStay Escrow Contract", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Property Listing", () => {
    it("allows a user to list a property", () => {
      const pricePerNight = 1000000; // 1 STX in microSTX
      const locationTag = 1;
      const metadataUri = "ipfs://QmTest123";

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [
          Cl.uint(pricePerNight),
          Cl.uint(locationTag),
          Cl.stringAscii(metadataUri),
        ],
        host
      );

      expect(result).toBeOk(Cl.uint(0)); // First property ID should be 0
    });

    it("rejects listing with zero price", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [
          Cl.uint(0), // Invalid price
          Cl.uint(1),
          Cl.stringAscii("ipfs://test"),
        ],
        host
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR-INVALID-AMOUNT
    });

    it("increments property ID for each new listing", () => {
      // List first property
      const { result: result1 } = simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [Cl.uint(1000000), Cl.uint(1), Cl.stringAscii("ipfs://test1")],
        host
      );
      expect(result1).toBeOk(Cl.uint(0));

      // List second property
      const { result: result2 } = simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [Cl.uint(2000000), Cl.uint(2), Cl.stringAscii("ipfs://test2")],
        host
      );
      expect(result2).toBeOk(Cl.uint(1));
    });

    it("stores property details correctly", () => {
      const pricePerNight = 1500000;
      const locationTag = 5;
      const metadataUri = "ipfs://QmPropertyMetadata";

      simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [
          Cl.uint(pricePerNight),
          Cl.uint(locationTag),
          Cl.stringAscii(metadataUri),
        ],
        host
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-escrow",
        "get-property",
        [Cl.uint(0)],
        host
      );

      expect(result).toBeSome(
        Cl.tuple({
          owner: Cl.principal(host),
          "price-per-night": Cl.uint(pricePerNight),
          "location-tag": Cl.uint(locationTag),
          "metadata-uri": Cl.stringAscii(metadataUri),
          active: Cl.bool(true),
          "created-at": Cl.uint(simnet.blockHeight),
        })
      );
    });
  });

  describe("Property Booking", () => {
    beforeEach(() => {
      // List a property before each booking test
      simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [Cl.uint(1000000), Cl.uint(1), Cl.stringAscii("ipfs://test")],
        host
      );
    });

    it("allows a guest to book a property", () => {
      const checkIn = 1000;
      const checkOut = 1005;
      const numNights = 5;

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [
          Cl.uint(0), // property-id
          Cl.uint(checkIn),
          Cl.uint(checkOut),
          Cl.uint(numNights),
        ],
        guest
      );

      expect(result).toBeOk(Cl.uint(0)); // First booking ID should be 0
    });

    it("calculates total amount with platform fee correctly", () => {
      const pricePerNight = 1000000; // 1 STX
      const numNights = 5;
      const baseCost = pricePerNight * numNights; // 5 STX
      const platformFee = (baseCost * 200) / 10000; // 2% = 0.1 STX
      const totalAmount = baseCost + platformFee; // 5.1 STX

      simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(0), Cl.uint(1000), Cl.uint(1005), Cl.uint(numNights)],
        guest
      );

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "get-booking",
        [Cl.uint(0)],
        guest
      );

      // Verify booking was created with correct amounts
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "property-id": Cl.uint(0),
        guest: Cl.principal(guest),
        host: Cl.principal(host),
        "check-in": Cl.uint(1000),
        "check-out": Cl.uint(1005),
        "total-amount": Cl.uint(totalAmount),
        "platform-fee": Cl.uint(platformFee),
        "host-payout": Cl.uint(baseCost),
        status: Cl.stringAscii("confirmed"),
        "created-at": Cl.uint(5), // Block height when booking was created
        "escrowed-amount": Cl.uint(totalAmount),
      })));
    });

    it("rejects booking if check-out is before check-in", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [
          Cl.uint(0),
          Cl.uint(1005), // check-in
          Cl.uint(1000), // check-out (before check-in)
          Cl.uint(5),
        ],
        guest
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR-INVALID-AMOUNT
    });

    it("rejects booking with zero nights", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(0), Cl.uint(1000), Cl.uint(1005), Cl.uint(0)],
        guest
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR-INVALID-AMOUNT
    });

    it("rejects host booking their own property", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(0), Cl.uint(1000), Cl.uint(1005), Cl.uint(5)],
        host // Host trying to book their own property
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("transfers STX from guest to contract on booking", () => {
      const guestBalanceBefore = simnet.getAssetsMap().get("STX")?.get(guest) || 0n;

      simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(0), Cl.uint(1000), Cl.uint(1005), Cl.uint(5)],
        guest
      );

      const guestBalanceAfter = simnet.getAssetsMap().get("STX")?.get(guest) || 0n;
      const totalAmount = 5100000n; // 5 STX + 2% fee

      expect(guestBalanceBefore - guestBalanceAfter).toBe(totalAmount);
    });
  });

  describe("Payment Release", () => {
    beforeEach(() => {
      // List property and create booking
      simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [Cl.uint(1000000), Cl.uint(1), Cl.stringAscii("ipfs://test")],
        host
      );

      simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(0), Cl.uint(100), Cl.uint(105), Cl.uint(5)],
        guest
      );
    });

    it("allows payment release after check-in time", () => {
      // Mine blocks to reach check-in time
      simnet.mineEmptyBlocks(100);

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "release-payment",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects payment release before check-in time", () => {
      // Don't mine blocks, stay before check-in
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "release-payment",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("transfers correct amounts to host and platform", () => {
      const hostBalanceBefore = simnet.getAssetsMap().get("STX")?.get(host) || 0n;
      const deployerBalanceBefore = simnet.getAssetsMap().get("STX")?.get(deployer) || 0n;

      simnet.mineEmptyBlocks(100);

      simnet.callPublicFn(
        "stackstay-escrow",
        "release-payment",
        [Cl.uint(0)],
        guest
      );

      const hostBalanceAfter = simnet.getAssetsMap().get("STX")?.get(host) || 0n;
      const deployerBalanceAfter = simnet.getAssetsMap().get("STX")?.get(deployer) || 0n;

      const hostPayout = 5000000n; // 5 STX
      const platformFee = 100000n; // 0.1 STX

      expect(hostBalanceAfter - hostBalanceBefore).toBe(hostPayout);
      expect(deployerBalanceAfter - deployerBalanceBefore).toBe(platformFee);
    });

    it("updates booking status to completed after release", () => {
      simnet.mineEmptyBlocks(100);

      simnet.callPublicFn(
        "stackstay-escrow",
        "release-payment",
        [Cl.uint(0)],
        guest
      );

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "get-booking",
        [Cl.uint(0)],
        guest
      );

      // Verify booking status is completed and escrow is empty
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "property-id": Cl.uint(0),
        guest: Cl.principal(guest),
        host: Cl.principal(host),
        "check-in": Cl.uint(100),
        "check-out": Cl.uint(105),
        "total-amount": Cl.uint(5100000),
        "platform-fee": Cl.uint(100000),
        "host-payout": Cl.uint(5000000),
        status: Cl.stringAscii("completed"),
        "created-at": Cl.uint(5), // Block height when booking was created
        "escrowed-amount": Cl.uint(0), // Should be 0 after release
      })));
    });

    it("rejects double payment release", () => {
      simnet.mineEmptyBlocks(100);

      // First release
      simnet.callPublicFn(
        "stackstay-escrow",
        "release-payment",
        [Cl.uint(0)],
        guest
      );

      // Try to release again
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "release-payment",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED (status not confirmed)
    });
  });

  describe("Booking Cancellation", () => {
    beforeEach(() => {
      // List property and create booking
      simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [Cl.uint(1000000), Cl.uint(1), Cl.stringAscii("ipfs://test")],
        host
      );

      simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(0), Cl.uint(2000), Cl.uint(2005), Cl.uint(5)],
        guest
      );
    });

    it("allows guest to cancel booking", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeOk(Cl.uint(5100000)); // Full refund (100%)
    });

    it("allows host to cancel booking", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        host
      );

      expect(result).toBeOk(Cl.uint(5100000)); // Full refund
    });

    it("gives 100% refund when cancelling >7 days before check-in", () => {
      // Check-in is at block 2000, we're at block ~5
      // That's >1008 blocks away (7 days)
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeOk(Cl.uint(5100000)); // 100% refund
    });

    it("gives 50% refund when cancelling 3-7 days before check-in", () => {
      // Mine blocks to be within 432-1008 blocks of check-in
      simnet.mineEmptyBlocks(1500); // Now at ~1505, check-in at 2000 (495 blocks away)

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeOk(Cl.uint(2550000)); // 50% refund
    });

    it("gives 0% refund when cancelling <3 days before check-in", () => {
      // Mine blocks to be within 432 blocks of check-in
      simnet.mineEmptyBlocks(1700); // Now at ~1705, check-in at 2000 (295 blocks away)

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeOk(Cl.uint(0)); // 0% refund
    });

    it("rejects cancellation after check-in time", () => {
      simnet.mineEmptyBlocks(2000); // Past check-in

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        guest
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("rejects cancellation by unauthorized user", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        guest2 // Not guest or host
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("updates booking status to cancelled", () => {
      simnet.callPublicFn(
        "stackstay-escrow",
        "cancel-booking",
        [Cl.uint(0)],
        guest
      );

      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "get-booking",
        [Cl.uint(0)],
        guest
      );

      // Verify booking status is cancelled
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "property-id": Cl.uint(0),
        guest: Cl.principal(guest),
        host: Cl.principal(host),
        "check-in": Cl.uint(2000),
        "check-out": Cl.uint(2005),
        "total-amount": Cl.uint(5100000),
        "platform-fee": Cl.uint(100000),
        "host-payout": Cl.uint(5000000),
        status: Cl.stringAscii("cancelled"),
        "created-at": Cl.uint(5), // Block height when booking was created
        "escrowed-amount": Cl.uint(0),
      })));
    });
  });

  describe("Edge Cases", () => {
    it("handles multiple bookings for different properties", () => {
      // List two properties
      simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [Cl.uint(1000000), Cl.uint(1), Cl.stringAscii("ipfs://prop1")],
        host
      );

      simnet.callPublicFn(
        "stackstay-escrow",
        "list-property",
        [Cl.uint(2000000), Cl.uint(2), Cl.stringAscii("ipfs://prop2")],
        host
      );

      // Book both properties
      const { result: booking1 } = simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(0), Cl.uint(100), Cl.uint(105), Cl.uint(5)],
        guest
      );

      const { result: booking2 } = simnet.callPublicFn(
        "stackstay-escrow",
        "book-property",
        [Cl.uint(1), Cl.uint(200), Cl.uint(205), Cl.uint(5)],
        guest2
      );

      expect(booking1).toBeOk(Cl.uint(0));
      expect(booking2).toBeOk(Cl.uint(1));
    });

    it("returns none for non-existent property", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-escrow",
        "get-property",
        [Cl.uint(999)],
        guest
      );

      expect(result).toBeNone();
    });

    it("returns none for non-existent booking", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-escrow",
        "get-booking",
        [Cl.uint(999)],
        guest
      );

      expect(result).toBeOk(Cl.none());
    });
  });
});
