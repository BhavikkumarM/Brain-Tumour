# Brain Tumor Model Demo — Build Guide

## Purpose

Build a public-facing, accessible web demo for technical reviewers to explore the existing binary brain tumor image classifier. Visitors can run the model on one of the bundled demonstration scans or upload one JPG, JPEG, or PNG image of their own. This is an educational model demonstration, not a clinical service or diagnostic tool.

The first release covers the brain tumor image model only. It does not collect age, symptoms, or other patient details, and it does not expose the separate Streamlit experiments. Those features use different or missing models and would need their own validated input pipelines.

## Current project facts

- The selected model is `BrainTumor_10epoch.h5` in the Brain Tumour Recognition Project folder.
- The training script uses 64×64 RGB images, scales pixel values by 1/255, and produces one sigmoid score. A score at or above 0.5 maps to the `yes` class; a lower score maps to `no`.
- The project contains a `pred/` directory with 60 images suitable for demonstration samples. The demonstration page may expose a small, curated subset from this folder.
- The existing Flask prototype references an incorrect model filename and input size, expects a missing template, and posts to a route the server does not provide. This guide replaces that flow.
- The model was trained for 10 epochs and the training script uses an 80/20 random split. The available source does not establish that split as independent of related images or provide trustworthy evaluation metrics. Do not present training accuracy or invented performance claims as clinical evidence.

## Components and data flow

```text
Browser
  ├─ sample picker ── GET /api/samples ── Flask sample catalog
  ├─ image upload ───────────────────────┐
  └─ preview + accessible result         │
                                         v
                                POST /api/predict
                                         │
                                validate image request
                                         │
                      RGB → 64×64 bicubic → float32 / 255
                                         │
                             Keras model (loaded once)
                                         │
                       class + sigmoid score + threshold
                                         v
                              JSON response to browser
```

### Application components

- **Flask app (`app.py`):** serves the page, exposes the sample catalog and prediction API, loads the model from a path relative to the app, and handles upload errors.
- **Template (`templates/index.html`):** semantic page structure, model explanation, sample chooser, upload control, preview, result region, and limitations.
- **Static assets (`static/styles.css`, `static/script.js`):** responsive visual design and interactive behavior without a frontend build system or third-party runtime dependency.
- **Model (`BrainTumor_10epoch.h5`):** existing binary classifier; no retraining or model behavior changes are part of the website build.
- **Sample scans (`pred/`):** a curated selection from the project's existing prediction images, served only through the sample route.
- **Runtime packaging (`requirements.txt`, `Procfile`, `Dockerfile`):** declare dependencies and provide conventional commands for Python hosting platforms and container hosting.

## Visitor workflow

1. The visitor reads a concise description of the model, supported image types, and educational-use limitation.
2. The visitor selects a bundled example or chooses one JPG/JPEG/PNG file. Selecting a file shows a local browser preview; the original file is not written to disk.
3. The visitor starts analysis. The browser sends the file or a whitelisted sample identifier to `POST /api/predict` and shows a busy state.
4. Flask validates the extension, image decoding, format, and size. It converts the image to RGB, resizes to 64×64 with Pillow bicubic resampling (the training script's default for RGB), and scales pixels exactly as the training code does.
5. The model runs once per request. Flask returns the class, raw sigmoid score, and threshold. The browser displays the result, score, and a reminder that model scores are not calibrated clinical confidence.
6. Errors are shown in the page in plain language. The app does not save the uploaded image; request parsing may use temporary buffering, and the app releases its decoded image when the request ends.

## API and behavior

### `GET /api/samples`

Returns a short list of curated sample IDs and image URLs. Sample IDs are an explicit allowlist; callers cannot request arbitrary filesystem paths.

### `GET /samples/<sample_id>`

Serves only a whitelisted image from `pred/` for preview. Unknown IDs return 404.

### `POST /api/predict`

Accepts either multipart field `image` (one JPG/JPEG/PNG, up to 8 MiB) or form field `sample_id` (one allowlisted example). It does not accept both at once.

Successful response:

```json
{
  "label": "Tumor detected",
  "tumor_score": 0.73,
  "threshold": 0.5,
  "model": "BrainTumor_10epoch.h5",
  "input_size": [64, 64]
}
```

`tumor_score` is the model's raw sigmoid output, formatted as a number in `[0, 1]`; it is not a calibrated probability or clinical confidence. Scores greater than or equal to 0.5 map to “Tumor detected”; scores below 0.5 map to “No tumor detected”.

Invalid/missing images return a JSON error and suitable HTTP status (400 for invalid input, 413 for oversized requests, 500 for inference failure). Error details must not expose local paths, uploaded filenames, or stack traces.

## Privacy, security, and accessibility decisions

- **No app-level persistence:** do not save visitor uploads, names, or prediction history. Flask/Werkzeug may temporarily buffer multipart request bodies in memory or a temporary file while processing; the app itself does not retain them after the request. Tell visitors not to upload identifiable information. The app does not need a database or user account.
- **Bounded inputs:** limit request body to 8 MiB, allow only expected image extensions and decoded JPEG/PNG formats, reject invalid or excessive-dimension images, and never construct a path from user input.
- **Public deployment:** do not use Flask's development server or debug mode in production. Use a production WSGI server; configure the host's port and worker limits through environment/runtime settings. Keep the model artifact present in the deployed image.
- **Accessible interaction:** use native buttons and file input, explicit labels, keyboard-operable sample selection, visible focus, high-contrast text, responsive layout, and a result/error region with `aria-live`. Avoid conveying class solely by color and respect reduced-motion preferences.
- **Medical language:** display the educational/research-only notice beside the upload and result. Do not say the model confirms or rules out a tumor; present the class as the model's output only.

## Reviewer information and model limitations

The page should state the model's input shape, normalization, binary output and threshold, dataset counts (1,510 `no`, 1,500 `yes`, as inventoried), and 10-epoch training description. Do not imply that the dataset is representative of clinical populations. Include accuracy, precision, recall, F1, sensitivity/specificity, or calibration only after they have been recomputed and documented using an appropriate held-out evaluation set. The present website build must not fabricate or infer these values from the model file.

## Build and release sequence

1. Keep the trained model and existing data in their current project folder; use paths anchored to `app.py` so launch location does not affect model discovery.
2. Replace the prototype routes with the page, sample catalog, secure image handling, preprocessing, prediction response, and JSON error handling described above.
3. Add the semantic template, responsive styles, and browser interactions for sample choice, image preview, upload, loading, results, and errors.
4. Add dependency and production launch/container files. Do not commit uploaded images or create an upload-storage directory.
5. Review model metadata and available training/evaluation artifacts; include only facts that can be supported. Future model evaluation or retraining is a separate work item.
6. Run the local app, manually exercise both demo and upload paths, and review accessibility and deployment readiness before publishing. Hosting provider selection and actual publishing remain separate decisions because no provider has been chosen.

### Local run and container commands

Run these commands from the Brain Tumour Recognition Project folder:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`. For Linux/macOS, activate the environment with `source .venv/bin/activate` instead. The site needs Python 3.11 and TensorFlow 2.15.1 for the saved Keras 2.15 model.

For a container build and local container run:

```text
docker build -t neurolens .
docker run --rm -p 8000:8000 neurolens
```

Open `http://127.0.0.1:8000`. The container installs a production WSGI server and copies the model, app, static files, template, and curated sample images. It does not package the training dataset.

## Verification checklist

- App starts from its project directory and from another working directory; the model path resolves relative to the source file.
- Sample catalog, sample preview, known sample prediction, uploaded JPG/JPEG/PNG, grayscale/RGBA conversion, and empty/invalid/unsupported/oversized uploads behave as documented.
- Valid images use RGB, 64×64 dimensions, and float32 0–1 values before inference; threshold boundary behavior is correct.
- The app does not persist uploads. Errors do not expose server paths or filenames.
- Layout works on narrow screens; all controls work by keyboard; labels, focus state, result/error announcements, contrast, and reduced-motion behavior are reviewed with accessibility tooling.
- Production instructions use a WSGI server and debug mode is disabled.
