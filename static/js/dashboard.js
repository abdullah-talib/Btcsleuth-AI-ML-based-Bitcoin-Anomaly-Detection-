// Dashboard JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start real-time updates
    startRealTimeUpdates();
});

function initializeDashboard() {
    // Initialize charts if chart data exists
    if (window.chartData) {
        initializeCharts();
    }
    // Initialize tooltips with placement and boundary options
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            placement: 'auto',
            boundary: 'window',
            container: 'body'
        });
    });
}

function setupEventListeners() {
    // Alert dismissal
    document.querySelectorAll('.alert-dismissible').forEach(function(alert) {
        alert.addEventListener('closed.bs.alert', function() {
            // Mark alert as read via AJAX if needed
            markAlertAsRead(alert.dataset.alertId);
        });
    });
    
    // Refresh buttons
    document.querySelectorAll('.refresh-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            refreshDashboard();
        });
    });
}

let dashboardChartInstance = null;

function initializeCharts() {
    const ctx = document.getElementById('dashboardChart');
    if (ctx) {
        fetchAndRenderChart(ctx);
        setInterval(() => fetchAndRenderChart(ctx), 10000); // Update every 10 seconds
    }
}

function fetchAndRenderChart(ctx) {
    fetch('/api/user-analysis-activity')
        .then(response => response.json())
        .then(data => {
            if (!data.success) return;
            const chartData = data.chart_data;
            const labels = Object.keys(chartData);
            if (labels.length === 0 || (labels.length === 1 && chartData[labels[0]].analyses === 0 && chartData[labels[0]].anomalies === 0)) {
                ctx.parentElement.innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><p>No analysis activity yet</p></div>';
                return;
            }
            const analysesData = labels.map(date => chartData[date]?.analyses || 0);
            const anomaliesData = labels.map(date => chartData[date]?.anomalies || 0);
            const chartOptions = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Analyses',
                            data: analysesData,
                            borderColor: '#f39c12',
                            backgroundColor: 'rgba(243, 156, 18, 0.1)',
                            tension: 0.4,
                            pointRadius: 5,
                            pointBackgroundColor: '#f39c12',
                            pointBorderColor: '#fff',
                            fill: false
                        },
                        {
                            label: 'Anomalies',
                            data: anomaliesData,
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            tension: 0.4,
                            pointRadius: 5,
                            pointBackgroundColor: '#e74c3c',
                            pointBorderColor: '#fff',
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Analysis Activity (Last 30 Days)',
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
            };
            if (dashboardChartInstance) {
                dashboardChartInstance.data.labels = labels;
                dashboardChartInstance.data.datasets[0].data = analysesData;
                dashboardChartInstance.data.datasets[1].data = anomaliesData;
                dashboardChartInstance.update();
            } else {
                dashboardChartInstance = new Chart(ctx, chartOptions);
            }
        });
}

function startRealTimeUpdates() {
    // Update dashboard stats every 30 seconds
    setInterval(function() {
        updateDashboardStats();
    }, 30000);
    
    // Update live indicators
    setInterval(function() {
        updateLiveIndicators();
    }, 5000);
}

function updateDashboardStats() {
    // Fetch updated stats via AJAX
    fetch('/api/dashboard-stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStatCards(data.stats);
            }
        })
        .catch(error => {
            console.error('Error updating dashboard stats:', error);
        });
}

function updateStatCards(stats) {
    // Update total analyses
    const totalAnalysesEl = document.getElementById('totalAnalyses');
    if (totalAnalysesEl) {
        totalAnalysesEl.textContent = stats.total_analyses || 0;
    }
    
    // Update total anomalies
    const totalAnomaliesEl = document.getElementById('totalAnomalies');
    if (totalAnomaliesEl) {
        totalAnomaliesEl.textContent = stats.total_anomalies || 0;
    }
    
    // Update recent activities
    const recentActivitiesEl = document.getElementById('recentActivities');
    if (recentActivitiesEl && stats.recent_activities) {
        updateRecentActivities(stats.recent_activities);
    }
}

function updateRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    container.innerHTML = '';
    
    activities.forEach(activity => {
        const activityEl = document.createElement('div');
        activityEl.className = 'activity-item';
        activityEl.innerHTML = `
            <div class="d-flex justify-content-between">
                <span>${activity.action}</span>
                <span class="activity-time">${formatTimestamp(activity.timestamp)}</span>
            </div>
            ${activity.details ? `<small class="text-muted">${activity.details}</small>` : ''}
        `;
        container.appendChild(activityEl);
    });
}

function updateLiveIndicators() {
    // Update live analysis indicators
    const liveIndicators = document.querySelectorAll('.live-indicator');
    liveIndicators.forEach(indicator => {
        indicator.style.animationDuration = Math.random() * 2 + 1 + 's';
    });
}

function refreshDashboard() {
    // Show loading state
    const refreshBtns = document.querySelectorAll('.refresh-btn');
    refreshBtns.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });
    
    // Reload page after short delay
    setTimeout(function() {
        location.reload();
    }, 1000);
}

function markAlertAsRead(alertId) {
    if (!alertId) return;
    
    fetch(`/api/alerts/${alertId}/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .catch(error => {
        console.error('Error marking alert as read:', error);
    });
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Utility functions
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

function animateCounter(element, targetValue, duration = 1000) {
    const startValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - startValue) / (duration / 16);
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += increment;
        element.textContent = Math.round(currentValue);
        
        if (currentValue >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        }
    }, 16);
}

function clearAllAnalyses() {
    if (!confirm('Are you sure you want to clear all analyses? This cannot be undone.')) return;
    fetch('/api/user-analyses', { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                showNotification('Failed to clear analyses', 'danger');
            }
        })
        .catch(() => showNotification('Failed to clear analyses', 'danger'));
}

function clearAllLogs() {
    if (!confirm('Are you sure you want to clear all activity logs? This cannot be undone.')) return;
    fetch('/api/user-activity-logs', { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                showNotification('Failed to clear activity logs', 'danger');
            }
        })
        .catch(() => showNotification('Failed to clear activity logs', 'danger'));
}

// Export functions for global use
window.dashboardUtils = {
    showNotification,
    animateCounter,
    formatTimestamp,
    clearAllAnalyses
};
window.activityLogUtils = {
    clearAllLogs
};
