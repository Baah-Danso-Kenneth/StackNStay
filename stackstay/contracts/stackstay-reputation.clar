;; StacksStay Reputation Contract
;; Handles reviews and ratings

;; (use-trait escrow-trait .traits.escrow-trait)

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-BOOKING-NOT-FOUND (err u201))
(define-constant ERR-ALREADY-REVIEWED (err u202))
(define-constant ERR-INVALID-RATING (err u203))
(define-constant ERR-BOOKING-NOT-COMPLETED (err u204))
(define-constant ERR-REVIEW-NOT-FOUND (err u205))

;; Rating bounds
(define-constant MIN-RATING u1)
(define-constant MAX-RATING u5)

;; Contract owner
(define-constant CONTRACT-OWNER tx-sender)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Review ID counter
(define-data-var review-id-nonce uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; Reviews map
(define-map reviews
  { review-id: uint }
  {
    booking-id: uint,
    reviewer: principal,
    reviewee: principal,
    rating: uint,
    comment: (string-utf8 500),
    created-at: uint
  }
)

;; User statistics map
(define-map user-stats
  { user: principal }
  {
    total-reviews: uint,
    total-rating-sum: uint,
    average-rating: uint  ;; Stored as rating * 100 (e.g., 4.5 = 450)
  }
)

;; Track if booking already has reviews (prevent duplicate reviews)
(define-map booking-reviewed
  { booking-id: uint, reviewer: principal }
  { reviewed: bool }
)

;; ============================================
;; PRIVATE FUNCTIONS
;; ============================================

;; Update user statistics after receiving a review
(define-private (update-user-stats (user principal) (rating uint))
  (let
    (
      (current-stats (default-to 
        { total-reviews: u0, total-rating-sum: u0, average-rating: u0 }
        (map-get? user-stats { user: user })
      ))
      (new-total-reviews (+ (get total-reviews current-stats) u1))
      (new-rating-sum (+ (get total-rating-sum current-stats) rating))
      ;; Calculate average rating * 100 to preserve decimals
      (new-average (/ (* new-rating-sum u100) new-total-reviews))
    )
    (map-set user-stats
      { user: user }
      {
        total-reviews: new-total-reviews,
        total-rating-sum: new-rating-sum,
        average-rating: new-average
      }
    )
  )
)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

(define-public (submit-review
    (booking-id uint)
    (reviewee principal)
    (rating uint)
    (comment (string-utf8 500))
  )
  (let
    (
      (review-id (var-get review-id-nonce))
    )
    
    ;; VALIDATIONS
    ;; 1. Can't review yourself
    (asserts! (not (is-eq tx-sender reviewee)) ERR-NOT-AUTHORIZED)
    
    ;; 2. Rating must be between 1-5
    (asserts! (and (>= rating MIN-RATING) (<= rating MAX-RATING)) ERR-INVALID-RATING)
    
    ;; 3. Can't review same booking twice
    (asserts! (is-none (map-get? booking-reviewed { booking-id: booking-id, reviewer: tx-sender })) ERR-ALREADY-REVIEWED)

    ;; 4. Verify Booking with Escrow Contract
    (let
      (
        (booking-response (unwrap! (contract-call? .stackstay-escrow get-booking booking-id) ERR-BOOKING-NOT-FOUND))
        (booking (unwrap! booking-response ERR-BOOKING-NOT-FOUND))
        (guest (get guest booking))
        (host (get host booking))
        (status (get status booking))
      )
      ;; Must be completed
      (asserts! (is-eq status "completed") ERR-BOOKING-NOT-COMPLETED)
      
      ;; Sender must be guest or host
      (asserts! (or (is-eq tx-sender guest) (is-eq tx-sender host)) ERR-NOT-AUTHORIZED)
      
      ;; Reviewee must be the OTHER party
      (if (is-eq tx-sender guest)
          (asserts! (is-eq reviewee host) ERR-NOT-AUTHORIZED)
          (asserts! (is-eq reviewee guest) ERR-NOT-AUTHORIZED)
      )
    )
    
    ;; STORE THE REVIEW
    (map-set reviews
      { review-id: review-id }
      {
        booking-id: booking-id,
        reviewer: tx-sender,
        reviewee: reviewee,
        rating: rating,
        comment: comment,
        created-at: stacks-block-height
      }
    )
    
    ;; Mark as reviewed
    (map-set booking-reviewed
      { booking-id: booking-id, reviewer: tx-sender }
      { reviewed: true }
    )
    
    ;; Update stats
    (update-user-stats reviewee rating)
    
    ;; Increment counter
    (var-set review-id-nonce (+ review-id u1))
    
    ;; Return success
    (ok review-id)
  )
)


;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get a specific review
(define-read-only (get-review (review-id uint))
  (map-get? reviews { review-id: review-id })
)

;; Get user statistics
(define-read-only (get-user-stats (user principal))
  (map-get? user-stats { user: user })
)

;; Check if booking has been reviewed by a user
(define-read-only (has-reviewed (booking-id uint) (reviewer principal))
  (is-some (map-get? booking-reviewed { booking-id: booking-id, reviewer: reviewer }))
)

;; Get current review count
(define-read-only (get-review-count)
  (ok (var-get review-id-nonce))
)

;; Get average rating for a user (returns rating * 100)
(define-read-only (get-user-average-rating (user principal))
  (match (map-get? user-stats { user: user })
    stats (ok (get average-rating stats))
    (ok u0)
  )
)



