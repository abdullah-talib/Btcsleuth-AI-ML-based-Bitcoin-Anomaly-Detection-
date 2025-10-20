// Live Analysis JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeLiveAnalysis();
});

let isAnalyzing = false;
let analysisInterval = null;
let marketDataInterval = null;

// Pagination variables for 1000 transactions
let currentPage = 1;
let transactionsPerPage = 50;
let allTransactions = [];

function initializeLiveAnalysis() {
    setupEventListeners();
    initializeCharts();
    startMarketDataUpdates();
}

function setupEventListeners() {
    const startBtn = document.getElementById('startAnalysis');
    const stopBtn = document.getElementById('stopAnalysis');
    const refreshBtn = document.getElementById('refreshMarketData');
    
    if (startBtn) {
        startBtn.addEventListener('click', startLiveAnalysis);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopLiveAnalysis);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshMarketData);
    }
    
    
}

function initializeCharts() {
    // Price chart
    const priceCtx = document.getElementById('priceChart');
    if (priceCtx) {
        window.priceChart = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'BTC Price',
                    data: [],
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'BTC/USDT Price Chart',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: '#bbb'
                        },
                        grid: {
                            color: '#444'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#bbb'
                        },
                        grid: {
                            color: '#444'
                        }
                    }
                }
            }
        });
    }
    
    // Anomaly detection chart
    const anomalyCtx = document.getElementById('anomalyChart');
    if (anomalyCtx) {
        window.anomalyChart = new Chart(anomalyCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Normal Transactions',
                    data: [],
                    backgroundColor: 'rgba(39, 174, 96, 0.6)',
                    borderColor: '#27ae60'
                }, {
                    label: 'Anomalies',
                    data: [],
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: '#e74c3c'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Anomaly Detection Results',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#bbb'
                        },
                        grid: {
                            color: '#444'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#bbb'
                        },
                        grid: {
                            color: '#444'
                        }
                    }
                }
            }
        });
    }
}

function startLiveAnalysis() {
    if (isAnalyzing) return;
    
    isAnalyzing = true;
    updateAnalysisControls();
    
    // Show live indicator
    const liveIndicator = document.getElementById('liveIndicator');
    if (liveIndicator) {
        liveIndicator.style.display = 'inline-block';
    }
    
    // Start analysis interval
    analysisInterval = setInterval(performAnalysis, 10000); // Every 10 seconds
    
    // Perform initial analysis
    performAnalysis();
    
    showNotification('Live analysis started', 'success');
}

function stopLiveAnalysis() {
    if (!isAnalyzing) return;
    
    isAnalyzing = false;
    updateAnalysisControls();
    
    // Hide live indicator
    const liveIndicator = document.getElementById('liveIndicator');
    if (liveIndicator) {
        liveIndicator.style.display = 'none';
    }
    
    // Clear analysis interval
    if (analysisInterval) {
        clearInterval(analysisInterval);
        analysisInterval = null;
    }
    
    showNotification('Live analysis stopped', 'info');
}

function updateAnalysisControls() {
    const startBtn = document.getElementById('startAnalysis');
    const stopBtn = document.getElementById('stopAnalysis');
    const statusEl = document.getElementById('analysisStatus');
    
    if (startBtn) {
        startBtn.disabled = isAnalyzing;
        startBtn.innerHTML = isAnalyzing ? 
            '<i class="fas fa-spinner fa-spin"></i> Analyzing...' : 
            '<i class="fas fa-play"></i> Start Analysis';
    }
    
    if (stopBtn) {
        stopBtn.disabled = !isAnalyzing;
    }
    
    if (statusEl) {
        statusEl.textContent = isAnalyzing ? 'Running' : 'Stopped';
        statusEl.className = isAnalyzing ? 'text-success' : 'text-secondary';
    }
}

function performAnalysis() {
    const startTime = performance.now();
    
    fetch('/binance/live-data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const endTime = performance.now();
            const analysisTime = ((endTime - startTime) / 1000).toFixed(2);
            
            updateAnalysisResults(data.data);
            updateAnomalyChart(data.data);
            
            // Check for anomalies and show alerts
            if (data.data.anomalies_detected > 0) {
                showAnomalyAlert(data.data.anomalies_detected);
            }
                                if (data.trades) {
                        updateTransactionsTable(data.trades);
                    }
                    
                    // Update analysis time display
                    updateAnalysisTime(analysisTime);
                    

        } else {
            console.error('Analysis error:', data.error);
            showNotification('Analysis error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error performing analysis:', error);
        showNotification('Error connecting to analysis service', 'error');
    });
}

function updateAnalysisTime(time) {
    const analysisTimeDisplay = document.getElementById('analysisTimeDisplay');
    if (analysisTimeDisplay) {
        analysisTimeDisplay.textContent = `${time}s`;
    }
}

function updateAnalysisResults(data) {
    // Update statistics
    const totalTransactionsEl = document.getElementById('totalTransactions');
    const anomaliesDetectedEl = document.getElementById('anomaliesDetected');
    const accuracyScoreEl = document.getElementById('accuracyScore');
    const lastUpdateEl = document.getElementById('lastUpdate');
    
    if (totalTransactionsEl) {
        totalTransactionsEl.textContent = data.total_transactions || 0;
    }
    
    if (anomaliesDetectedEl) {
        anomaliesDetectedEl.textContent = data.anomalies_detected || 0;
    }
    
    if (accuracyScoreEl) {
        accuracyScoreEl.textContent = ((data.accuracy_score || 0) * 100).toFixed(1) + '%';
    }
    
    if (lastUpdateEl) {
        lastUpdateEl.textContent = new Date().toLocaleTimeString();
    }
}

function updateAnomalyChart(data) {
    if (!window.anomalyChart) return;
    
    const normalData = [];
    const anomalyData = [];
    
    // Generate sample data points for visualization
    for (let i = 0; i < data.total_transactions; i++) {
        const point = {
            x: Math.random() * 100,
            y: Math.random() * 100
        };
        
        if (data.anomaly_indices && data.anomaly_indices.includes(i)) {
            anomalyData.push(point);
        } else {
            normalData.push(point);
        }
    }
    
    window.anomalyChart.data.datasets[0].data = normalData;
    window.anomalyChart.data.datasets[1].data = anomalyData;
    window.anomalyChart.update();
}

function updateTransactionsTable(trades) {
    // Store all transactions for pagination
    allTransactions = trades || [];
    
    // Update total count display
    const totalCountEl = document.getElementById('totalTransactionsCount');
    if (totalCountEl) {
        totalCountEl.textContent = allTransactions.length;
    }
    
    // Reset to first page when new data arrives
    currentPage = 1;
    
    // Display current page
    displayCurrentPage();
    
    // Setup pagination event listeners
    setupPaginationListeners();
}

function displayCurrentPage() {
    const table = document.getElementById('transactionsTable');
    if (!table) return;

    if (!allTransactions.length) {
        table.innerHTML = `<tr>
            <td colspan="5" class="text-center text-muted">
                <i class="fas fa-clock"></i> No recent transactions.
            </td>
        </tr>`;
        updatePaginationInfo();
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = Math.min(startIndex + transactionsPerPage, allTransactions.length);
    const pageTransactions = allTransactions.slice(startIndex, endIndex);

    // Display transactions for current page
    table.innerHTML = pageTransactions.map(trade => `
        <tr>
            <td>${new Date(trade.time).toLocaleTimeString()}</td>
            <td>${parseFloat(trade.price).toFixed(2)}</td>
            <td>${parseFloat(trade.qty).toFixed(6)}</td>
            <td>${(parseFloat(trade.price) * parseFloat(trade.qty)).toFixed(2)}</td>
            <td>${trade.isBestMatch ? '<span class="status-matched">Matched</span>' : ''}</td>
        </tr>
    `).join('');

    // Update pagination info and controls
    updatePaginationInfo();
    updatePaginationControls();
}

function updatePaginationInfo() {
    const showingRangeEl = document.getElementById('showingRange');
    const currentPageEl = document.getElementById('currentPage');
    
    if (showingRangeEl) {
        const startIndex = (currentPage - 1) * transactionsPerPage + 1;
        const endIndex = Math.min(currentPage * transactionsPerPage, allTransactions.length);
        showingRangeEl.textContent = `${startIndex}-${endIndex}`;
    }
    
    if (currentPageEl) {
        const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
        currentPageEl.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    // Update enhanced transaction info display
    updateEnhancedTransactionInfo();
}

function updateEnhancedTransactionInfo() {
    const currentPageDisplay = document.getElementById('currentPageDisplay');
    const totalPagesDisplay = document.getElementById('totalPagesDisplay');
    const transactionsPerPageDisplay = document.getElementById('transactionsPerPageDisplay');
    
    if (currentPageDisplay) {
        currentPageDisplay.textContent = currentPage;
    }
    
    if (totalPagesDisplay) {
        const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
        totalPagesDisplay.textContent = totalPages;
    }
    
    if (transactionsPerPageDisplay) {
        transactionsPerPageDisplay.textContent = transactionsPerPage;
    }
}

function updatePaginationControls() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
}

function setupPaginationListeners() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayCurrentPage();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayCurrentPage();
            }
        };
    }
}

function showAnomalyAlert(count) {
    const alertsContainer = document.getElementById('alertsContainer');
    const noAlertsMessage = document.getElementById('noAlertsMessage');
    if (!alertsContainer) return;

    // Hide the no alerts message
    if (noAlertsMessage) {
        noAlertsMessage.classList.add('hidden');
    }

    // Create a unique ID for this alert based on timestamp
    const alertId = 'alert-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.id = alertId;
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Anomaly Detected!</strong> Found ${count} suspicious transaction(s).
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Remove alert from DOM when closed
    alertDiv.querySelector('.btn-close').addEventListener('click', function() {
        alertDiv.remove();
        checkAlertsEmpty();
    });

    // Prepend the new alert so newest is at the top
    alertsContainer.prepend(alertDiv);

    // Play alert sound if available
    playAlertSound();

    // Scroll to top to show the newest alert
    alertsContainer.scrollTop = 0;

    // Send email if email notifications are enabled
    const emailCheckbox = document.getElementById('alertEmail');
    if (emailCheckbox && emailCheckbox.checked) {
        fetch('/api/send-anomaly-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                anomaly_count: count,
                details: 'Live BTC analysis anomaly alert.'
            })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                showNotification('Failed to send email notification.', 'error');
            }
        })
        .catch(() => {
            showNotification('Failed to send email notification.', 'error');
        });
    }
}

function checkAlertsEmpty() {
    const alertsContainer = document.getElementById('alertsContainer');
    const noAlertsMessage = document.getElementById('noAlertsMessage');
    if (!alertsContainer || !noAlertsMessage) return;
    // Only count .alert children (not the noAlertsMessage itself)
    const alertCount = Array.from(alertsContainer.children).filter(child => child.classList && child.classList.contains('alert')).length;
    if (alertCount === 0) {
        noAlertsMessage.classList.remove('hidden');
    }
}

function startMarketDataUpdates() {
    // Update market data every 30 seconds
    marketDataInterval = setInterval(updateMarketData, 30000);
    
    // Initial update
    updateMarketData();
}

function updateMarketData() {
    fetch('/binance/market-data')
        .then(response => response.json())
        .then(data => {
            if (data.ticker) {
                updateMarketTicker(data.ticker);
            }
            if (data.price_chart) {
                updatePriceChart(data.price_chart);
            }
        })
        .catch(error => {
            console.error('Error updating market data:', error);
        });
}

function updateMarketTicker(ticker) {
    const priceEl = document.getElementById('currentPrice');
    const changeEl = document.getElementById('priceChange');
    const volumeEl = document.getElementById('volume24h');
    
    if (priceEl) {
        priceEl.textContent = '$' + parseFloat(ticker.lastPrice).toLocaleString();
    }
    
    if (changeEl) {
        const change = parseFloat(ticker.priceChangePercent);
        changeEl.textContent = change.toFixed(2) + '%';
        changeEl.className = change >= 0 ? 'market-change positive' : 'market-change negative';
    }
    
    if (volumeEl) {
        volumeEl.textContent = parseFloat(ticker.volume).toLocaleString();
    }
}

function updatePriceChart(klines) {
    if (!window.priceChart) return;
    
    const labels = klines.map(k => new Date(k[0]).toLocaleTimeString());
    const prices = klines.map(k => parseFloat(k[4])); // Close price
    
    window.priceChart.data.labels = labels;
    window.priceChart.data.datasets[0].data = prices;
    window.priceChart.update();
}

function refreshMarketData() {
    const refreshBtn = document.getElementById('refreshMarketData');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    updateMarketData();
    
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-refresh"></i> Refresh';
        }
    }, 2000);
}

function playAlertSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBDuY3/LRezoGb5bJ9NWcOwghcLfs2KdURQtKqeTz1XkwACF+v+y8aDANL3vN6+qLPQQgdMfj1ZZHBQdJrN7wuGkjBEKR2/vHdCQiAA==');
        audio.play();
    } catch (error) {
        console.log('Could not play alert sound');
    }
}

function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Clean up intervals when page is closed
window.addEventListener('beforeunload', function() {
    if (analysisInterval) {
        clearInterval(analysisInterval);
    }
    if (marketDataInterval) {
        clearInterval(marketDataInterval);
    }
});
