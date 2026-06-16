# FedBrainScan

> Federated Learning system for brain tumor detection — without sharing patient data.

[![Python](https://img.shields.io/badge/Python-3.10-blue)](https://python.org)
[![Flower](https://img.shields.io/badge/Flower-FL-green)](https://flower.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Overview

FedBrainScan allows multiple hospitals to collaboratively train a CNN model for brain tumor classification on MRI images — without ever sharing their sensitive data.

- **3 hospital clients** train locally on private data
- **Flower server** aggregates weights via FedAvg
- **Flask API** exposes metrics and models
- **React dashboard** monitors training in real time

---

## Architecture

```
Frontend React (localhost:3000)
        │ HTTP/REST
    Flask API (:5000)
        │ reads files
    ┌───┴────────────────┐
    │  Flower Server     │ :8080 (gRPC)
    │  ┌─────────────┐   │
    │  │  FedAvg     │◄──┼── Hospital 1 (:8081)
    │  └─────────────┘   │── Hospital 2 (:8082)
    │  saved_models/     │── Hospital 3 (:8083)
    │  metrics_logs/     │
    └────────────────────┘
```

---

## Results

| Round | Accuracy | Clients |
|-------|----------|---------|
| 1     | 94.57%   | 3       |
| 5     | 98.34%   | 3       |
| 10    | 98.02%   | 3       |

**Improvement: +3.45% over 10 rounds — status: EXCELLENT**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Federated Learning | Flower (flwr) |
| Model | TensorFlow/Keras CNN (10 layers) |
| Backend | Flask REST API |
| Frontend | React |
| Deployment | Docker & Docker Compose |
| Communication | gRPC |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/OumaimaKrt/FederatedBrainNet.git
cd FedBrainScan

# Start federated system
docker-compose up --build

# Start Flask backend
cd backend && pip install -r requirements.txt && python app.py

# Start React frontend
cd frontend && npm install && npm start
```

---

## Project Structure

```
FedBrainScan/
├── server/             # Flower federated server
│   ├── server.py
│   ├── saved_models/   # Global models (.npz)
│   └── metrics_logs/   # Round metrics (.json)
├── hospitals/
│   ├── hospital_1/     # Docker client 1
│   ├── hospital_2/     # Docker client 2
│   └── hospital_3/     # Docker client 3
├── backend/            # Flask API
├── frontend/           # React app
├── tests/              # Unit, integration, performance
└── docker-compose.yml
```

---

## Testing

```bash
cd tests
python test_clients_unit.py      # Unit tests — hospital clients
python test_server_structure.py  # Server structure verification
python test_integration.py       # Models/metrics integration
python test_perfarmance.py       # Performance benchmarks
python test_validation_complete.py # Full system validation
```
dataset link : https://drive.google.com/drive/folders/1OASLM-T10f05oZ_iqYD134gJRxIw1zNu
