# Agent Banking Enterprise Tracking System

A professional high-fidelity financial operations platform tailored for the Zimbabwe agent banking ecosystem. This system provides sovereign control over multi-provider reconciliations, real-time liquidity tracking, and AI-powered security monitoring.

---

## 🏛️ Operational Hierarchy & Access Control

The system is built on a strict role-based access model to ensure dashboard isolation and operational integrity.

### 1. The Executive Office (Admin)
The highest tier of control, focused on strategy and network growth.
- **Worker Registration**: Onboard new Agents and Supervisors into the network.
- **Provider Orchestration**: Manage connections with 15+ payment gateways (EcoCash, InnBucks, etc.).
- **Commission Settlement**: Execute final payouts based on the 80/15/5 distribution model.
- **System-Wide Audit**: View total network liquidity and global performance metrics.

### 2. The Manager’s Office (Supervisor)
Focused on regional oversight and tactical liquidity management.
- **Money Request Management**: Approve or decline float requisitions from Field Agents.
- **Guardian Security Radar**: Monitor real-time security alerts and AI-flagged "Smurfing" or "Splitting" attempts.
- **Regional Telemetry**: Track the performance and liquidity health of assigned branches.
- **5% Reward Pool**: Automatically calculates the Manager's 5% share of total network commission.

### 3. My Counter (Field Agent)
The operational frontline focused on customer service and cash management.
- **Shift Authorization**: Secure check-in via the **Cash Integrity Sensor**, cross-referencing physical cash with previous shift records.
- **Daily Operations**: Real-time management of Physical Cash vs. Digital Float.
- **Money Requisitions**: Submit digital requests for capital top-ups to the Manager's Office.
- **Terminal Sync**: Commit real-time updates of line balances to the central ledger.

---

## 💎 Core Business Functions

### 💵 Liquidity Management (Cash vs. Float)
The system treats "Money" as two distinct but linked assets:
- **Physical Ledger (Cash)**: Increases when customers deposit (Cash-In) and decreases when customers withdraw (Cash-Out).
- **Electronic Ledger (Float)**: Managed across multiple providers (EcoCash, OneMoney, ZB, etc.).
- **Constraint**: The system enforces `Cash + Float = Total Working Capital` at all times.

### 🚨 Guardian Security Radar
Powered by LLM analysis, the Guardian service monitors every transaction for:
- **Smurfing Detection**: Identifying patterns of multiple small transactions used to bypass regulatory limits.
- **Splitting Alerts**: Flagging attempts to divide large deposits into smaller chunks.
- **Liquidity Forecasts**: Predictive analysis of when a specific branch will run out of float or exceed safe cash limits.

### ⚖️ The Sovereign Commission System (80/15/5 Model)
The system automatically distributes earned revenue to ensure fair incentives:
- **80% Owner Share**: Retained as gross business profit.
- **15% Agent Salary**: Earned by the agent processing the transaction.
- **5% Manager Pool**: Earned by the supervisor as an operational reward.

### 🔍 Real-Time Reconciliation
Ensures zero-cent loss by cross-referencing system ledgers with external provider statements:
- **Automated Sync**: Instant fetching of status from connected APIs.
- **CSV Data Ingest**: Support for offline providers via high-fidelity bulk import tool.
- **Discrepancy Investigation**: Automated flagging of mismatched or missing transactions.

---

## 🛠️ Technology Stack

- **Foundational**: HTML5, TypeScript, vanilla CSS3.
- **Aesthetics**: **Sovereign Slate** Design System (Modern, Professional, High-Contrast).
- **Frontend**: React 19 + tRPC Client for type-safe state management.
- **Backend**: Node.js Enterprise Engine + tRPC Procedures.
- **Database**: Drizzle ORM + MySQL 8.0 with sub-cent precision tracking.
- **AI Engine**: Built-in LLM for pattern recognition and proactive security.

---

## 🚀 Deployment & Installation

### Prerequisites
- Node.js v22 or higher
- MySQL 8.0 Instance

### Quick Start
1. **Initialize Environment**:
   ```bash
   npm install
   cp .env.example .env
   ```
2. **Database Migration**:
   ```bash
   npx drizzle-kit push
   ```
3. **Launch Platform**:
   ```bash
   npm run dev
   ```

---

## 🔐 Security Standards
- **Sovereign Dashboard Isolation**: Full separation of Admin/Supervisor/Agent views.
- **Passcode Verification**: Double-factor authentication for sensitive operational shifts.
- **Audit Trails**: Every liquidity movement is timestamped and attributed to a specific worker.

---
**Version**: 1.0.0-PRO  
**Last Updated**: April 2026  
**Status**: Enterprise Ready
