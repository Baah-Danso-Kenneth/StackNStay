# StackNStay Knowledge Base

## What is StackNStay?

StackNStay is a decentralized property rental platform built on the Stacks blockchain. It connects property owners (hosts) with travelers (guests) without traditional intermediaries like Airbnb or Booking.com.

### Key Features:
- **Decentralized**: No central authority controls your listings or bookings
- **Low Fees**: Only 2% platform fee (vs 15-20% on traditional platforms)
- **Smart Contract Escrow**: Your payment is held securely until check-in
- **Blockchain-based**: All transactions recorded on Stacks blockchain
- **IPFS Storage**: Property data stored on decentralized IPFS network
- **STX Payments**: Pay with Stacks (STX) cryptocurrency

---

## Platform Fees

### Why So Low?

Traditional platforms like Airbnb charge 15-20% in fees. StackNStay's smart contracts automate everything, eliminating expensive middlemen.

**Fee Breakdown:**
- **Guest Fee**: 2% of booking total
- **Host Fee**: 0% (hosts keep 98% of earnings!)
- **Traditional Platforms**: 15-20% total fees

**Example:**
- Booking cost: 100 STX
- Platform fee: 2 STX
- Total paid: 102 STX
- Host receives: 100 STX

**Why This Works:**
- Smart contracts handle escrow automatically
- No customer service staff needed
- No payment processing fees (blockchain native)
- No marketing costs (decentralized discovery)

---

## How Booking Works

### Step-by-Step Process:

1. **Browse Properties**: Search for properties by location, price, amenities
2. **Select Dates**: Choose check-in and check-out dates
3. **Book & Pay**: Payment goes into smart contract escrow
4. **Confirmation**: Booking confirmed on blockchain
5. **Check-in**: At check-in time, payment releases to host
6. **Check-out**: Leave a review after your stay

### Escrow Protection:

Your payment is held in a smart contract until check-in. This protects both guests and hosts:

**For Guests:**
- Money held safely until check-in
- Can cancel for refund (with cancellation policy)
- Dispute resolution if property doesn't match listing

**For Hosts:**
- Guaranteed payment after check-in
- Protected from fraudulent chargebacks
- Automatic payment release (no waiting)

---

## Block Heights vs. Dates

### What is Block Height?

The Stacks blockchain produces blocks approximately every 10 minutes. Block height is the number of blocks since the blockchain started.

### Why Use Block Heights?

Smart contracts use block heights instead of calendar dates because they're more reliable on the blockchain. The frontend converts your selected dates to approximate block heights.

### Example:
- You select March 10, 2024 for check-in
- Frontend calculates: ~block 830,000
- Smart contract uses block 830,000 for check-in

### Conversion:
- **1 day** ≈ 144 blocks (24 hours × 6 blocks/hour)
- **1 week** ≈ 1,008 blocks
- **1 month** ≈ 4,320 blocks

**Don't worry!** The frontend handles all conversions automatically. You just pick dates like normal.

---

## Cancellation Policy

### Refund Schedule:

**More than 7 days before check-in:**
- 100% refund (minus small gas fee)

**3-7 days before check-in:**
- 50% refund

**Less than 3 days before check-in:**
- 0% refund (host keeps full amount)

**After check-in:**
- No refunds (payment already released to host)

### How to Cancel:

1. Go to "My Bookings" page
2. Find your booking
3. Click "Cancel Booking"
4. Confirm cancellation
5. Refund processed automatically via smart contract

---

## Dispute Resolution

### When to Raise a Dispute:

- Property doesn't match listing
- Serious cleanliness issues
- Safety concerns
- Host no-show or locked out
- Major amenities missing

### How Disputes Work:

1. **Guest raises dispute** (during stay or within 24 hours of check-out)
2. **Evidence submitted**: Photos, messages, descriptions
3. **Admin reviews**: Platform admin examines evidence
4. **Decision made**: Full refund, partial refund, or no refund
5. **Smart contract executes**: Refund processed automatically

### Evidence to Provide:
- Photos of issues
- Screenshots of messages with host
- Detailed description of problem
- Timestamps of when issue occurred

---

## Privacy and Decentralization

### What Data is Stored:

**On Blockchain:**
- Property IDs and prices
- Booking dates and amounts
- Review scores and text
- Wallet addresses (public)

**Off Blockchain (IPFS):**
- Property photos
- Descriptions and amenities
- Host profile information

### What's NOT Stored:
- Your name, email, or phone number
- Payment card information
- Personal identification documents
- Private messages (unless you choose to share)

### True Ownership:
- **Hosts own their property listings** (stored on IPFS, linked to your wallet)
- **Users own their booking records** (on blockchain, tied to your wallet)
- **No company can freeze your account** or censor your listings
- **No data harvesting** for advertising

---

## Getting Started

### For Guests:

1. **Get a Stacks Wallet**:
   - Install Hiro Wallet (browser extension)
   - Or use Leather Wallet
   - Or Xverse Wallet

2. **Get STX Tokens**:
   - Buy on exchanges: Binance, OKX, Kraken
   - Transfer to your wallet

3. **Connect Wallet**:
   - Click "Connect Wallet" on StackNStay
   - Approve connection

4. **Start Booking**:
   - Search for properties
   - Book with STX

### For Hosts:

1. **Connect Wallet** (same as guests)

2. **Create Listing**:
   - Click "List Property"
   - Upload photos (stored on IPFS)
   - Set price in STX
   - Add amenities and description

3. **Publish**:
   - Transaction sent to blockchain
   - Listing goes live immediately

4. **Manage Bookings**:
   - View bookings in dashboard
   - Release payments after check-in
   - Respond to guest messages

---

## Common Issues

### "My transaction is pending forever"

**Solution:**
- Stacks transactions take 10-30 minutes to confirm
- Check status on Stacks Explorer: https://explorer.hiro.so
- If stuck for over 1 hour, contact support

### "I don't have enough STX"

**Solution:**
- You need: Booking cost + 2% fee + ~0.1 STX for gas
- Buy more STX on an exchange
- Transfer to your wallet

### "Host isn't responding"

**Solution:**
- Hosts have 24 hours to respond
- If no response and more than 7 days before check-in: Cancel for full refund
- If less than 7 days: Contact support for assistance

### "Property doesn't match listing"

**Solution:**
- Take photos immediately
- Raise a dispute within 24 hours of check-out
- Provide evidence (photos, descriptions)
- Admin will review and determine fair refund

### "Can't connect wallet"

**Solution:**
- Make sure wallet extension is installed
- Refresh the page
- Try a different browser
- Clear browser cache

---

## Benefits Over Traditional Platforms

### For Guests:

✅ **Lower Fees**: 2% vs 15% on Airbnb  
✅ **True Privacy**: No personal data collection  
✅ **Transparent Escrow**: See exactly where your money is  
✅ **Censorship-Resistant**: Can't be deplatformed  
✅ **Global Access**: No geographic restrictions  
✅ **Blockchain Security**: Immutable booking records  

### For Hosts:

✅ **Keep 98% of Earnings**: vs 80-85% on traditional platforms  
✅ **No Arbitrary Suspensions**: You own your listings  
✅ **Direct Relationship**: Connect with guests directly  
✅ **Global Reach**: Access worldwide travelers  
✅ **Instant Payments**: Released automatically at check-in  
✅ **No Discrimination**: Platform can't delist you unfairly  

---

## Technical Details

### Smart Contracts:

**stackstay-escrow.clar**:
- Handles property listings
- Manages bookings and escrow
- Processes payments and refunds
- Enforces cancellation policies

**stackstay-reputation.clar**:
- Tracks user reputation scores
- Records review history
- Calculates trust ratings

**stackstay-badge.clar**:
- Awards achievement badges
- Tracks milestones
- Gamifies platform engagement

**stackstay-dispute.clar**:
- Manages dispute resolution
- Holds disputed funds
- Executes admin decisions

### Technology Stack:

**Blockchain**: Stacks (Bitcoin-secured)  
**Smart Contracts**: Clarity language  
**Storage**: IPFS (Pinata)  
**Frontend**: React + TypeScript  
**Backend**: FastAPI + Python  
**AI**: LangGraph + Groq + Cohere  

---

## Security

### How Your Funds Are Protected:

1. **Smart Contract Escrow**: Funds locked in audited contract
2. **Time-locked Releases**: Payments only release at check-in block height
3. **Dispute Mechanism**: Admin can intervene if needed
4. **Blockchain Immutability**: All transactions recorded permanently

### Best Practices:

- Never share your wallet seed phrase
- Verify property details before booking
- Read reviews from other guests
- Communicate through platform (for dispute evidence)
- Take photos at check-in and check-out

---

## FAQ

**Q: Do I need cryptocurrency to use StackNStay?**  
A: Yes, you need STX (Stacks tokens) to book properties or list properties.

**Q: Is this legal?**  
A: Yes! Decentralized platforms are legal. Hosts are responsible for local regulations (taxes, permits).

**Q: What if I lose my wallet?**  
A: If you lose your seed phrase, you lose access to your wallet and funds. Always back it up securely!

**Q: Can I get a refund in USD?**  
A: No, refunds are in STX. You can sell STX on exchanges for USD.

**Q: How do I contact the host?**  
A: Use the messaging feature on the booking page (coming in v2.0). For now, communicate via wallet addresses.

**Q: Is my data private?**  
A: Yes! Only your wallet address is public. No personal information is stored.

**Q: What happens if the host cancels?**  
A: You get a full refund automatically via smart contract.

**Q: Can I list multiple properties?**  
A: Yes! No limit on listings per wallet.

**Q: Do you support fiat currency?**  
A: Not yet. Currently STX only. Multi-currency support coming in v2.0.

**Q: How do I become a host?**  
A: Connect your wallet and click "List Property". It's that simple!
