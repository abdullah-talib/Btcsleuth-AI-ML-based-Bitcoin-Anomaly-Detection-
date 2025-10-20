// File Upload JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
});

function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!uploadArea || !fileInput || !uploadForm) return;
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Form submission
    uploadForm.addEventListener('submit', handleFormSubmit);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files: files } });
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showAlert('Please select a CSV file.', 'error');
        return;
    }
    
    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('File size must be less than 10MB.', 'error');
        return;
    }
    
    // Update upload area
    updateUploadArea(file);
    
    // Enable submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

function updateUploadArea(file) {
    const uploadArea = document.getElementById('uploadArea');
    const fileIcon = uploadArea.querySelector('.file-upload-icon');
    const uploadText = uploadArea.querySelector('.upload-text');
    
    if (fileIcon) {
        fileIcon.className = 'fas fa-file-csv text-success file-upload-icon';
    }
    
    if (uploadText) {
        uploadText.innerHTML = `
            <h5>${file.name}</h5>
            <p class="text-muted">Size: ${formatFileSize(file.size)}</p>
            <p class="text-success">Ready to analyze</p>
        `;
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Please select a file to upload.', 'error');
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Create FormData and submit
    const formData = new FormData();
    formData.append('file', file);
    
    submitFile(formData);
}

function showLoadingState() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const uploadProgress = document.getElementById('uploadProgress');
    const submitBtn = document.getElementById('submitBtn');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }
    
    if (uploadProgress) {
        uploadProgress.style.display = 'block';
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    }
    
    // Simulate progress
    simulateProgress();
}

function simulateProgress() {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.round(progress) + '%';
        
        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 200);
}

function submitFile(formData) {
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.redirected) {
            // Complete progress bar
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.textContent = '100%';
            }
            
            // Redirect to results page
            setTimeout(() => {
                window.location.href = response.url;
            }, 500);
        } else {
            return response.text();
        }
    })
    .then(html => {
        if (html) {
            // Handle form validation errors
            document.body.innerHTML = html;
            initializeUpload();
        }
    })
    .catch(error => {
        console.error('Error uploading file:', error);
        showAlert('Error uploading file. Please try again.', 'error');
        hideLoadingState();
    });
}

function hideLoadingState() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const uploadProgress = document.getElementById('uploadProgress');
    const submitBtn = document.getElementById('submitBtn');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    
    if (uploadProgress) {
        uploadProgress.style.display = 'none';
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-chart-line"></i> Analyze File';
    }
}

function showAlert(message, type) {
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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export functions for global use
window.uploadUtils = {
    showAlert,
    formatFileSize
};
