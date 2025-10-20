import json
from datetime import datetime
from flask import Blueprint, request, jsonify, render_template, flash, redirect, url_for
from flask_login import login_required, current_user
from my_binance.client import Client
from models import Analysis, Alert
from app import db
from utils.helpers import log_activity, create_alert
from ml.analyzer import MLAnalyzer
import pandas as pd

binance_bp = Blueprint('binance', __name__, url_prefix='/binance')

@binance_bp.route('/live-data')
@login_required
def get_live_data():
    try:
        from config import BINANCE_API_KEY, BINANCE_API_SECRET
        
        if not BINANCE_API_KEY or not BINANCE_API_SECRET:
            return jsonify({'error': 'Binance API keys not configured'}), 400
        
        client = Client(BINANCE_API_KEY, BINANCE_API_SECRET)
        
        # Get recent BTC/USDT trades
        trades = client.get_recent_trades(symbol='BTCUSDT', limit=100)
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(trades)
        df['price'] = df['price'].astype(float)
        df['qty'] = df['qty'].astype(float)
        df['quoteQty'] = df['quoteQty'].astype(float)
        df['time'] = pd.to_datetime(df['time'], unit='ms')
        
        # Analyze with ML models
        analyzer = MLAnalyzer()
        results = analyzer.analyze_live_data(df)
        
        # Save analysis
        analysis = Analysis(
            user_id=current_user.id,
            analysis_type='live',
            total_transactions=len(trades),
            anomalies_detected=results['anomalies_detected'],
            accuracy_score=results['accuracy_score'],
            results=json.dumps(results)
        )
        db.session.add(analysis)
        db.session.commit()
        
        # Create alert if anomalies detected
        if results['anomalies_detected'] > 0:
            create_alert(current_user.id, 'anomaly', 
                       f"Live analysis detected {results['anomalies_detected']} anomalies", 
                       'high')
        
        log_activity(current_user.id, 'Live Analysis', f'Analyzed {len(trades)} live transactions')
        
        return jsonify({
            'success': True,
            'data': results,
            'analysis_id': analysis.id
        })
        
    except Exception as e:
        log_activity(current_user.id, 'Live Analysis Error', f'Error in live analysis: {str(e)}')
        return jsonify({'error': str(e)}), 500

@binance_bp.route('/testnet')
@login_required
def testnet():
    return render_template('dashboard/testnet.html')

@binance_bp.route('/testnet-simulate', methods=['POST'])
@login_required
def simulate_testnet():
    try:
        data = request.get_json()
        
        # Simulate testnet transactions
        num_transactions = data.get('num_transactions', 10)
        transaction_type = data.get('transaction_type', 'mixed')
        
        # Generate simulated transaction data
        import numpy as np
        np.random.seed(42)  # For reproducible results
        
        simulated_data = []
        for i in range(num_transactions):
            transaction = {
                'id': f'testnet_{i}',
                'timestamp': datetime.now().isoformat(),
                'amount': np.random.uniform(0.001, 10.0),
                'price': np.random.uniform(30000, 70000),
                'volume': np.random.uniform(1000, 100000),
                'is_anomaly': np.random.choice([0, 1], p=[0.9, 0.1])
            }
            simulated_data.append(transaction)
        
        # Analyze simulated data
        df = pd.DataFrame(simulated_data)
        analyzer = MLAnalyzer()
        results = analyzer.analyze_simulated_data(df)
        
        # Save analysis
        analysis = Analysis(
            user_id=current_user.id,
            analysis_type='testnet',
            total_transactions=num_transactions,
            anomalies_detected=results['anomalies_detected'],
            accuracy_score=results['accuracy_score'],
            results=json.dumps(results)
        )
        db.session.add(analysis)
        db.session.commit()
        
        # Create alert if anomalies detected
        if results['anomalies_detected'] > 0:
            create_alert(current_user.id, 'anomaly', 
                       f"Testnet simulation detected {results['anomalies_detected']} anomalies", 
                       'medium')
        
        log_activity(current_user.id, 'Testnet Simulation', 
                   f'Simulated {num_transactions} transactions')
        
        return jsonify({
            'success': True,
            'data': results,
            'analysis_id': analysis.id
        })
        
    except Exception as e:
        log_activity(current_user.id, 'Testnet Error', f'Error in testnet simulation: {str(e)}')
        return jsonify({'error': str(e)}), 500

@binance_bp.route('/market-data')
@login_required
def get_market_data():
    try:
        from config import BINANCE_API_KEY, BINANCE_API_SECRET
        
        if not BINANCE_API_KEY or not BINANCE_API_SECRET:
            return jsonify({'error': 'Binance API keys not configured'}), 400
        
        client = Client(BINANCE_API_KEY, BINANCE_API_SECRET)
        
        # Get 24hr ticker statistics
        ticker = client.get_ticker(symbol='BTCUSDT')
        
        # Get order book
        order_book = client.get_order_book(symbol='BTCUSDT', limit=10)
        
        # Get klines for chart
        klines = client.get_klines(symbol='BTCUSDT', interval='1h', limit=24)
        
        market_data = {
            'ticker': ticker,
            'order_book': order_book,
            'price_chart': klines
        }
        
        return jsonify(market_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
