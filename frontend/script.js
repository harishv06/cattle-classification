/**
 * Cattle & Buffalo Breed Recognition System
 * Core Course Project - JavaScript
 *
 * This script handles:
 * - Image upload and preview
 * - API communication with Flask backend
 * - Display of prediction results
 * - Error handling and user feedback
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    API_URL: 'http://localhost:5000',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),

    // Preview
    previewCard: document.getElementById('previewCard'),
    previewImage: document.getElementById('previewImage'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),

    // Buttons
    clearBtn: document.getElementById('clearBtn'),
    predictBtn: document.getElementById('predictBtn'),
    newScanBtn: document.getElementById('newScanBtn'),

    // Result
    resultCard: document.getElementById('resultCard'),
    loadingState: document.getElementById('loadingState'),
    resultContent: document.getElementById('resultContent'),
    resultBreed: document.getElementById('resultBreed'),
    confidenceValue: document.getElementById('confidenceValue'),
    confidenceFill: document.getElementById('confidenceFill'),
    predictionsList: document.getElementById('predictionsList'),

    // Error
    errorToast: document.getElementById('errorToast'),
    errorText: document.getElementById('errorText'),
    errorClose: document.getElementById('errorClose')
};

// ============================================
// State
// ============================================

let selectedFile = null;

// ============================================
// Upload Functionality
// ============================================

/**
 * Initialize upload area event listeners
 */
function initUpload() {
    // Click to upload
    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // File input change
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop - dragover
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });

    // Drag and drop - dragleave
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });

    // Drag and drop - drop
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

/**
 * Handle selected file
 * @param {File} file - The selected file
 */
function handleFile(file) {
    // Validate file type
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
        showError('Invalid file type. Please upload JPG, PNG, GIF, or WebP images.');
        return;
    }

    // Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showError('File too large. Maximum size is 10MB.');
        return;
    }

    // Store file
    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImage.src = e.target.result;
        elements.fileName.textContent = file.name;
        elements.fileSize.textContent = formatFileSize(file.size);
        showPreview();
    };
    reader.readAsDataURL(file);
}

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================
// UI State Management
// ============================================

/**
 * Show preview card
 */
function showPreview() {
    elements.previewCard.classList.add('show');
    elements.resultCard.classList.remove('show');
    hideError();
}

/**
 * Hide preview and show upload
 */
function hidePreview() {
    elements.previewCard.classList.remove('show');
    selectedFile = null;
    elements.fileInput.value = '';
}

/**
 * Show result card with loading state
 */
function showLoading() {
    elements.resultCard.classList.add('show');
    elements.loadingState.classList.add('show');
    elements.resultContent.classList.remove('show');
    elements.previewCard.classList.remove('show');
}

/**
 * Show result content
 */
function showResult() {
    elements.loadingState.classList.remove('show');
    elements.resultContent.classList.add('show');
}

/**
 * Reset to initial state
 */
function resetToUpload() {
    hidePreview();
    elements.resultCard.classList.remove('show');
    elements.loadingState.classList.remove('show');
    elements.resultContent.classList.remove('show');
    hideError();
}

// ============================================
// Prediction Functionality
// ============================================

/**
 * Send image to backend for prediction
 */
async function predict() {
    if (!selectedFile) {
        showError('Please select an image first.');
        return;
    }

    // Disable button and show loading
    elements.predictBtn.disabled = true;
    showLoading();

    try {
        // Create form data
        const formData = new FormData();
        formData.append('image', selectedFile);

        // Send request to API
        const response = await fetch(`${CONFIG.API_URL}/predict`, {
            method: 'POST',
            body: formData
        });

        // Parse response
        const data = await response.json();

        // Check for errors
        if (!response.ok) {
            throw new Error(data.error || 'Prediction failed. Please try again.');
        }

        // Display results
        displayResult(data);

    } catch (error) {
        // Handle errors
        console.error('Prediction error:', error);
        showError(error.message || 'Failed to connect to server. Make sure the backend is running.');
        showPreview();
    } finally {
        elements.predictBtn.disabled = false;
    }
}

/**
 * Display prediction result
 * @param {Object} data - Prediction data from API
 */
function displayResult(data) {
    // Format breed name (replace underscores with spaces)
    const breedName = data.prediction.replace(/_/g, ' ');

    // Update breed name
    elements.resultBreed.textContent = breedName;

    // Update confidence value
    elements.confidenceValue.textContent = data.confidence.toFixed(1) + '%';

    // Update confidence bar
    setTimeout(() => {
        elements.confidenceFill.style.width = data.confidence + '%';
    }, 100);

    // Update breed metadata
    if (data.metadata) {
        document.getElementById('milkYield').textContent = data.metadata.milk_yield || 'N/A';
        document.getElementById('nativeRegion').textContent = data.metadata.native_region || 'N/A';

        const traitsList = document.getElementById('traitsList');
        if (data.metadata.traits && data.metadata.traits.length > 0) {
            traitsList.innerHTML = data.metadata.traits.map(trait => `
                <span class="trait-tag">${trait}</span>
            `).join('');
        } else {
            traitsList.innerHTML = '<span class="trait-tag">No traits available</span>';
        }
    }

    // Update top predictions
    if (data.top_3 && data.top_3.length > 0) {
        elements.predictionsList.innerHTML = data.top_3.map((p, index) => `
            <div class="prediction-item">
                <span class="prediction-name">${index + 1}. ${p.class.replace(/_/g, ' ')}</span>
                <span class="prediction-conf">${p.confidence.toFixed(1)}%</span>
            </div>
        `).join('');
    }

    // Show result
    showResult();
}

// ============================================
// Error Handling
// ============================================

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorToast.classList.add('show');

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

/**
 * Hide error message
 */
function hideError() {
    elements.errorToast.classList.remove('show');
}

// ============================================
// Navigation
// ============================================

/**
 * Smooth scroll to section
 */
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Scroll to section
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// Event Listeners
// ============================================

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Clear button
    elements.clearBtn.addEventListener('click', hidePreview);

    // Predict button
    elements.predictBtn.addEventListener('click', predict);

    // New scan button
    elements.newScanBtn.addEventListener('click', resetToUpload);

    // Error close button
    elements.errorClose.addEventListener('click', hideError);
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    initUpload();
    initNavigation();
    initEventListeners();

    console.log('Cattle & Buffalo Breed Recognition System initialized');
    console.log('API URL:', CONFIG.API_URL);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
