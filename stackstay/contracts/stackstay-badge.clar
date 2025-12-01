;; StacksStay Achievement Badges NFT
;; Non-fungible tokens for platform achievements

;; Define the NFT
(define-non-fungible-token stackstay-badge uint)

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u400))
(define-constant ERR-ALREADY-MINTED (err u401))
(define-constant ERR-NOT-FOUND (err u402))

;; Badge Types
(define-constant BADGE-FIRST-BOOKING u1)
(define-constant BADGE-FIRST-LISTING u2)
(define-constant BADGE-SUPERHOST u3)
(define-constant BADGE-FREQUENT-TRAVELER u4)
(define-constant BADGE-EARLY-ADOPTER u5)
(define-constant BADGE-PERFECT-HOST u6)
(define-constant BADGE-GLOBE-TROTTER u7)
(define-constant BADGE-TOP-EARNER u8)

;; ============================================
;; DATA VARIABLES
;; ============================================
(define-data-var badge-id-nonce uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; Badge metadata
(define-map badge-metadata
  { badge-id: uint }
  {
    badge-type: uint,
    owner: principal,
    earned-at: uint,
    metadata-uri: (string-ascii 256)
  }
)

;; Track which badges a user has earned (prevent duplicates)
(define-map user-badges
  { user: principal, badge-type: uint }
  { badge-id: uint, earned: bool }
)

;; Badge type definitions
(define-map badge-types
  { badge-type: uint }
  {
    name: (string-ascii 50),
    description: (string-ascii 200),
    image-uri: (string-ascii 256),
    active: bool
  }
)

;; ============================================
;; INITIALIZATION
;; ============================================

;; Initialize badge types (call once on deployment)
(define-private (init-badge-types)
  (begin
    (map-set badge-types
      { badge-type: BADGE-FIRST-BOOKING }
      {
        name: "First Booking",
        description: "Completed your first booking on StacksStay",
        image-uri: "ipfs://QmFirstBooking...",
        active: true
      }
    )
    (map-set badge-types
      { badge-type: BADGE-FIRST-LISTING }
      {
        name: "Property Pioneer",
        description: "Listed your first property on StacksStay",
        image-uri: "ipfs://QmFirstListing...",
        active: true
      }
    )
    (map-set badge-types
      { badge-type: BADGE-SUPERHOST }
      {
        name: "Superhost",
        description: "Achieved 5-star rating with 10+ reviews",
        image-uri: "ipfs://QmSuperhost...",
        active: true
      }
    )
    (map-set badge-types
      { badge-type: BADGE-FREQUENT-TRAVELER }
      {
        name: "Frequent Traveler",
        description: "Completed 10 bookings",
        image-uri: "ipfs://QmFrequentTraveler...",
        active: true
      }
    )
    (map-set badge-types
      { badge-type: BADGE-EARLY-ADOPTER }
      {
        name: "Early Adopter",
        description: "One of the first 1000 users",
        image-uri: "ipfs://QmEarlyAdopter...",
        active: true
      }
    )
    (map-set badge-types
      { badge-type: BADGE-PERFECT-HOST }
      {
        name: "Perfect Host",
        description: "20 completed bookings with zero cancellations",
        image-uri: "ipfs://QmPerfectHost...",
        active: true
      }
    )
    (map-set badge-types
      { badge-type: BADGE-GLOBE-TROTTER }
      {
        name: "Globe Trotter",
        description: "Stayed in properties across 5 different countries",
        image-uri: "ipfs://QmGlobeTrotter...",
        active: true
      }
    )
    (map-set badge-types
      { badge-type: BADGE-TOP-EARNER }
      {
        name: "Top Earner",
        description: "Top 10 host by revenue this month",
        image-uri: "ipfs://QmTopEarner...",
        active: true
      }
    )
  )
)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Mint achievement badge (only contract owner can call)
(define-public (mint-badge
    (recipient principal)
    (badge-type uint)
    (metadata-uri (string-ascii 256))
  )
  (let
    (
      (badge-id (var-get badge-id-nonce))
    )
    
    ;; Only contract owner or authorized minter can mint
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Check if user already has this badge type
    (asserts! (is-none (map-get? user-badges { user: recipient, badge-type: badge-type })) 
              ERR-ALREADY-MINTED)
    
    ;; Mint the NFT
    (try! (nft-mint? stackstay-badge badge-id recipient))
    
    ;; Store metadata
    (map-set badge-metadata
      { badge-id: badge-id }
      {
        badge-type: badge-type,
        owner: recipient,
        earned-at: stacks-block-height,
        metadata-uri: metadata-uri
      }
    )
    
    ;; Mark user as having this badge
    (map-set user-badges
      { user: recipient, badge-type: badge-type }
      { badge-id: badge-id, earned: true }
    )
    
    ;; Increment counter
    (var-set badge-id-nonce (+ badge-id u1))
    
    (ok badge-id)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get badge metadata
(define-read-only (get-badge-metadata (badge-id uint))
  (map-get? badge-metadata { badge-id: badge-id })
)

;; Check if user has a specific badge
(define-read-only (has-badge (user principal) (badge-type uint))
  (is-some (map-get? user-badges { user: user, badge-type: badge-type }))
)

;; Get badge ID for user's specific badge type
(define-read-only (get-user-badge (user principal) (badge-type uint))
  (map-get? user-badges { user: user, badge-type: badge-type })
)

;; Get badge type info
(define-read-only (get-badge-type-info (badge-type uint))
  (map-get? badge-types { badge-type: badge-type })
)

;; Get NFT owner
(define-read-only (get-owner (badge-id uint))
  (ok (nft-get-owner? stackstay-badge badge-id))
)

;; Get token URI (for NFT marketplaces)
(define-read-only (get-token-uri (badge-id uint))
  (ok (some (get metadata-uri (unwrap! (map-get? badge-metadata { badge-id: badge-id }) 
                                        (err ERR-NOT-FOUND)))))
)

;; Get total badges minted
(define-read-only (get-total-badges)
  (ok (var-get badge-id-nonce))
)

;; ============================================
;; INITIALIZATION (run on deploy)
;; ============================================
(init-badge-types)