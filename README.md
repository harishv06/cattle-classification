# Cattle & Buffalo Breed Recognition System

Image-based breed identification for cattle and buffaloes of India using deep learning.

## Project Structure

```
Cattle-Breed-Classification/
├── backend/
│   ├── app.py              # Flask API server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html          # Main HTML
│   ├── styles.css          # Stylesheet
│   └── script.js           # JavaScript
├── models/
│   └── indian_bovine_breeds_classifier.pt
└── README.md
```

## Tech Stack

- **Backend:** Python, Flask, PyTorch
- **Frontend:** HTML, CSS, JavaScript
- **Model:** EfficientNet-B3
- **Dataset:** Indian Bovine Breeds (Kaggle)

## Setup

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Start backend:
   ```bash
   python app.py
   ```

3. Start frontend:
   ```bash
   cd frontend
   python -m http.server 8080
   ```

4. Open `http://localhost:8080`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/predict` | Classify image |
| GET | `/classes` | List breeds |

## Supported Breeds

41 breeds including Gir, Sahiwal, Murrah, Holstein Friesian, Jersey, and others.
