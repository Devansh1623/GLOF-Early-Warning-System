# Software Requirements Specification (SRS)
**Project Name:** GLOFWatch - Glacial Lake Outburst Flood Early Warning System  
**Version:** 1.0  
**Date:** April 2026

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to outline the software requirements for GLOFWatch, an open-source, ML-augmented Early Warning System (EWS) designed to mitigate the risks of Glacial Lake Outburst Floods (GLOFs) in the Indian Himalayan Region. This specification dictates the system architecture, feature sets, technical constraints, and operating environments.

### 1.2 Intended Audience
This document is intended for:
- **Disaster Management Authorities (e.g., NDMA, CWC):** To understand the operational capabilities and deployment strategies.no
- **Software Engineers & Researchers:** For technical onboarding to the codebase, ML architecture, and API endpoints.
- **Academic Reviewers / Project Supervisors:** To evaluate the system's scope, objectives, and adherence to disaster risk reduction (DRR) standards.

### 1.3 Product Scope
GLOFWatch is a full-stack intelligence platform that integrates hardware telemetry processing, real-time Machine Learning (ML) inference, spatial mapping, and critical alert dispatching. 
Unlike fragmented manual observation systems, GLOFWatch acts as a continuous automated operational pipeline. It ingests environmental data (water levels, seismic activity, temperature, precipitation) from lake-side sensors every 5 seconds, calculates real-time risk severity using both legacy formulas (e.g., Costa, 1988) and an XGBoost/IsolationForest machine learning backend, and instantly dispatches warnings to field commanders and public officials through a unified GIS dashboard and email/SMS alerts.

### 1.4 References
- Sendai Framework for Disaster Risk Reduction 2015-2030
- NDMA Guidelines on Management of Glacial Lake Outburst Floods
- UN Sustainable Development Goals (SDG 11, SDG 13)

---

## 2. Overall Description

### 2.1 Product Perspective
GLOFWatch operates as an independent, cloud-hosted web application comprised of separated microservices. It features a React-based frontend built heavily for GIS visualization and a Python/Flask-based backend built for high-throughput concurrency and mathematical inference.

### 2.2 Product Functions
- **Real-Time Telemetry Ingestion:** Securely process IoT sensor packets at high frequency.
- **Hybrid Risk Engine Formulation:** Synthesize environmental parameters into a uniform 0-100 severity index. 
- **Geospatial Mapping Interface:** Plot glacial lake basins interactively with variable real-time severity layers.
- **Command & Control Dashboard:** Aggregate statistics, graphs, and audit logs.
- **Asynchronous Alert Dispatch:** Queue and dispatch Server-Sent Events (SSE) and Email alerts automatically without interrupting core system intake.

### 2.3 User Classes and Characteristics
- **Operator (Default):** Can view telemetry, charts, and maps. Read-only permissions on risk thresholds.
- **Analyst:** Can augment sensor mappings, execute telemetry exports, and alter specific risk weightings.
- **Administrator (Command):** Complete access rights. Can create and suspend user accounts, simulate disaster telemetry, and forcefully push alert broad-casts globally.

### 2.4 Operating Environment
- **Server constraints:** Python 3.9+ (Backend), Node.js v16+ (Frontend build step).
- **Client constraints:** Modern web browser with ES6 JavaScript and WebGL execution capabilities (for Leaflet Maps).
- **Databases:** MongoDB v6.0+ (Persistent Entity Storage) and Redis (In-Memory Pub/Sub and caching).

---

## 3. System Features

### 3.1 Telemetry Ingestion Pipeline
- **Description:** A RESTful POST endpoint enabling hardware sensors (or the telemetry simulator) to push JSON packet updates containing `water_level`, `temperature`, `precipitation_mm`, and `seismic_activity_g`.
- **Requirements:** 
  - The API MUST be capable of processing a minimum of 1,000 asynchronous concurrent connections.
  - Payloads MUST be validated against database schemas before database insertion.

### 3.2 Real-time Risk Inference Engine
- **Description:** The system's calculation core. Invoked on every new telemetry packet.
- **Requirements:**
  - MUST combine the Costa (1988) empirical formula (weighted 60%) with a pre-trained XGBoost Model + Isolation Forest (weighted 40%).
  - The engine MUST execute and return a score within <100ms to preserve the real-time nature of the application.
  - The score MUST normalize to a float between 0.00 and 100.00.

### 3.3 Event-Driven Alerting (SSE & Queues)
- **Description:** Broadcast mechanisms to inform users immediately when thresholds are crossed.
- **Requirements:**
  - **Warnings (Score > 60):** Must generate an internal audit log and a UI "Toast" notification via Server-Sent Events (SSE).
  - **Emergencies (Score > 80):** Must dispatch a priority background task (Celery/Threading) to send emails via Resend API to all subscribed operators.
  - MUST implement debounce/cooldown logic to prevent email flooding (e.g., maximum 1 email alert per 15 minutes per lake).

### 3.4 Interactive Geospatial Display
- **Description:** A map UI displaying all monitored lakes.
- **Requirements:**
  - Active lakes MUST render as interactive marker pins.
  - Marker colors MUST reflect current risk scores (Green < 40, Yellow < 60, Orange < 80, Red > 80).
  - The map MUST NOT require a full page refresh when a lake changes state; it must use SSE socket updates to re-render asynchronously.

### 3.5 Identity and Access Management
- **Description:** Security framework for dashboard users.
- **Requirements:**
  - Login via secure Email/Password.
  - Application MUST use Stateless JSON Web Tokens (JWT) for API Authorization.
  - Tokens MUST be passed in `Authorization: Bearer <token>` strings.

---

## 4. External Interface Requirements

### 4.1 UI Interfaces
- The web application aligns with a modern "Dark/Atmospheric" aesthetic utilizing deep navy (`#061425`), stark contrasts, and data-heavy visual layouts specifically optimized for widescreen monitor viewing in a command-center environment.
- The interface strictly follows WCAG color contrast standards for crucial disaster information.

### 4.2 Hardware Interfaces
- While in academic/research phases, the software acts as the receiver. In deployment, it interfaces over HTTPS with battery-powered weather stations or RADAR-tethered IoT water sensors placed at glacial terminal moraines.

### 4.3 Software Interfaces
- **Database Backend:** MongoDB (Mongoose/PyMongo)
- **Caching & Brokers:** Redis
- **Mail Service:** Resend Email API (`https://api.resend.com`) for transactional email delivery.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- Telemetry ingestion to visual dashboard graph update (end-to-end latency) MUST be under exactly 5.0 seconds. 
- API endpoints MUST respond in < 250 milliseconds at the 95th percentile under standard load.

### 5.2 Security and Compliance
- Communication MUST be conducted over TLS/SSL (HTTPS) ensuring IoT packet integrity.
- Passwords MUST be hashed using bcrypt or Argon2 in MongoDB; plaintext credentials MUST emphatically be rejected anywhere in logs or databases.
- Private system configuration variables (Resend Keys, Mongo URIs, JWT Secrets) strictly MUST NOT be hard-coded into repository files.

### 5.3 Reliability
- EWS systems require rigorous uptime. The backend MUST be structurally organized to catch catastrophic exceptions without halting Gunicorn Web Server worker instances.
- Background tasks (Emails/Audits) MUST execute out-of-band to prevent UI stalls.

---

## 6. Project Milestones & Future Scope
- **Phase 1 (Complete):** Core REST API, ML architecture evaluation, Basic Dashboard.
- **Phase 2 (Complete):** Map integration, live SSE updates, Public Presentation deck.
- **Phase 3 (Future):** SMS API integration (Twilio/AWS SNS), Government deployment scaling, and Multi-lingual hardware endpoint deployments.
