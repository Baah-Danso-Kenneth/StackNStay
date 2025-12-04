import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;

// Badge type constants
const BADGE_FIRST_BOOKING = 1;
const BADGE_FIRST_LISTING = 2;
const BADGE_SUPERHOST = 3;
const BADGE_FREQUENT_TRAVELER = 4;
const BADGE_EARLY_ADOPTER = 5;
const BADGE_PERFECT_HOST = 6;
const BADGE_GLOBE_TROTTER = 7;
const BADGE_TOP_EARNER = 8;

describe("StackStay Badge Contract", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Badge Minting", () => {
    it("allows contract owner to mint a badge", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [
          Cl.principal(user1),
          Cl.uint(BADGE_FIRST_BOOKING),
          Cl.stringAscii("ipfs://QmBadgeMetadata"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0)); // First badge ID should be 0
    });

    it("stores badge metadata correctly", () => {
      const badgeType = BADGE_FIRST_BOOKING;
      const metadataUri = "ipfs://QmFirstBooking";

      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [
          Cl.principal(user1),
          Cl.uint(badgeType),
          Cl.stringAscii(metadataUri),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-badge-metadata",
        [Cl.uint(0)],
        user1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "badge-type": Cl.uint(badgeType),
          owner: Cl.principal(user1),
          "earned-at": Cl.uint(simnet.blockHeight),
          "metadata-uri": Cl.stringAscii(metadataUri),
        })
      );
    });

    it("increments badge ID for each new badge", () => {
      // Mint first badge
      const { result: result1 } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );
      expect(result1).toBeOk(Cl.uint(0));

      // Mint second badge
      const { result: result2 } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user2), Cl.uint(BADGE_FIRST_LISTING), Cl.stringAscii("ipfs://2")],
        deployer
      );
      expect(result2).toBeOk(Cl.uint(1));
    });

    it("rejects minting by non-owner", () => {
      const { result } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [
          Cl.principal(user2),
          Cl.uint(BADGE_FIRST_BOOKING),
          Cl.stringAscii("ipfs://test"),
        ],
        user1 // Not the contract owner
      );

      expect(result).toBeErr(Cl.uint(400)); // ERR-NOT-AUTHORIZED
    });

    it("prevents duplicate badges for same user and type", () => {
      // Mint first badge
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );

      // Try to mint same badge type again
      const { result } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://2")],
        deployer
      );

      expect(result).toBeErr(Cl.uint(401)); // ERR-ALREADY-MINTED
    });

    it("allows same badge type for different users", () => {
      // Mint for user1
      const { result: result1 } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );
      expect(result1).toBeOk(Cl.uint(0));

      // Mint same type for user2
      const { result: result2 } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user2), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://2")],
        deployer
      );
      expect(result2).toBeOk(Cl.uint(1));
    });

    it("allows different badge types for same user", () => {
      // Mint first badge type
      const { result: result1 } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );
      expect(result1).toBeOk(Cl.uint(0));

      // Mint different badge type
      const { result: result2 } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_LISTING), Cl.stringAscii("ipfs://2")],
        deployer
      );
      expect(result2).toBeOk(Cl.uint(1));
    });
  });

  describe("Badge Ownership", () => {
    it("correctly tracks badge ownership", () => {
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-owner",
        [Cl.uint(0)],
        user1
      );

      expect(result).toBeOk(Cl.some(Cl.principal(user1)));
    });

    it("returns none for non-existent badge", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-owner",
        [Cl.uint(999)],
        user1
      );

      expect(result).toBeOk(Cl.none());
    });
  });

  describe("User Badge Queries", () => {
    it("correctly checks if user has a badge", () => {
      // Before minting
      const { result: before } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING)],
        user1
      );
      expect(before).toBeBool(false);

      // Mint badge
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );

      // After minting
      const { result: after } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING)],
        user1
      );
      expect(after).toBeBool(true);
    });

    it("returns correct user badge information", () => {
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_SUPERHOST), Cl.stringAscii("ipfs://superhost")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-user-badge",
        [Cl.principal(user1), Cl.uint(BADGE_SUPERHOST)],
        user1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "badge-id": Cl.uint(0),
          earned: Cl.bool(true),
        })
      );
    });

    it("returns none for badge user doesn't have", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-user-badge",
        [Cl.principal(user1), Cl.uint(BADGE_SUPERHOST)],
        user1
      );

      expect(result).toBeNone();
    });
  });

  describe("Badge Type Information", () => {
    it("returns correct badge type info for First Booking", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-badge-type-info",
        [Cl.uint(BADGE_FIRST_BOOKING)],
        user1
      );

      expect(result).toBeSome(
        Cl.tuple({
          name: Cl.stringAscii("First Booking"),
          description: Cl.stringAscii("Completed your first booking on StacksStay"),
          "image-uri": Cl.stringAscii("ipfs://QmFirstBooking..."),
          active: Cl.bool(true),
        })
      );
    });

    it("returns correct badge type info for Superhost", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-badge-type-info",
        [Cl.uint(BADGE_SUPERHOST)],
        user1
      );

      expect(result).toBeSome(
        Cl.tuple({
          name: Cl.stringAscii("Superhost"),
          description: Cl.stringAscii("Achieved 5-star rating with 10+ reviews"),
          "image-uri": Cl.stringAscii("ipfs://QmSuperhost..."),
          active: Cl.bool(true),
        })
      );
    });

    it("returns info for all 8 badge types", () => {
      const badgeTypes = [
        BADGE_FIRST_BOOKING,
        BADGE_FIRST_LISTING,
        BADGE_SUPERHOST,
        BADGE_FREQUENT_TRAVELER,
        BADGE_EARLY_ADOPTER,
        BADGE_PERFECT_HOST,
        BADGE_GLOBE_TROTTER,
        BADGE_TOP_EARNER,
      ];

      // Just verify all badge types return valid info
      badgeTypes.forEach((badgeType) => {
        const { result } = simnet.callReadOnlyFn(
          "stackstay-badge",
          "get-badge-type-info",
          [Cl.uint(badgeType)],
          user1
        );
        // Verify it's not none
        expect(result).not.toBeNone();
      });
    });
  });

  describe("NFT Functions", () => {
    it("returns correct token URI", () => {
      const metadataUri = "ipfs://QmCustomMetadata";

      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii(metadataUri)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-token-uri",
        [Cl.uint(0)],
        user1
      );

      expect(result).toBeOk(Cl.some(Cl.stringAscii(metadataUri)));
    });

    it("returns error for non-existent token URI", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-token-uri",
        [Cl.uint(999)],
        user1
      );

      // get-token-uri returns (ok (some ...)) on success
      // but (err (err u402)) on failure due to nested unwrap!
      expect(result).toBeErr(Cl.error(Cl.uint(402)));
    });

    it("returns correct total badge count", () => {
      // Initially 0
      const { result: initial } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-total-badges",
        [],
        user1
      );
      expect(initial).toBeOk(Cl.uint(0));

      // Mint 3 badges
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );

      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user2), Cl.uint(BADGE_FIRST_LISTING), Cl.stringAscii("ipfs://2")],
        deployer
      );

      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user3), Cl.uint(BADGE_SUPERHOST), Cl.stringAscii("ipfs://3")],
        deployer
      );

      const { result: final } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-total-badges",
        [],
        user1
      );
      expect(final).toBeOk(Cl.uint(3));
    });
  });

  describe("Multiple Badges Scenario", () => {
    it("allows user to earn multiple different badges", () => {
      // Mint 3 different badges for user1
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );

      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_LISTING), Cl.stringAscii("ipfs://2")],
        deployer
      );

      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_EARLY_ADOPTER), Cl.stringAscii("ipfs://3")],
        deployer
      );

      // Verify user has all 3 badges
      const { result: badge1 } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING)],
        user1
      );
      expect(badge1).toBeBool(true);

      const { result: badge2 } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_LISTING)],
        user1
      );
      expect(badge2).toBeBool(true);

      const { result: badge3 } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user1), Cl.uint(BADGE_EARLY_ADOPTER)],
        user1
      );
      expect(badge3).toBeBool(true);
    });

    it("tracks badges separately for different users", () => {
      // User1 gets First Booking
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );

      // User2 gets Superhost
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user2), Cl.uint(BADGE_SUPERHOST), Cl.stringAscii("ipfs://2")],
        deployer
      );

      // Verify user1 has First Booking but not Superhost
      const { result: user1HasFirstBooking } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING)],
        user1
      );
      expect(user1HasFirstBooking).toBeBool(true);

      const { result: user1HasSuperhost } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user1), Cl.uint(BADGE_SUPERHOST)],
        user1
      );
      expect(user1HasSuperhost).toBeBool(false);

      // Verify user2 has Superhost but not First Booking
      const { result: user2HasSuperhost } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user2), Cl.uint(BADGE_SUPERHOST)],
        user2
      );
      expect(user2HasSuperhost).toBeBool(true);

      const { result: user2HasFirstBooking } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "has-badge",
        [Cl.principal(user2), Cl.uint(BADGE_FIRST_BOOKING)],
        user2
      );
      expect(user2HasFirstBooking).toBeBool(false);
    });
  });

  describe("Edge Cases", () => {
    it("returns none for metadata of non-existent badge", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-badge-metadata",
        [Cl.uint(999)],
        user1
      );

      expect(result).toBeNone();
    });

    it("handles maximum length metadata URI", () => {
      const maxUri = "ipfs://" + "a".repeat(248); // 256 total

      const { result } = simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii(maxUri)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0));
    });

    it("correctly handles earned-at timestamp", () => {
      simnet.callPublicFn(
        "stackstay-badge",
        "mint-badge",
        [Cl.principal(user1), Cl.uint(BADGE_FIRST_BOOKING), Cl.stringAscii("ipfs://1")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stackstay-badge",
        "get-badge-metadata",
        [Cl.uint(0)],
        user1
      );

      // Just verify the metadata exists and has the correct structure
      expect(result).toBeSome(
        Cl.tuple({
          "badge-type": Cl.uint(BADGE_FIRST_BOOKING),
          owner: Cl.principal(user1),
          "earned-at": Cl.uint(simnet.blockHeight),
          "metadata-uri": Cl.stringAscii("ipfs://1"),
        })
      );
    });
  });
});
