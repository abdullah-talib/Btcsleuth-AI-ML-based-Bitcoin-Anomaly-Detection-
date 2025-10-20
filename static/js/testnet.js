// Testnet JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeTestnet();
    loadSimulationHistoryAndStats();
});

function initializeTestnet() {
    setupEventListeners();
    initializeCharts();
    loadTestnetConfiguration();
}

function setupEventListeners() {
    const simulateBtn = document.getElementById('simulateTransaction');
    const configForm = document.getElementById('testnetConfig');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    if (simulateBtn) {
        simulateBtn.addEventListener('click', simulateTransaction);
    }
    
    if (configForm) {
        configForm.addEventListener('submit', saveConfiguration);
    }
    
    presetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            applyPreset(this.dataset.preset);
        });
    });
}

function initializeCharts() {
    // Transaction simulation chart
    const simCtx = document.getElementById('simulationChart');
    if (simCtx) {
        window.simulationChart = new Chart(simCtx, {
            type: 'bar',
            data: {
                labels: ['Normal', 'Anomalous'],
                datasets: [{
                    label: 'Transactions',
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(39, 174, 96, 0.8)',
                        'rgba(231, 76, 60, 0.8)'
                    ],
                    borderColor: [
                        '#27ae60',
                        '#e74c3c'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Transaction Simulation Results',
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
    
    // Model performance chart
    const modelCtx = document.getElementById('modelChart');
    if (modelCtx) {
        window.modelChart = new Chart(modelCtx, {
            type: 'radar',
            data: {
                labels: ['SVM', 'Random Forest', 'AdaBoost', 'XGBoost'],
                datasets: [{
                    label: 'Accuracy',
                    data: [85, 87, 82, 89],
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.2)',
                    pointBackgroundColor: '#f39c12',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#f39c12'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Model Performance Comparison',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#bbb'
                        },
                        grid: {
                            color: '#444'
                        },
                        pointLabels: {
                            color: '#fff'
                        }
                    }
                }
            }
        });
    }
}

function loadTestnetConfiguration() {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem('testnetConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        applyConfiguration(config);
    }
}

function applyConfiguration(config) {
    // Apply configuration to form fields
    Object.keys(config).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = config[key];
            } else {
                element.value = config[key];
            }
        }
    });
}

function saveConfiguration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const config = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        config[key] = value;
    }
    
    // Save to localStorage
    localStorage.setItem('testnetConfig', JSON.stringify(config));
    
    showNotification('Configuration saved successfully', 'success');
}

function applyPreset(preset) {
    let config = {};
    
    switch (preset) {
        case 'basic':
            config = {
                numTransactions: 50,
                transactionType: 'mixed',
                anomalyRate: 10,
                priceRange: 'normal',
                volumeRange: 'normal'
            };
            break;
        case 'stress':
            config = {
                numTransactions: 500,
                transactionType: 'mixed',
                anomalyRate: 25,
                priceRange: 'high',
                volumeRange: 'high'
            };
            break;
        case 'anomaly':
            config = {
                numTransactions: 100,
                transactionType: 'anomaly',
                anomalyRate: 50,
                priceRange: 'extreme',
                volumeRange: 'extreme'
            };
            break;
    }
    
    applyConfiguration(config);
    showNotification(`Applied ${preset} preset configuration`, 'info');
}

let stopSimulation = false;

// Patch Stop button
const stopBtn = document.querySelector('#simulateTransaction ~ .btn-outline-danger, #simulateTransaction ~ button.btn-outline-danger');
if (stopBtn) {
    stopBtn.addEventListener('click', function() {
        stopSimulation = true;
        loadSimulationHistoryAndStats();
    });
}

function simulateTransaction() {
    const simulateBtn = document.getElementById('simulateTransaction');
    const loadingSpinner = document.getElementById('simulationLoading');
    
    // Show loading state
    if (simulateBtn) {
        simulateBtn.disabled = true;
        simulateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulating...';
    }
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }
    
    // Get configuration
    const config = getSimulationConfig();
    
    // Send simulation request
    fetch('/binance/testnet-simulate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.data && data.data.total_transactions !== undefined) {
                displaySimulationResults(data.data);
                updateSimulationChart(data.data);
            }
            if (data.demo) {
                displaySimulationVisualization(data.demo);
            }
            showNotification('Simulation completed successfully', 'success');
        } else {
            showNotification('Simulation failed: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Simulation error:', error);
        showNotification('Simulation error: ' + error.message, 'error');
    })
    .finally(() => {
        // Hide loading state
        if (simulateBtn) {
            simulateBtn.disabled = false;
            simulateBtn.innerHTML = '<i class="fas fa-play"></i> Run Simulation';
        }
        
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    });
}

function getSimulationConfig() {
    return {
        num_transactions: parseInt(document.getElementById('numTransactions')?.value || 50),
        transaction_type: document.getElementById('transactionType')?.value || 'mixed',
        anomaly_rate: parseInt(document.getElementById('anomalyRate')?.value || 10),
        price_range: document.getElementById('priceRange')?.value || 'normal',
        volume_range: document.getElementById('volumeRange')?.value || 'normal'
    };
}

function displaySimulationResults(data) {
    // Update results display
    const resultsContainer = document.getElementById('simulationResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total Transactions</h5>
                        <h3 class="text-primary">${data.total_transactions}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Anomalies Detected</h5>
                        <h3 class="text-danger">${data.anomalies_detected}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Accuracy</h5>
                        <h3 class="text-success">${(data.accuracy_score * 100).toFixed(1)}%</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title">Analysis Time</h5>
                        <h3 class="text-info">${new Date(data.analysis_timestamp).toLocaleTimeString()}</h3>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show results container
    resultsContainer.style.display = 'block';
}

function updateSimulationChart(data) {
    if (!window.simulationChart) return;
    
    const normalCount = data.total_transactions - data.anomalies_detected;
    const anomalyCount = data.anomalies_detected;
    
    window.simulationChart.data.datasets[0].data = [normalCount, anomalyCount];
    window.simulationChart.update();
}

function exportSimulationResults() {
    const results = document.getElementById('simulationResults');
    if (!results) {
        showNotification('No simulation results to export', 'warning');
        return;
    }
    
    // Create CSV data
    const csvData = [
        ['Metric', 'Value'],
        ['Total Transactions', document.querySelector('.text-primary').textContent],
        ['Anomalies Detected', document.querySelector('.text-danger').textContent],
        ['Accuracy', document.querySelector('.text-success').textContent],
        ['Analysis Time', document.querySelector('.text-info').textContent]
    ];
    
    // Convert to CSV string
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testnet_simulation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Simulation results exported', 'success');
}

function resetSimulation() {
    // Clear results
    const resultsContainer = document.getElementById('simulationResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    // Reset charts
    if (window.simulationChart) {
        window.simulationChart.data.datasets[0].data = [0, 0];
        window.simulationChart.update();
    }
    
    // Reset form to defaults
    document.getElementById('testnetConfig')?.reset();
    
    showNotification('Simulation reset', 'info');
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

function loadSimulationHistoryAndStats() {
    fetch('/binance/testnet-history')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSimulationStats(data.stats);
                updateSimulationHistory(data.history);
            }
        })
        .catch(err => {
            console.error('Failed to load simulation history/stats:', err);
        });
}

function updateSimulationStats(stats) {
    // Update only the Simulation Stats section (not Test Assets)
    // Find the <h6> with 'Simulation Stats', then its next sibling <ul>
    const statsHeaders = document.querySelectorAll('.card-body h6');
    let statsUl = null;
    statsHeaders.forEach(h6 => {
        if (h6.textContent.includes('Simulation Stats')) {
            // The nextElementSibling is the <ul> we want
            statsUl = h6.nextElementSibling;
        }
    });
    if (statsUl) {
        statsUl.innerHTML = `
            <li>• Total Runs: ${stats.total_runs}</li>
            <li>• Anomalies Found: ${stats.total_anomalies}</li>
            <li>• Avg. Accuracy: ${(stats.avg_accuracy * 100).toFixed(1)}%</li>
        `;
    }
}

function updateSimulationHistory(history) {
    const tbody = document.getElementById('simulationHistory');
    if (!tbody) return;
    if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted"><i class="fas fa-flask"></i> No simulations run yet</td></tr>`;
        return;
    }
    tbody.innerHTML = history.map(h => `
        <tr>
            <td>${h.id}</td>
            <td>${h.timestamp}</td>
            <td>${h.total_transactions}</td>
            <td>${h.anomalies_detected}</td>
            <td>Testnet</td>
            <td>${(h.accuracy_score * 100).toFixed(1)}%</td>
            <td>${h.duration ? h.duration : '-'}</td>
            <td><a href="/results/${h.id}" class="btn btn-sm btn-outline-info">View</a></td>
        </tr>
    `).join('');
}

function clearSimulationHistory() {
    if (!confirm('Are you sure you want to clear all simulation history? This cannot be undone.')) return;
    fetch('/binance/testnet-history', { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadSimulationHistoryAndStats();
                showNotification('Simulation history cleared', 'success');
            } else {
                showNotification('Failed to clear history', 'danger');
            }
        })
        .catch(() => showNotification('Failed to clear history', 'danger'));
}

function displaySimulationVisualization(transactions) {
    const container = document.getElementById('simulation-visualization');
    if (!container) return;
    container.innerHTML = '';
    let i = 0;
    function showTransactionSteps(tx) {
        if (stopSimulation) return;
        // Step 1: Processing (User X → User Y)
        const step1 = document.createElement('div');
        step1.className = 'sim-step-row d-flex align-items-center mb-2';
        step1.style.opacity = 0;
        step1.style.transition = 'opacity 0.5s';
        step1.innerHTML = `<span class='badge bg-primary me-2'><i class='fas fa-user'></i> ${tx.from_account}</span> <span class='mx-2 sim-arrow'><i class="fas fa-arrow-right"></i></span> <span class='spinner-border spinner-border-sm text-info mx-2'></span> <span class='badge bg-secondary ms-2'><i class='fas fa-user'></i> ${tx.to_account}</span> <span class='ms-2 text-info'>Processing...</span>`;
        container.appendChild(step1);
        setTimeout(() => { step1.style.opacity = 1; }, 100);
        // Step 2: Received
        setTimeout(() => {
            if (stopSimulation) return;
            const step2 = document.createElement('div');
            step2.className = 'sim-step-row d-flex align-items-center mb-2';
            step2.style.opacity = 0;
            step2.style.transition = 'opacity 0.5s';
            step2.innerHTML = `<span class='badge bg-secondary me-2'><i class='fas fa-user'></i> ${tx.to_account}</span> <span class='ms-2 text-success'>received <b>${tx.amount} BTC</b> @ $${tx.price}</span>`;
            container.appendChild(step2);
            setTimeout(() => { step2.style.opacity = 1; }, 100);
            // Step 3: Payment Info
            setTimeout(() => {
                if (stopSimulation) return;
                const step3 = document.createElement('div');
                step3.className = 'sim-step-row d-flex align-items-center mb-2';
                step3.style.opacity = 0;
                step3.style.transition = 'opacity 0.5s';
                step3.innerHTML = `<span class='badge bg-info me-2'><i class='fas fa-wallet'></i> Payment Info</span> <span class='ms-2'>${tx.from_account} sent <b>${tx.amount} BTC</b> to ${tx.to_account}</span>`;
                container.appendChild(step3);
                setTimeout(() => { step3.style.opacity = 1; }, 100);
                // Step 4: Behaviour Analysis
                setTimeout(() => {
                    if (stopSimulation) return;
                    const step4 = document.createElement('div');
                    step4.className = 'sim-step-row d-flex align-items-center mb-2';
                    step4.style.opacity = 0;
                    step4.style.transition = 'opacity 0.5s';
                    step4.innerHTML = `<span class='badge bg-info me-2'><i class='fas fa-search'></i> Behaviour Analyzed</span> <span class='ms-2'>${tx.reason}</span>`;
                    container.appendChild(step4);
                    setTimeout(() => { step4.style.opacity = 1; }, 100);
                    // Step 5: If anomaly, show previous history
                    setTimeout(() => {
                        if (stopSimulation) return;
                        let step5 = null;
                        if (tx.is_anomaly && tx.history && tx.history.length > 1) {
                            step5 = document.createElement('div');
                            step5.className = 'sim-step-row d-flex align-items-center mb-2';
                            step5.style.opacity = 0;
                            step5.style.transition = 'opacity 0.5s';
                            const prev = tx.history.slice(0, -1).join(', ');
                            const now = tx.history[tx.history.length - 1];
                            step5.innerHTML = `<span class='badge bg-warning text-dark me-2'><i class='fas fa-history'></i> Previous</span> <span class='ms-2'>${tx.from_account} previous: [${prev}], now: <b>${now} BTC</b></span>`;
                            container.appendChild(step5);
                        }
                        setTimeout(() => { if (step5) step5.style.opacity = 1; }, 100);
                        // Step 6: Model Decision
                        setTimeout(() => {
                            if (stopSimulation) return;
                            const step6 = document.createElement('div');
                            step6.className = 'sim-step-row d-flex align-items-center mb-3';
                            step6.style.opacity = 0;
                            step6.style.transition = 'opacity 0.5s';
                            if (tx.is_anomaly) {
                                step6.innerHTML = `<span class='badge bg-danger me-2'><i class='fas fa-exclamation-triangle'></i> Anomaly Detected</span>`;
                            } else {
                                step6.innerHTML = `<span class='badge bg-success me-2'><i class='fas fa-check-circle'></i> Normal Transaction</span>`;
                            }
                            container.appendChild(step6);
                            setTimeout(() => { step6.style.opacity = 1; }, 100);
                            container.scrollTop = container.scrollHeight;
                            setTimeout(() => { i++; if (i < transactions.length) showTransactionSteps(transactions[i]); }, 900);
                        }, 700);
                    }, 700);
                }, 700);
            }, 700);
        }, 700);
    }
    if (transactions.length > 0) {
        showTransactionSteps(transactions[0]);
    }
}

// Export functions for global use
window.testnetUtils = {
    exportSimulationResults,
    resetSimulation,
    showNotification,
    clearSimulationHistory
};

// Reset stopSimulation on new simulation start
const origSimulateTransaction = simulateTransaction;
simulateTransaction = function() {
    stopSimulation = false;
    origSimulateTransaction.apply(this, arguments);
}
