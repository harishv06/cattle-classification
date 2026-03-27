"""
Cattle Breed Classifier - Flask Backend
========================================
A simple Flask API for classifying cattle breeds using a trained PyTorch model.
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import io

# ============== Configuration ==============

# Model settings
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'indian_bovine_breeds_classifier.pt')
BREEDS_DATA_PATH = os.path.join(os.path.dirname(__file__), 'breeds_data.json')
IMAGE_SIZE = 224

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# ============== App Setup ==============

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Image preprocessing transform (ImageNet normalization for EfficientNet)
preprocess = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load model at startup
print("Loading PyTorch model...")
model = None
CLASS_NAMES = []
BREEDS_DATA = {}

try:
    # Load saved model data
    data = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)

    # Extract class names and config
    CLASS_NAMES = data['class_names']
    config = data['config']
    num_classes = config['num_classes']

    # Create EfficientNet-B3 architecture
    model = models.efficientnet_b3(weights=None, num_classes=num_classes)

    # Load trained weights
    model.load_state_dict(data['model_state'])
    model.eval()  # Set to evaluation mode

    print(f"Model loaded successfully from: {MODEL_PATH}")
    print(f"Architecture: EfficientNet-B3")
    print(f"Number of classes: {len(CLASS_NAMES)}")

except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load breed metadata
try:
    with open(BREEDS_DATA_PATH, 'r') as f:
        BREEDS_DATA = json.load(f)
    print(f"Breed metadata loaded successfully: {len(BREEDS_DATA)} breeds")
except Exception as e:
    print(f"Error loading breed metadata: {e}")
    BREEDS_DATA = {}

# ============== Helper Functions ==============

def allowed_file(filename):
    """Check if file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def preprocess_image(image_bytes):
    """
    Preprocess image for EfficientNet-B3 model.

    Args:
        image_bytes: Raw image bytes from upload

    Returns:
        Preprocessed tensor ready for model prediction
    """
    # Open image and convert to RGB
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert('RGB')

    # Apply preprocessing transforms
    img_tensor = preprocess(img)

    # Add batch dimension
    img_tensor = img_tensor.unsqueeze(0)

    return img_tensor


# ============== API Endpoints ==============

@app.route('/')
def home():
    """Health check endpoint."""
    return jsonify({
        'status': 'running',
        'message': 'Cattle Breed Classifier API',
        'model_loaded': model is not None,
        'framework': 'PyTorch'
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict cattle breed from uploaded image.

    Expects: multipart/form-data with 'image' file
    Returns: JSON with predicted class and confidence score
    """
    # Check if model is loaded
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    # Check if file was uploaded
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']

    # Check if file was selected
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate file type
    if not allowed_file(file.filename):
        return jsonify({
            'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400

    try:
        # Read and preprocess image
        image_bytes = file.read()
        img_tensor = preprocess_image(image_bytes)

        # Make prediction (no gradient computation needed)
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            predictions = probabilities.numpy()[0]

        # Get top prediction
        class_idx = np.argmax(predictions)
        confidence = float(predictions[class_idx]) * 100

        # Get class name
        predicted_class = CLASS_NAMES[class_idx] if class_idx < len(CLASS_NAMES) else f"Class_{class_idx}"

        # Get top 3 predictions for additional context
        top_3_idx = np.argsort(predictions)[-3:][::-1]
        top_3 = []
        for idx in top_3_idx:
            if idx < len(CLASS_NAMES):
                top_3.append({
                    'class': CLASS_NAMES[idx],
                    'confidence': float(predictions[idx]) * 100
                })

        # Get breed metadata
        metadata = BREEDS_DATA.get(predicted_class, {
            'milk_yield': 'N/A',
            'native_region': 'N/A',
            'traits': []
        })

        return jsonify({
            'success': True,
            'prediction': predicted_class,
            'confidence': round(confidence, 2),
            'metadata': metadata,
            'top_3': top_3
        })

    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/classes', methods=['GET'])
def get_classes():
    """Return list of all possible classes."""
    return jsonify({
        'classes': CLASS_NAMES,
        'count': len(CLASS_NAMES)
    })


# ============== Run Server ==============

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Starting Cattle Breed Classifier API")
    print("="*50)
    print(f"Server: http://localhost:5000")
    print(f"Predict endpoint: POST http://localhost:5000/predict")
    print("="*50 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)
