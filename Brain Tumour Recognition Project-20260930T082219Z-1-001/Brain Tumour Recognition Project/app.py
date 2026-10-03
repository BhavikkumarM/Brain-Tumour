"""Flask interface for the educational brain tumor image model demo."""

from functools import lru_cache
from pathlib import Path

import numpy as np
from flask import Flask, jsonify, render_template, request, send_file
from PIL import Image, UnidentifiedImageError
from tensorflow.keras.models import load_model


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "BrainTumor_10epoch.h5"
SAMPLE_DIR = BASE_DIR / "pred"
SAMPLE_IDS = (0, 10, 20, 30, 40, 50, 59)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_FORMATS = {"JPEG", "PNG"}
INPUT_SIZE = (64, 64)
THRESHOLD = 0.5
MAX_IMAGE_PIXELS = 16_000_000
MAX_UPLOAD_BYTES = 8 * 1024 * 1024

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + 64 * 1024


@lru_cache(maxsize=1)
def get_model():
    """Load the model once per app process, using a path independent of cwd."""
    if not MODEL_PATH.is_file():
        raise RuntimeError("The brain tumor model file is missing.")
    return load_model(MODEL_PATH, compile=False)


def read_image(stream, filename):
    """Validate and prepare an image using the model's training pipeline."""
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Choose a JPG, JPEG, or PNG image.")

    try:
        with Image.open(stream) as source:
            if source.format not in ALLOWED_FORMATS:
                raise ValueError("The file contents are not a supported JPEG or PNG image.")
            if source.width * source.height > MAX_IMAGE_PIXELS:
                raise ValueError("This image is too large to process.")
            source.load()
            image = source.convert("RGB").resize(INPUT_SIZE, Image.Resampling.BICUBIC)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("The image could not be opened. Choose a valid JPG, JPEG, or PNG file.") from exc

    image_array = np.asarray(image, dtype=np.float32) / 255.0
    return np.expand_dims(image_array, axis=0)


def get_prediction_input():
    """Return an in-memory image array from an upload or curated sample."""
    uploaded = request.files.get("image")
    sample_id = request.form.get("sample_id", "").strip()

    if uploaded and sample_id:
        raise ValueError("Choose a sample or upload an image, not both.")

    if uploaded:
        if not uploaded.filename:
            raise ValueError("Choose an image file first.")
        uploaded.stream.seek(0, 2)
        size = uploaded.stream.tell()
        uploaded.stream.seek(0)
        if size > MAX_UPLOAD_BYTES:
            raise ValueError("The file is larger than the 8 MiB upload limit.")
        return read_image(uploaded.stream, uploaded.filename)

    if sample_id:
        if not sample_id.isdigit() or int(sample_id) not in SAMPLE_IDS:
            raise ValueError("That demo sample is unavailable. Choose one of the listed examples.")
        sample_path = SAMPLE_DIR / f"pred{int(sample_id)}.jpg"
        if not sample_path.is_file():
            raise ValueError("That demo sample is currently unavailable.")
        with sample_path.open("rb") as image_file:
            return read_image(image_file, sample_path.name)

    raise ValueError("Choose a demo sample or upload an image first.")


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/samples")
def samples():
    available = [
        {"id": sample_id, "url": f"/samples/{sample_id}"}
        for sample_id in SAMPLE_IDS
        if (SAMPLE_DIR / f"pred{sample_id}.jpg").is_file()
    ]
    return jsonify(samples=available)


@app.get("/samples/<int:sample_id>")
def sample_image(sample_id):
    if sample_id not in SAMPLE_IDS:
        return jsonify(error="Sample not found."), 404
    sample_path = SAMPLE_DIR / f"pred{sample_id}.jpg"
    if not sample_path.is_file():
        return jsonify(error="Sample not found."), 404
    return send_file(sample_path, mimetype="image/jpeg", max_age=3600)


@app.post("/api/predict")
def predict():
    try:
        image_array = get_prediction_input()
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    try:
        output = np.asarray(get_model().predict(image_array, verbose=0)).reshape(-1)
        if output.size != 1 or not np.isfinite(output[0]):
            raise RuntimeError("The model returned an invalid result.")
        tumor_score = float(np.clip(output[0], 0.0, 1.0))
    except Exception:
        app.logger.exception("Model inference failed")
        return jsonify(error="The model could not analyze this image. Please try again."), 500

    return jsonify(
        label="Tumor detected" if tumor_score >= THRESHOLD else "No tumor detected",
        tumor_score=round(tumor_score, 4),
        threshold=THRESHOLD,
        model=MODEL_PATH.name,
        input_size=list(INPUT_SIZE),
    )


@app.errorhandler(413)
def request_too_large(_error):
    if request.path.startswith("/api/"):
        return jsonify(error="The file is larger than the 8 MiB upload limit."), 413
    return "The request is too large. Choose an image smaller than 8 MiB.", 413


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
