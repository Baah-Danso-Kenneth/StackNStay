;; StacksStay Escrow Contract
;; Handles property listings, bookings, and payment escrow

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-PROPERTY-NOT-FOUND (err u101))
(define-constant ERR-ALREADY-EXISTS (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-NOT-AVAILABLE (err u104))
(define-constant ERR-BOOKING-NOT-FOUND (err u105))

(define-constant PLATFORM-FEE-BPS u200)
(define-constant BPS-DENOMINATOR u10000)

;; ============================================
;; DATA MAPS
;; ============================================
(define-map properties
  { property-id: uint }
  {
    owner: principal,
    price-per-night: uint,
    location-tag: uint,
    metadata-uri: (string-ascii 256),
    active: bool,
    created-at: uint
  }
)

(define-map bookings
  { booking-id: uint }
  {
    property-id: uint,
    guest: principal,
    host: principal,
    check-in: uint,
    check-out: uint,
    total-amount: uint,
    platform-fee: uint,
    host-payout: uint,
    status: (string-ascii 20),
    created-at: uint,
    escrowed-amount: uint
  }
)

;; ============================================
;; DATA VARIABLES
;; ============================================
(define-data-var property-id-nonce uint u0)
(define-data-var booking-id-nonce uint u0)
(define-data-var contract-owner principal tx-sender)
(define-data-var dispute-contract principal tx-sender) ;; Initially owner, updated later

;; ============================================
;; PUBLIC FUNCTIONS (Anyone can call these)
;; ============================================

;; Set the dispute contract address (Admin only)
(define-public (set-dispute-contract (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (var-set dispute-contract address)
    (ok true)
  )
)

;; List a new property
(define-public (list-property
    (price-per-night uint)
    (location-tag uint)
    (metadata-uri (string-ascii 256))
  )
  (let
    (
      ;; Get current property ID and increment for next time
      (property-id (var-get property-id-nonce))
    )
    
    ;; Validation: price must be greater than 0
    (asserts! (> price-per-night u0) ERR-INVALID-AMOUNT)
    
    ;; Store the property in our map
    (map-set properties
      { property-id: property-id }
      {
        owner: tx-sender,
        price-per-night: price-per-night,
        location-tag: location-tag,
        metadata-uri: metadata-uri,
        active: true,
        created-at: stacks-block-height
      }
    )
    
    ;; Increment the property counter for next listing
    (var-set property-id-nonce (+ property-id u1))

    ;; Try to mint First Listing badge (type u2)
    ;; We ignore errors (e.g. if already minted) so we don't block the listing
    (match (contract-call? .stackstay-badge mint-badge tx-sender u2 "ipfs://QmFirstListing...")
      success true
      error false
    )
    
    ;; Return success with the property ID
    (ok property-id)
  )
)


;; Get property details
(define-read-only (get-property (property-id uint))
  (map-get? properties { property-id: property-id })
)


;; Get booking details
(define-public (get-booking (booking-id uint))
  (ok (map-get? bookings { booking-id: booking-id }))
)



;; Book a property
(define-public (book-property
    (property-id uint)
    (check-in uint)
    (check-out uint)
    (num-nights uint)
  )
  (let
    (
      ;; Fetch the property details
      (property (unwrap! (map-get? properties { property-id: property-id }) ERR-PROPERTY-NOT-FOUND))
      
      ;; Get current booking ID and increment
      (booking-id (var-get booking-id-nonce))
      
      ;; Calculate total cost
      (base-cost (* (get price-per-night property) num-nights))
      (platform-fee (/ (* base-cost PLATFORM-FEE-BPS) BPS-DENOMINATOR))
      (total-amount (+ base-cost platform-fee))
      (host-payout base-cost)  ;; Host gets base cost, we keep fee
      
      ;; Get the property owner
      (property-owner (get owner property))
    )
    
    ;; VALIDATIONS
    ;; 1. Property must be active
    (asserts! (get active property) ERR-NOT-AVAILABLE)
    
    ;; 2. Check-out must be after check-in
    (asserts! (> check-out check-in) ERR-INVALID-AMOUNT)
    
    ;; 3. Number of nights must be greater than 0
    (asserts! (> num-nights u0) ERR-INVALID-AMOUNT)
    
    ;; 4. Guest can't book their own property
    (asserts! (not (is-eq tx-sender property-owner)) ERR-NOT-AUTHORIZED)
    
    ;; PAYMENT: Transfer STX from guest to contract (ESCROW)
    (try! (stx-transfer? total-amount tx-sender (as-contract tx-sender)))
    
    ;; STORE BOOKING
    (map-set bookings
      { booking-id: booking-id }
      {
        property-id: property-id,
        guest: tx-sender,
        host: property-owner,
        check-in: check-in,
        check-out: check-out,
        total-amount: total-amount,
        platform-fee: platform-fee,
        host-payout: host-payout,
        status: "confirmed",
        created-at: stacks-block-height,
        escrowed-amount: total-amount
      }
    )
    
    ;; Increment booking counter
    (var-set booking-id-nonce (+ booking-id u1))
    
    ;; Return success with booking ID
    (ok booking-id)
  )
)


;; Release payment to host after check-in
(define-public (release-payment (booking-id uint))
  (let
    (
      ;; Fetch the booking
      (booking (unwrap! (map-get? bookings { booking-id: booking-id }) ERR-BOOKING-NOT-FOUND))
      
      ;; Extract key values
      (guest (get guest booking))
      (host (get host booking))
      (check-in-block (get check-in booking))
      (total-amount (get total-amount booking))
      (platform-fee (get platform-fee booking))
      (host-payout (get host-payout booking))
      (escrowed-amount (get escrowed-amount booking))
      (current-status (get status booking))
    )
    
    ;; VALIDATIONS
    ;; 1. Booking must be in "confirmed" status
    (asserts! (is-eq current-status "confirmed") ERR-NOT-AUTHORIZED)
    
    ;; 2. Check-in time must have passed
    (asserts! (>= stacks-block-height check-in-block) ERR-NOT-AUTHORIZED)
    
    ;; 3. Must have funds in escrow
    (asserts! (> escrowed-amount u0) ERR-INVALID-AMOUNT)
    
    ;; TRANSFER FUNDS
    ;; Pay the host (from contract wallet)
    (try! (as-contract (stx-transfer? host-payout tx-sender host)))
    
    ;; Pay platform fee (from contract wallet to contract owner)
    (try! (as-contract (stx-transfer? platform-fee tx-sender (var-get contract-owner))))
    
    ;; UPDATE BOOKING STATUS
    (map-set bookings
      { booking-id: booking-id }
      (merge booking {
        status: "completed",
        escrowed-amount: u0
      })
    )
    
    ;; Return success
    (ok true)
  )
)

;; Flag a booking as disputed (Callable only by dispute contract)
(define-public (flag-dispute (booking-id uint))
  (let
    (
      (booking (unwrap! (map-get? bookings { booking-id: booking-id }) ERR-BOOKING-NOT-FOUND))
    )
    ;; Only authorized dispute contract can call this
    (asserts! (is-eq tx-sender (var-get dispute-contract)) ERR-NOT-AUTHORIZED)
    
    ;; Update status to "disputed"
    (map-set bookings
      { booking-id: booking-id }
      (merge booking { status: "disputed" })
    )
    (ok true)
  )
)

;; Resolve a dispute and transfer funds (Callable only by dispute contract)
(define-public (resolve-dispute-transfer (booking-id uint) (guest-refund uint) (host-amount uint))
  (let
    (
      (booking (unwrap! (map-get? bookings { booking-id: booking-id }) ERR-BOOKING-NOT-FOUND))
      (guest (get guest booking))
      (host (get host booking))
      (escrowed-amount (get escrowed-amount booking))
      (platform-fee (get platform-fee booking))
    )
    ;; Only authorized dispute contract can call this
    (asserts! (is-eq tx-sender (var-get dispute-contract)) ERR-NOT-AUTHORIZED)
    
    ;; Ensure we have enough funds
    (asserts! (<= (+ guest-refund host-amount) escrowed-amount) ERR-INVALID-AMOUNT)
    
    ;; Transfer refunds/payouts
    (if (> guest-refund u0)
      (try! (as-contract (stx-transfer? guest-refund tx-sender guest)))
      true
    )
    
    (if (> host-amount u0)
      (try! (as-contract (stx-transfer? host-amount tx-sender host)))
      true
    )
    
    ;; Platform fee is kept by the contract (or could be refunded/split, but keeping simple for now)
    ;; If host gets paid, platform usually keeps fee. If full refund, maybe platform refunds fee?
    ;; For now, let's assume platform fee stays in contract if not explicitly handled, 
    ;; or we can send it to owner. Let's send to owner to be safe/clean.
    (if (> platform-fee u0)
        (try! (as-contract (stx-transfer? platform-fee tx-sender (var-get contract-owner))))
        true
    )

    ;; Update status to "resolved"
    (map-set bookings
      { booking-id: booking-id }
      (merge booking { 
        status: "resolved",
        escrowed-amount: u0 
      })
    )
    (ok true)
  )
)


;; Check if payment can be released
(define-read-only (can-release-payment (booking-id uint))
  (match (map-get? bookings { booking-id: booking-id })
    booking
      (and
        (is-eq (get status booking) "confirmed")
        (>= stacks-block-height (get check-in booking))
        (> (get escrowed-amount booking) u0)
      )
    false
  )
)



;; Cancel a booking and process refund
(define-public (cancel-booking (booking-id uint))
  (let
    (
      ;; Fetch the booking
      (booking (unwrap! (map-get? bookings { booking-id: booking-id }) ERR-BOOKING-NOT-FOUND))
      
      ;; Extract key values
      (guest (get guest booking))
      (host (get host booking))
      (check-in-block (get check-in booking))
      (total-amount (get total-amount booking))
      (escrowed-amount (get escrowed-amount booking))
      (current-status (get status booking))
      
      ;; Calculate blocks until check-in
      (blocks-until-checkin (if (>= check-in-block stacks-block-height)
                               (- check-in-block stacks-block-height)
                               u0))
      
      ;; Determine refund percentage based on timing
      ;; More than 1008 blocks (7 days): 100% refund
      ;; 432-1008 blocks (3-7 days): 50% refund
      ;; Less than 432 blocks (3 days): 0% refund
      (refund-percentage (if (>= blocks-until-checkin u1008)
                            u100
                            (if (>= blocks-until-checkin u432)
                               u50
                               u0)))
      
      ;; Calculate actual refund amount
      (refund-amount (/ (* escrowed-amount refund-percentage) u100))
    )
    
    ;; VALIDATIONS
    ;; 1. Only guest or host can cancel
    (asserts! (or (is-eq tx-sender guest) (is-eq tx-sender host)) ERR-NOT-AUTHORIZED)
    
    ;; 2. Booking must be in "confirmed" status
    (asserts! (is-eq current-status "confirmed") ERR-NOT-AUTHORIZED)
    
    ;; 3. Cannot cancel after check-in has passed
    (asserts! (< stacks-block-height check-in-block) ERR-NOT-AUTHORIZED)
    
    ;; 4. Must have funds in escrow to refund
    (asserts! (> escrowed-amount u0) ERR-INVALID-AMOUNT)
    
    ;; PROCESS REFUND
    ;; If there's a refund amount, send it back to guest
    (if (> refund-amount u0)
      (try! (as-contract (stx-transfer? refund-amount tx-sender guest)))
      true
    )
    
    ;; If host keeps some amount (partial refund), send it to host
    (let
      (
        (host-compensation (- escrowed-amount refund-amount))
      )
      (if (> host-compensation u0)
        (try! (as-contract (stx-transfer? host-compensation tx-sender host)))
        true
      )
    )
    
    ;; UPDATE BOOKING STATUS
    (map-set bookings
      { booking-id: booking-id }
      (merge booking {
        status: "cancelled",
        escrowed-amount: u0
      })
    )
    
    ;; Return success with refund amount
    (ok refund-amount)
  )
)


