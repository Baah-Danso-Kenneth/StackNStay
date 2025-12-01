;; StacksStay Disputes Contract
;; Handles dispute resolution for bookings

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-BOOKING-NOT-FOUND (err u301))
(define-constant ERR-DISPUTE-NOT-FOUND (err u302))
(define-constant ERR-DISPUTE-ALREADY-EXISTS (err u303))
(define-constant ERR-DISPUTE-ALREADY-RESOLVED (err u304))
(define-constant ERR-INVALID-REFUND (err u305))

;; Dispute status values
(define-constant STATUS-PENDING "pending")
(define-constant STATUS-RESOLVED "resolved")
(define-constant STATUS-REJECTED "rejected")


;; ============================================
;; DATA VARIABLES
;; ============================================
(define-data-var dispute-id-nonce uint u0)
(define-data-var contract-owner principal tx-sender)


;; ============================================
;; DATA MAPS
;; ============================================

;; Disputes map
(define-map disputes
  { dispute-id: uint }
  {
    booking-id: uint,
    raised-by: principal,
    reason: (string-utf8 500),
    evidence: (string-utf8 1000),
    status: (string-ascii 20),
    resolution: (string-utf8 500),
    refund-percentage: uint,
    created-at: uint,
    resolved-at: uint
  }
)

;; Track if booking already has a dispute (one dispute per booking)
(define-map booking-disputes
  { booking-id: uint }
  { dispute-id: uint, exists: bool }
)


;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Raise a dispute for a booking
(define-public (raise-dispute
    (booking-id uint)
    (reason (string-utf8 500))
    (evidence (string-utf8 1000))
  )
  (let
    (
      ;; Get booking from escrow contract
      (booking-response (unwrap! (contract-call? .stackstay-escrow get-booking booking-id) ERR-BOOKING-NOT-FOUND))
      (booking (unwrap! booking-response ERR-BOOKING-NOT-FOUND))
      
      ;; Extract booking details
      (guest (get guest booking))
      (host (get host booking))
      (booking-status (get status booking))
      
      ;; Get current dispute ID
      (dispute-id (var-get dispute-id-nonce))
    )
    
    ;; VALIDATIONS
    ;; 1. Caller must be guest or host
    (asserts! (or (is-eq tx-sender guest) (is-eq tx-sender host)) ERR-NOT-AUTHORIZED)
    
    ;; 2. Booking must be confirmed or completed (can't dispute cancelled bookings)
    (asserts! (or (is-eq booking-status "confirmed") (is-eq booking-status "completed")) ERR-NOT-AUTHORIZED)
    
    ;; 3. Booking must not already have a dispute
    (asserts! (is-none (map-get? booking-disputes { booking-id: booking-id })) ERR-DISPUTE-ALREADY-EXISTS)
    
    ;; STORE DISPUTE
    (map-set disputes
      { dispute-id: dispute-id }
      {
        booking-id: booking-id,
        raised-by: tx-sender,
        reason: reason,
        evidence: evidence,
        status: STATUS-PENDING,
        resolution: u"",
        refund-percentage: u0,
        created-at: stacks-block-height,
        resolved-at: u0
      }
    )
    
    ;; Mark booking as having a dispute
    (map-set booking-disputes
      { booking-id: booking-id }
      { dispute-id: dispute-id, exists: true }
    )
    
    ;; Increment dispute counter
    (var-set dispute-id-nonce (+ dispute-id u1))
    
    ;; Return success with dispute ID
    (ok dispute-id)
  )
)


;; Resolve a dispute (admin only)
(define-public (resolve-dispute
    (dispute-id uint)
    (resolution (string-utf8 500))
    (refund-percentage uint)
  )
  (let
    (
      ;; Fetch the dispute
      (dispute (unwrap! (map-get? disputes { dispute-id: dispute-id }) ERR-DISPUTE-NOT-FOUND))
      
      ;; Get dispute details
      (booking-id (get booking-id dispute))
      (current-status (get status dispute))
    )
    
    ;; VALIDATIONS
    ;; 1. Only contract owner can resolve
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    
    ;; 2. Dispute must be pending (can't resolve twice)
    (asserts! (is-eq current-status STATUS-PENDING) ERR-DISPUTE-ALREADY-RESOLVED)
    
    ;; 3. Refund percentage must be 0-100
    (asserts! (<= refund-percentage u100) ERR-INVALID-REFUND)
    
    ;; UPDATE DISPUTE
    (map-set disputes
      { dispute-id: dispute-id }
      (merge dispute {
        status: STATUS-RESOLVED,
        resolution: resolution,
        refund-percentage: refund-percentage,
        resolved-at: stacks-block-height
      })
    )
    
    ;; Return success
    (ok true)
  )
)


;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get dispute details
(define-read-only (get-dispute (dispute-id uint))
  (map-get? disputes { dispute-id: dispute-id })
)

;; Get dispute for a booking
(define-read-only (get-booking-dispute (booking-id uint))
  (map-get? booking-disputes { booking-id: booking-id })
)

;; Check if dispute is resolved
(define-read-only (is-dispute-resolved (dispute-id uint))
  (match (map-get? disputes { dispute-id: dispute-id })
    dispute (is-eq (get status dispute) STATUS-RESOLVED)
    false
  )
)

;; Get dispute status
(define-read-only (get-dispute-status (dispute-id uint))
  (match (map-get? disputes { dispute-id: dispute-id })
    dispute (ok (get status dispute))
    ERR-DISPUTE-NOT-FOUND
  )
)

;; Get total number of disputes
(define-read-only (get-dispute-count)
  (ok (var-get dispute-id-nonce))
)



