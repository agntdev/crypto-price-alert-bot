# Crypto Price Alert Bot - GENERAL Design Document

## Summary

This Telegram bot is designed for a single user to monitor the price changes of specified cryptocurrencies (e.g., BTC, ETH) and receive a notification when any of them experience a 5% price change within a defined time interval (e.g., 24 hours). The bot fetches cryptocurrency price data from an external API and uses the Telegram Bot API to send alerts directly to the user's private chat. It is tailored for individuals interested in tracking price movements for personal awareness or decision-making, without any trading execution or multi-user support.

## Core Entities

- **User**: The single user (owner) who interacts with the bot, configures tracked cryptocurrencies, and receives alerts.
- **TrackedCryptocurrency**: A cryptocurrency symbol (e.g., BTC, ETH) that the user has requested to be monitored.
- **PriceAlert**: A record of a price change event that meets the 5% threshold, including the timestamp, cryptocurrency symbol, percentage change, and direction (up/down).
- **TelegramChat**: The user's private Telegram chat where notifications are sent.

### Relationships

- A **User** has one **TelegramChat**.
- A **User** can track multiple **TrackedCryptocurrencies**.
- Each **TrackedCryptocurrency** can generate multiple **PriceAlerts**.
- A **PriceAlert** is associated with one **TrackedCryptocurrency** and one **TelegramChat**.

## External Dependencies

- **Telegram Bot API**:
  - Sending messages to the user's private chat.
  - Receiving commands (e.g., `/track`).
- **Cryptocurrency Price API** (e.g., CoinGecko, CoinMarketCap, or similar):
  - Fetching current and historical prices for tracked cryptocurrencies.
- **Persistence**:
  - Storing the list of tracked cryptocurrencies.
  - Storing the last known price and timestamp for each tracked cryptocurrency to calculate percentage changes.
  - Storing triggered **PriceAlerts** for audit or reference (optional).

## Features

- **User Setup**:
  - User can specify which cryptocurrencies to track using a command like `/track BTC,ETH`.
- **Price Monitoring**:
  - The bot periodically polls the price of each tracked cryptocurrency.
  - It calculates the percentage change from the last recorded price.
- **Alert Triggering**:
  - If the price change is 5% or more (up or down) within the defined interval (e.g., 24 hours), an alert is generated.
- **Telegram Notification**:
  - A message is sent to the user's Telegram chat with the cryptocurrency symbol, percentage change, and direction (up/down).
- **Persistence**:
  - The bot remembers the user's tracked cryptocurrencies between sessions.
  - The last known price and timestamp for each cryptocurrency are stored to enable accurate change calculations.

## Non-goals

- Real-time trading execution or order placement.
- Tracking price changes beyond the 5% threshold.
- Supporting notifications for multiple users or groups.
- Displaying historical price charts or graphs.
- Supporting complex alert rules (e.g., custom thresholds, time intervals, or conditions).
- Supporting a web interface or dashboard.
- Supporting multiple cryptocurrency price APIs simultaneously.