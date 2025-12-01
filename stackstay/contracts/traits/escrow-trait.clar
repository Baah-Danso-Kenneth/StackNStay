;; Escrow trait - defines interface
(define-trait escrow-trait
  (
    ;; get-booking returns optional booking data
    (get-booking (uint) (response (optional {
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
    }) uint))
  )
)