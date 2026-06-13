# Crypto Price Alert Bot - UX SPEC Document

## COMMAND TREE

| Command        | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `/start`       | Initializes the bot, displays a welcome message with available commands.  |
| `/track [coins]` | Adds one or more cryptocurrencies (e.g., `BTC,ETH`) to the tracking list.  |
| `/list`        | Displays the current list of tracked cryptocurrencies.                   |
| `/remove [coin]` | Removes a specific cryptocurrency from the tracking list.                  |
| `/help`        | Shows a summary of commands and their usage.                             |

---

## DIALOG STATE MACHINE

### States
1. **Initial State**  
   - Bot is launched via `/start`.  
   - Displays welcome message and available commands.  

2. **Tracking Setup**  
   - Triggered by `/track` or `/remove`.  
   - User modifies tracked cryptocurrency list.  
   - Transitions to **Alert Notification** when a price change ≥5% is detected.  

3. **Alert Notification**  
   - Bot sends a Telegram message with the cryptocurrency symbol, % change, and direction (↑/↓).  
   - Returns to **Initial State** after alert delivery.  

---

## INLINE-KEYBOARD LAYOUT

**After `/track` command:**  
- **Confirm** (callback: `confirm_track`)  
- **Cancel** (callback: `cancel_track`)  

**After `/list` command (if tracked coins exist):**  
- **Remove [BTC]** (callback: `remove_BTC`)  
- **Remove [ETH]** (callback: `remove_ETH`)  
- **Done** (callback: `close_list`)  

---

## MESSAGE COPY & TONE

### Welcome Message  
> "Hello! I'm your crypto price alert bot. Use `/track [COIN]` to start monitoring price changes. For example: `/track BTC,ETH`."  

### Track Command Success  
> "Tracking added for: {coins}. I'll notify you if any of these move 5% ↑/↓."  

### List Command Output  
- **With tracked coins**:  
  > "You're currently tracking: {coins}. Tap 'Remove [COIN]' to delete."  
- **No tracked coins**:  
  > "You're not tracking any cryptocurrencies. Try `/track [COIN]`!"  

### Alert Notification  
> "{coin} moved {percent}% {direction}! 🚨  
> Last tracked price: ${price}  
> Current price: ${new_price}"  

### Error Messages  
- **Invalid coin**:  
  > "{coin} is not a valid cryptocurrency. Supported symbols: BTC, ETH, etc."  
- **Max coins exceeded**:  
  > "You can only track up to 5 cryptocurrencies at once."  

---

## EDGE CASES

1. **Invalid Input**  
   - If user inputs non-existent coins (e.g., `/track XYZ`), bot responds with "Invalid cryptocurrency symbol."  
   - If user inputs malformed command (e.g., `/track` without arguments), bot prompts: "Usage: `/track [COINS]`."  

2. **Timeouts**  
   - If API call fails (e.g., price data unavailable), bot sends: "Failed to fetch price data. Try again later."  

3. **Empty States**  
   - `/list` when no coins are tracked: "You're not tracking any cryptocurrencies."  

4. **Permission Errors**  
   - If Telegram API fails to send a message: "Failed to deliver alert. Check bot permissions."  

5. **Duplicate Tracking**  
   - If user adds a coin already being tracked: "BTC is already being monitored."  

---

## i18n (Translatable Strings)

| Key                            | Value (English)                              |
|--------------------------------|----------------------------------------------|
| `welcome.message`              | "Hello! I'm your crypto price alert bot..."  |
| `track.success`                | "Tracking added for: {coins}..."             |
| `alert.notification`           | "{coin} moved {percent}% {direction}! 🚨..." |
| `error.invalid_coin`           | "{coin} is not a valid cryptocurrency..."    |
| `error.max_coins`              | "You can only track up to 5 cryptocurrencies..." |
| `button.confirm`               | "Confirm"                                    |
| `button.cancel`                | "Cancel"                                     |