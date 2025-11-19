# ResumeVault

## Project Overview

ResumeVault is a decentralized resume authorization platform built on blockchain technology. It enables job seekers to encrypt and store their resumes with configurable access control rules. Recruiters and companies can access resumes through whitelist authorization or paid subscriptions, with payments going directly to the job seeker's wallet. The platform handles access control, privacy protection, and revenue distribution.

## Core Problems

- Traditional resumes are easily leaked, resold, and job seekers receive no data monetization
- Recruiter harassment and privacy information abuse are difficult to control

## Solution

- Encrypted resume storage (Walrus + Seal)
- Wallet-based login and decentralized identity authentication
- **Dual-mode access control**:
  - **Allowlist Mode**: Whitelist-based authorization, ideal for referrals and targeted applications
  - **Subscription Mode**: Pay-to-access with permanent viewing rights, payments go directly to job seeker's wallet
- AI Agent for automatic parsing, authorization, and anti-harassment strategies

## Key Features

- Encrypted upload and version management
- **Dual access modes**:
  - **Allowlist**: Manual whitelist management with flexible access control
  - **Subscription**: Pay-to-unlock (using USDC) with payments going directly to job seekers
- Resume preview summary (anonymized) and full unlock
- AI-powered auto-summary, skill tagging, and match recommendations
- Access logs, reputation scoring, and anti-harassment policies

## Tech Stack

- **Frontend**: React + @mysten/dapp-kit
- **Backend**: Rust (Actix-web) + SeaORM
- **Blockchain**: Sui Network
- **Storage**: Walrus (decentralized storage)
- **Encryption**: Seal (threshold encryption + smart contract access control)
- **Smart Contracts**: Move (Allowlist + Subscription)
- **Payment**: Micro Sui payments

## Target Users & Business Model

- **Target Users**: Job seekers, recruiters, hiring platforms
- **Revenue**:
  - **Subscription Mode**: Job seekers set prices, revenue goes directly to their wallets
  - **Allowlist Mode**: Free but controlled directional sharing
  - **Future**: Platform service fees, enterprise recharge, and premium data services

## One-Sentence Positioning

ResumeVault — Transform resumes into controlled and valuable digital assets, where job seekers control privacy and revenue, while companies gain access to authentic talent through authorization or payment.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Sui Wallet
- MySQL 8.0+

### Frontend Setup

```bash
cd frontend/web
npm install
npm run dev
```

### Backend Setup

```bash
cd backend/rust_backend
cargo build
cargo run
```

### Smart Contract Deployment

```bash
cd contract/move
sui move build
sui client publish --gas-budget 100000000
```

## Documentation

- [中文文档](./README_CN.md)
- [Frontend Documentation](./doc/frontend/)
- [Backend Documentation](./doc/backend/)
- [Smart Contract Documentation](./doc/contract/)

## License

MIT

## Contact

For questions or feedback, please open an issue on GitHub.
