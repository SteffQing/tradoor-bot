# 🟢 Tradoor

**An open-source Telegram crypto trading bot built as a challenge — expanding into onchain perps (Base) and beyond.**

![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)

---

## 🔹 Overview

**Tradoor** is a modular, TypeScript-based Telegram bot that lets users connect to multiple centralized exchanges (CEXs) and trade USDT-margined futures.

It started as a **challenge from friends** to see if I could build a functional telegram trading bot that can automate signals and integrate onchain perps. Now it’s evolving into an open-source project with support for **six major CEXs** and a roadmap to integrate **perpetual DEXs on Base** and additional exchanges.

Tradoor is designed to be developer-friendly, risk-aware, and a foundation for future **hybrid CEX + onchain trading workflows**.

---

## 🔹 Features

* **Multi-exchange support (CEXs):** Binance, Bybit, KuCoin, OKX, Gate, MEXC
* **Futures-focused:** USDT-margined perpetuals for long/short positions
* **Secure credentials:** AES-256 encrypted API keys, secrets, and passwords
* **Step-by-step registration:** Clean Telegram UX for connecting exchanges
* **Risk configuration:** User-defined leverage, max order size, etc.
* **Roadmap:** Base-chain perps and additional exchanges

---

## 🔹 Supported Exchanges (Current)

| Exchange       | Type           | CCXT ID         |
| -------------- | -------------- | --------------- |
| Binance USDM   | USDT Futures   | `binanceusdm`   |
| Bybit          | Spot & Futures | `bybit`         |
| KuCoin Futures | USDT Futures   | `kucoinfutures` |
| OKX            | Spot & Futures | `okx`           |
| Gate.io        | USDT Futures   | `gate`          |
| MEXC           | USDT Futures   | `mexc`          |

---

## 🔹 Roadmap (Planned)

* **Perpetual DEXs on Base** (onchain trading)
* **+2 additional CEX integrations**
* **Automated trading strategies** (configurable via Telegram)
* **Liquidation alerts + risk dashboards**
* **Onchain portfolio tracking for Base accounts**

---

## 🔹 Tech Stack

* **Node.js & TypeScript** – modern, type-safe backend
* **Telegraf.js** – Telegram bot framework
* **CCXT** – Unified crypto exchange API
* **Prisma** – ORM for Postgres/SQLite
* **AES-256 encryption** – secure API key storage using Node.js `crypto`

---

## 🔹 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/tradoor.git
cd tradoor
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

Create a `.env` file:

```env
BOT_TOKEN=your_bot_token
WEBHOOK_URL=your_webhook_url
DATABASE_URL=postgresql://user:pass@localhost:5432/db
ENCRYPTION_KEY=32_character_secret_key_here
```

### 4. Run migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start the bot

```bash
pnpm start
```

---

## 🔹 Contributing

Contributions welcome:

* Feature requests: open an issue
* Bug fixes: submit a PR
* Exchange integrations: add new CCXT-supported exchanges
* Onchain modules: help connect to Base perps!

---

## 🔹 License

MIT License © 2025 [Steven Tomi](https://x.com/steffqing)