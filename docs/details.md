# Crypto Price Alert Bot - DETAILS Design Document

## SCREENS

### 1. Initial State
- **Trigger**: `/start` or bot initialization
- **Message**:  
  "Hello! I'm your crypto price alert bot. Use `/track [COIN]` to start monitoring price changes. For example: `/track BTC,ETH`."
- **Keyboard**:  
  - `/track [COINS]`  
  - `/list`  
  - `/help`  
- **Transitions**:  
  - `/track` → **Tracking Setup**  
  - `/list` → **List Display**  
  - `/help` → **Help Display**  

---

### 2. Tracking Setup (Input Coins)
- **Trigger**: `/track [COINS]` or `/remove [COIN]`  
- **Message**:  
  - For `/track`: "Add tracking for: {coins}? Confirm or cancel below."  
  - For `/remove`: "Remove tracking for: {coin}? Confirm or cancel below."  
- **Keyboard**:  
  - **Confirm** (callback: `confirm_track`/`confirm_remove`)  
  - **Cancel** (callback: `cancel_track`/`cancel_remove`)  
- **Transitions**:  
  - `confirm_track` → **Initial State** (with updated tracked list)  
  - `confirm_remove` → **Initial State** (with updated tracked list)  
  - `cancel_track`/`cancel_remove` → **Initial State** (no changes)  

---

### 3. List Display
- **Trigger**: `/list`  
- **Message**:  
  - With tracked coins: "You're currently tracking: {coins}. Tap 'Remove [COIN]' to delete."  
  - No tracked coins: "You're not tracking any cryptocurrencies. Try `/track [COIN]`!"  
- **Keyboard**:  
  - **Remove [BTC]** (callback: `remove_BTC`)  
  - **Remove [ETH]** (callback: `remove_ETH`)  
  - **Done** (callback: `close_list`)  
- **Transitions**:  
  - `remove_[coin]` → **Tracking Setup** (for removal confirmation)  
  - `close_list` → **Initial State**  

---

### 4. Help Display
- **Trigger**: `/help`  
- **Message**:  
  "Available commands:  
  `/track [COINS]` - Add coins to monitor (e.g., `/track BTC,ETH`).  
  `/list` - View tracked coins.  
  `/remove [COIN]` - Remove a coin from tracking.  
  `/help` - Show this help message."  
- **Keyboard**:  
  - `/track [COINS]`  
  - `/list`  
  - `/remove [COIN]`  
- **Transitions**:  
  - Any command → corresponding screen  

---

### 5. Alert Notification
- **Trigger**: Price change ≥5% detected  
- **Message**:  
  "{coin} moved {percent}% {direction}! 🚨  
  Last tracked price: ${price}  
  Current price: ${new_price}"  
- **Keyboard**: None  
- **Transitions**:  
  - Always → **Initial State** (after delivery)  

---

## COMPONENTS

### 1. ConfirmCancelKeyboard
- **Buttons**:  
  - **Confirm** (callback: `confirm_track`/`confirm_remove`)  
  - **Cancel** (callback: `cancel_track`/`cancel_remove`)  
- **Usage**:  
  - After `/track` or `/remove` commands for user validation  

---

### 2. ListWithRemoveButtons
- **Buttons**:  
  - **Remove [BTC]** (callback: `remove_BTC`)  
  - **Remove [ETH]** (callback: `remove_ETH`)  
  - **Done** (callback: `close_list`)  
- **Usage**:  
  - When `/list` is invoked and tracked coins exist  

---

## TRANSITIONS

| Current State       | Input/Callback           | Next State       | Side Effects                                                                 |
|---------------------|--------------------------|------------------|------------------------------------------------------------------------------|
| **Initial State**    | `/track BTC,ETH`         | **Tracking Setup** | Validate coins, check for duplicates/max limit, show confirmation dialog     |
| **Tracking Setup**   | `confirm_track`          | **Initial State**  | Save coins to database, update tracked list                                    |
| **Tracking Setup**   | `cancel_track`           | **Initial State**  | Discard input, return to main menu                                           |
| **Initial State**    | `/remove BTC`            | **Tracking Setup** | Validate coin exists in list, show removal confirmation                        |
| **Tracking Setup**   | `confirm_remove`         | **Initial State**  | Remove coin from database, update tracked list                                |
| **Tracking Setup**   | `cancel_remove`          | **Initial State**  | No changes, return to main menu                                              |
| **List Display**     | `remove_[coin]`          | **Tracking Setup** | Initiate removal flow for specified coin                                     |
| **List Display**     | `close_list`             | **Initial State**  | Close list view                                                              |
| **Initial State**    | `/help`                  | **Help Display**   | Show help message                                                            |
| **Any State**        | Price change ≥5%         | **Alert Notification** | Fetch current price, calculate change, send alert if threshold met           |

---

## DATA

### Entities

#### `TrackedCryptocurrency`
- **Fields**:  
  - `symbol` (string, e.g., "BTC")  
  - `last_price` (float, USD value)  
  - `last_checked_at` (datetime, timestamp of last price check)  
- **Key**: `symbol` (unique per user)  

#### `PriceAlert`
- **Fields**:  
  - `tracked_cryptocurrency_id` (foreign key)  
  - `triggered_at` (datetime)  
  - `percent_change` (float)  
  - `direction` (enum: "up"/"down")  
  - `current_price` (float)  
  - `previous_price` (float)  

#### `TelegramChat`
- **Fields**:  
  - `chat_id` (string, from Telegram API)  
  - `tracked_coins` (list of `TrackedCryptocurrency` symbols)  

---

## ACCEPTANCE NOTES

1. **User Setup**  
   - `/track` must validate coin symbols against supported list (e.g., BTC, ETH).  
   - Duplicate coins in input (e.g., `/track BTC,BTC`) should be ignored with warning: "BTC is already being monitored."  
   - Max 5 coins allowed; exceeding triggers error: "You can only track up to 5 cryptocurrencies at once."  

2. **Monitoring Logic**  
   - Poll prices every 1 hour.  
   - For each tracked coin, calculate 24-hour percentage change using `last_price` and `last_checked_at`.  
   - Only trigger alerts if change ≥5% (absolute value).  

3. **Alert Notification**  
   - Notifications must include:  
     - Coin symbol  
     - Percentage change (rounded to 2 decimals)  
     - Direction emoji (↑/↓)  
     - Last tracked price and current price  
   - No duplicate alerts for same coin until price crosses threshold in opposite direction.  

4. **Persistence**  
   - Store `TrackedCryptocurrency` records with `last_price` and `last_checked_at` for accurate delta calculations.  
   - Retain `PriceAlert` history for 7 days (optional).  

5. **Error Handling**  
   - API failures (price or Telegram) must be logged and shown as: "Failed to fetch price data. Try again later."  
   - Invalid symbols (e.g., XYZ) trigger: "XYZ is not a valid cryptocurrency. Supported symbols: BTC, ETH, etc."  

6. **State Transitions**  
   - After sending an alert, the bot must return to **Initial State** and await user input.  
   - `/list` must dynamically generate remove buttons based on current tracked coins.