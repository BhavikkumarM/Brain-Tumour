# 🧠 Brain Tumour Recognition Web App

A Flask-based web application that uses a deep learning model to classify brain MRI scans for the presence of tumours. Built as an educational demo for technical reviewers.

---

## 🚀 Live Demo

Upload a brain MRI scan (JPG/JPEG/PNG) or select one of the bundled demo samples to get an instant prediction.

---

## 📌 Features

- 🖼️ **Image Upload** — Supports JPG, JPEG, and PNG brain MRI scans (up to 8 MB)
- 🔬 **Demo Samples** — 7 curated sample MRI scans included for quick testing
- 📊 **Sigmoid Score** — Returns the raw model confidence score alongside the prediction
- ⚡ **Fast Inference** — Model is loaded once at startup for low-latency responses
- 🛡️ **Secure Input Handling** — Validates image format, size, and dimensions; never stores uploads
- ♿ **Accessible UI** — Keyboard-operable, screen-reader friendly, with `aria-live` result announcements

---

## 🧬 Model Details

| Property | Value |
|---|---|
| Model File | `BrainTumor_10epoch.h5` |
| Input Size | 64 × 64 pixels (RGB) |
| Normalization | Pixel values scaled by `1/255` |
| Output | Single sigmoid score |
| Threshold | ≥ 0.5 → **Tumor Detected**, < 0.5 → **No Tumor Detected** |
| Training Epochs | 10 |
| Dataset | ~1,510 `no` samples, ~1,500 `yes` samples |

> ⚠️ **Disclaimer:** This is an educational/research tool only. It is **not** a clinical diagnostic tool and should **not** be used to make medical decisions.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.12, Flask 3.x
- **ML Framework:** TensorFlow 2.16.1 / Keras
- **Image Processing:** Pillow
- **Frontend:** Vanilla HTML, CSS, JavaScript (no build system)

---

## 📦 Installation & Local Setup

### Prerequisites
- Python 3.12+
- pip

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/BhavikkumarM/Brain-Tumour.git
cd Brain-Tumour

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the app
cd "Brain Tumour Recognition Project-20260930T082219Z-1-001/Brain Tumour Recognition Project"
python app.py
```

Then open your browser and navigate to: **http://127.0.0.1:5000**

---

## 📁 Project Structure

```
Brain Tumour Recognition Project/
├── app.py                  # Flask application
├── BrainTumor_10epoch.h5   # Trained Keras model (not in repo — add locally)
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Main page template
├── static/
│   ├── styles.css          # Stylesheet
│   └── script.js           # Frontend logic
└── pred/                   # Demo sample MRI images
```

---

## 🔌 API Reference

### `GET /api/samples`
Returns a list of available demo sample IDs and their preview URLs.

### `GET /samples/<id>`
Serves a whitelisted demo sample image.

### `POST /api/predict`
Accepts either a file upload (`image` field) or a sample ID (`sample_id` field).

**Success Response:**
```json
{
  "label": "Tumor detected",
  "tumor_score": 0.73,
  "threshold": 0.5,
  "model": "BrainTumor_10epoch.h5",
  "input_size": [64, 64]
}
```

---

## ⚠️ Limitations

- The model was trained for only 10 epochs on a small dataset and has not been evaluated on an independent clinical test set.
- Accuracy, precision, recall, and other metrics have not been independently verified.
- Do not upload personally identifiable or sensitive medical images.

---

## 👨‍💻 Author

**Bhavikkumar M**
[GitHub](https://github.com/BhavikkumarM)