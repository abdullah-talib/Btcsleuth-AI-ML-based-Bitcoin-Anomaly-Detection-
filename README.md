# BTCSleuth: AI/ML Based Bitcoin Anomaly Detection System

A user-friendly web app to detect unusual (anomalous) Bitcoin transactions using advanced machine learning. Analyze your own data, monitor live Binance trades, or run test simulations—all with a secure login and clear reports.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [System Architecture](#system-architecture)
- [How to Use](#how-to-use)
  - [1. Register & Login](#1-register--login)
  - [2. Upload & Analyze CSV](#2-upload--analyze-csv)
  - [3. Live Binance Analysis](#3-live-binance-analysis)
  - [4. Testnet Simulation](#4-testnet-simulation)
- [Machine Learning Details](#machine-learning-details)
- [Configuration & Environment](#configuration--environment)
- [Security Practices](#security-practices)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)
- [Credits](#credits)

---

## Overview
BTCSleuth is a Flask web app that helps you find suspicious Bitcoin transactions using multiple machine learning models. You can:
- Upload your own CSV files for analysis
- Monitor live BTC/USDT trades from Binance
- Simulate testnet data for experiments
- Download detailed PDF reports

## Features
- **Multi-user authentication** (register, login, email verification)
- **Upload CSV** for batch analysis
- **Live Binance monitoring** (BTC/USDT)
- **Testnet simulation** for safe experimentation
- **Ensemble ML models**: SVM, Random Forest, AdaBoost, XGBoost
- **Activity logging** and alert system
- **PDF report generation**
- **Modern dashboard** with charts and stats

## Quick Start
1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd BTCsleuth
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` (create one if missing)
   - Set:
     - `SECRET_KEY` (any random string)
     - `MAIL_USERNAME` and `MAIL_PASSWORD` (Gmail for email verification)
     - `BINANCE_API_KEY` and `BINANCE_API_SECRET` (optional, for live data)
4. **(Optional) Place model files:**
   - If you have trained models, put `svm_model.pkl`, `random_forest_model.pkl`, `adaboost_model.pkl`, `xgboost_model.pkl`, and `scaler.pkl` in the project root.
5. **Run the app:**
   ```bash
   python run.py
   ```
6. **Open in browser:**
   - Go to [http://localhost:5000](http://localhost:5000)

## Directory Structure
```
BTCsleuth/
├── app.py                # App factory and setup
├── run.py                # Main entry point
├── config.py             # All configuration variables
├── models.py             # SQLAlchemy models (User, Analysis, etc.)
├── auth/                 # User authentication (register, login, verify)
├── main/                 # Dashboard, upload, results, etc.
├── binance_routes/       # Live Binance data routes
├── my_binance/           # (Alternative) Binance integration
├── ml/                   # ML analyzer and logic
├── utils/                # Helpers, logging, email, etc.
├── templates/            # HTML templates (Jinja2)
├── static/               # CSS, JS, images
├── uploads/              # Uploaded CSVs
├── reports/              # Generated PDF reports
├── Dataset/              # Example datasets
├── *.pkl                 # ML model files
```

## Flask App Structure

Below is the structure of this Flask application, with explanations for each main component:

```
BTCsleuth/
├── app.py                # Flask app factory/setup (creates and configures the app)
├── run.py                # Main entry point to run the Flask server
├── config.py             # Configuration settings (env vars, secrets, etc.)
├── models.py             # SQLAlchemy models (database tables)
├── auth/                 # Blueprint: User authentication (register, login, email verification)
│   ├── forms.py          # WTForms for auth
│   └── routes.py         # Auth routes (register, login, etc.)
├── main/                 # Blueprint: Main dashboard, upload, results, etc.
│   └── routes.py         # Main app routes
├── binance_routes/       # Blueprint: Live Binance data routes
│   └── routes.py         # Binance-specific endpoints
├── my_binance/           # (Alternative) Binance integration (custom logic)
│   └── routes.py         # Custom Binance endpoints
├── ml/                   # ML analyzer and logic (model loading, prediction)
│   └── analyzer.py       # ML analysis functions
├── utils/                # Helper functions (logging, email, etc.)
│   └── helpers.py        # Utility functions
├── templates/            # Jinja2 HTML templates (all pages)
│   ├── base.html         # Base template
│   └── ...               # Other templates (dashboard, auth, etc.)
├── static/               # Static files (CSS, JS, images)
│   ├── css/              # Stylesheets
│   └── js/               # JavaScript files
├── uploads/              # Uploaded CSV files (user data)
├── reports/              # Generated PDF reports
├── Dataset/              # Example datasets for testing
├── *.pkl                 # Pre-trained ML model files (SVM, RF, AdaBoost, XGBoost, scaler)
├── database/app.db       # SQLite database file
├── requirements.txt      # Python dependencies
├── readme.md             # Project documentation
```

**Key Flask Concepts:**
- **Blueprints:** `auth/`, `main/`, `binance_routes/`, `my_binance/` are Flask Blueprints, modularizing routes and logic.
- **Templates:** All HTML pages are in `templates/`, using Jinja2 for dynamic rendering.
- **Static:** CSS and JS files are in `static/`.
- **Models:** Database models are in `models.py` (and possibly `models/` if expanded).
- **ML Logic:** All machine learning code is in `ml/`.
- **Helpers:** Utility functions are in `utils/`.
- **Uploads/Reports:** User-uploaded files and generated reports are stored in their respective folders.

This structure follows Flask best practices for scalability and maintainability.

## System Architecture
- **Backend:** Flask (Blueprints), SQLAlchemy (SQLite by default), Flask-Login, Flask-Mail
- **Frontend:** Jinja2 templates, Bootstrap 5 (dark theme), Chart.js, custom CSS/JS
- **ML:** scikit-learn, XGBoost, ensemble voting
- **Database:** Users, Analysis, ActivityLog, Alert tables

## How to Use
### 1. Register & Login
- Go to `/auth/register` to create an account (email verification required)
- Login at `/auth/login`

### 2. Upload & Analyze CSV
- Go to Dashboard > Upload
- Upload a CSV file (max 10MB, UTF-8, see format below)
- The system analyzes the file, detects anomalies, and shows results with charts
- Download a PDF report if needed

**CSV Format Example:**
| timestamp           | price    | volume   | amount    | transaction_id |
|---------------------|----------|----------|-----------|---------------|
| 2025-01-01 12:00:00 | 65000.50 | 1.23456  | 80000.25  | tx_001        |
| 2025-01-01 12:01:00 | 65100.75 | 2.34567  | 152750.30 | tx_002        |

- Numeric columns are auto-detected for analysis

### 3. Live Binance Analysis
- Go to Dashboard > Live Analysis
- The app fetches recent BTC/USDT trades from Binance (API keys required)
- ML models analyze the data in real time
- Alerts are generated for detected anomalies

### 4. Testnet Simulation
- Go to Dashboard > Testnet
- Configure number of transactions, anomaly rate, etc.
- Run simulation and view results

## Machine Learning Details
- **Models Used:**
  - Support Vector Machine (SVM)
  - Random Forest Classifier
  - AdaBoost Classifier
  - XGBoost Classifier
- **How it works:**
  - Models are loaded from `.pkl` files
  - Features are scaled using `scaler.pkl`
  - Ensemble voting: each model predicts, results are averaged, and anomalies are flagged
- **What is analyzed:**
  - Transaction patterns, volume, price deviations, temporal patterns
- **Results include:**
  - Anomaly detection, stats, charts, downloadable PDF report

## Configuration & Environment
- **Main config:** `config.py` (reads from environment variables)
- **Required variables:**
  - `SECRET_KEY`: Flask session security
  - `MAIL_USERNAME`, `MAIL_PASSWORD`: Gmail for email verification
  - `BINANCE_API_KEY`, `BINANCE_API_SECRET`: Binance API (for live data)
  - `DATABASE_URL`: (optional) PostgreSQL URI, else uses SQLite
- **How to set:**
  - Use a `.env` file or set in your shell before running
- **Email setup:**
  - Use a Gmail account with "App Passwords" enabled (see Google Account security settings)

## Security Practices
- Passwords are hashed with salt (Werkzeug)
- Session-based authentication (Flask-Login)
- File uploads are validated (type, size)
- User activity and IP addresses are logged
- Email verification for new accounts

## Troubleshooting
- **Email not sending?**
  - Check Gmail credentials and "App Passwords"
  - Make sure `MAIL_USERNAME` and `MAIL_PASSWORD` are set
- **Binance live data not working?**
  - Set `BINANCE_API_KEY` and `BINANCE_API_SECRET`
  - Check your internet connection
- **Model files missing?**
  - results may not be accurate
  - Train and export models as `.pkl` files for best results
- **App not starting?**
  - Check Python version (3.8+ recommended)
  - Ensure all dependencies are installed

## Changelog
- July 03, 2025: Initial setup
- [Add your own changes here]

## Credits
- Developed by [Abdullah Bin Talib]
- Contact: abdullah.talib296@gmail.com
- Degree Bacheolers in Digital Foresics and Cyber Security
- Student at Lahore Garrison Univerity Fa-2021 Batch 
- Uses open-source libraries: Flask, scikit-learn, XGBoost, python-binance, Bootstrap, Chart.js, and more

---
