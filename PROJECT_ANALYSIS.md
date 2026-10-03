# Brain Tumor Workspace Analysis

## Current web demo status (2026-10-03)

The first project's Flask prototype has now been rebuilt as an interactive, accessible model showcase. It uses the existing tumor model and its training input pipeline (RGB, 64×64, scaled to 0–1), accepts one JPG/JPEG/PNG image without saving uploads, and includes a curated sample picker, result display, model overview, upload validation, and deployment files. The implementation is in `Brain Tumour Recognition Project-20260930T082219Z-1-001/Brain Tumour Recognition Project/`.

The original issue list below records problems found in the initial prototype. Its Flask issues are resolved in the rebuilt app; the Streamlit project remains a separate experiment with the missing-model and dementia-workflow limitations described below. See [WEB_APP_BUILD_GUIDE.md](WEB_APP_BUILD_GUIDE.md) for the current architecture, API, privacy and accessibility choices, run instructions, and verification checklist.

## 1. Overview

This workspace contains two related but different Python projects:

1. **Brain Tumour Recognition Project**: a binary brain-tumor image-classification project. It contains the image dataset, the training script saved with an `.ipynb` extension, a trained Keras model, and the rebuilt Flask website described in the current demo status.
2. **project 1 college**: a Streamlit application intended to expose several medical prediction features. It contains a brain-tumor model, an Alzheimer's image model, and a dementia model, but the application also references additional files that are not present in this workspace.

The two projects include a duplicate brain-tumor model filename. The training code and rebuilt Flask app use `64 x 64` images; the separate Streamlit version also uses `64 x 64` images for tumor prediction. A saved neural-network model should normally be used with the same input shape and preprocessing used during training.

## 2. Complete Inventory

### 2.1 Brain Tumour Recognition Project

Path:

`Brain Tumour Recognition Project-20260930T082219Z-1-001/Brain Tumour Recognition Project/`

| File or folder | Description |
|---|---|
| `app.py` | Flask web server for uploading an image and returning a model prediction. |
| `BrainTumor_10epoch.h5` | Saved Keras/TensorFlow brain-tumor classification model. |
| `templates/index.html` | Accessible interactive model showcase and image demo. |
| `static/styles.css` | Responsive visual styling and reduced-motion behavior. |
| `static/script.js` | Sample picker, image preview, upload, prediction, and result interactions. |
| `requirements.txt`, `Procfile`, `Dockerfile` | Runtime dependencies and local/production packaging. |
| `main_train.ipynb` | Plain-text Python training script stored with an `.ipynb` extension. It is not a valid JSON Jupyter notebook in its current form. |
| `Datasets/` | Training images separated into negative and positive classes. |
| `pred/` | 60 sample/output JPG images, named from `pred0.jpg` through `pred59.jpg`. |

#### Dataset contents

| Folder | Meaning | Files | Approximate size |
|---|---|---:|---:|
| `Datasets/no/` | Images labelled as having no brain tumor; labels are encoded as `0`. | 1,510 JPG files | 25.67 MB |
| `Datasets/yes/` | Images labelled as having a brain tumor; labels are encoded as `1`. | 1,500 JPG files | 39.59 MB |

The dataset therefore contains **3,010 JPG images** in total. Example names include `no0.jpg`, `no1.jpg`, `y0.jpg`, and `y1.jpg`.

### 2.2 project 1 college

Path:

`project 1 college-20260930T082434Z-1-001/project 1 college/`

| File | Description |
|---|---|
| `app.py` | Streamlit application containing Alzheimer's, brain-tumor, and dementia UI flows, plus unused Multiple Sclerosis helper functions. |
| `ALZCLASS_40EPK.h5` | Keras/TensorFlow model loaded for four-class Alzheimer's/dementia image classification. |
| `BrainTumor_10epoch.h5` | Keras/TensorFlow brain-tumor model loaded by the Streamlit application. |
| `Brain_alz_ML.pkl` | Pickle/joblib machine-learning model referenced for the dementia workflow. |

There are no `BRAIN DEMENTIA PREDICT/` or `MULTIPLE SCLEROSIS/` folders in this workspace, even though the Streamlit code expects files inside them.

### 2.3 File-type summary

Across both projects there are:

- 2 Python files (`app.py` in each project)
- 1 JavaScript file
- 1 HTML file
- 1 training file with an `.ipynb` extension
- 3 H5 model files
- 1 PKL model file
- 3,070 JPG images: 3,010 dataset images and 60 files in `pred/`

## 3. Training Workflow

The training code in `main_train.ipynb` performs the following steps:

1. Imports OpenCV, NumPy, TensorFlow/Keras, PIL, and scikit-learn.
2. Reads files from `Datasets/no/` and `Datasets/yes/`.
3. Converts each image from OpenCV BGR format to RGB.
4. Resizes every image to `64 x 64` pixels.
5. Assigns label `0` to `no` images and label `1` to `yes` images.
6. Converts the image and label lists to NumPy arrays.
7. Splits the data into training and test sets with an 80/20 split and `random_state=0`.
8. Normalizes image pixels by dividing by `255.0`.
9. Builds a convolutional neural network:
   - three convolution and max-pooling blocks;
   - a flattened layer;
   - a dense layer with 64 units and ReLU activation;
   - dropout of `0.5`;
   - one sigmoid output unit for binary classification.
10. Compiles the model with the Adam optimizer, binary cross-entropy loss, and accuracy metric.
11. Trains for 10 epochs with batch size 16.
12. Saves the result as `BrainTumor_10epoch.h5`.

The file should be renamed to `main_train.py` if it is intended to be run as a normal Python script. If it is intended to be opened in Jupyter, it should be converted into a valid notebook JSON document first.

## 4. First Project: Flask Website

The rebuilt Flask app provides:

- `GET /`: serves the interactive page.
- `GET /api/samples`: returns the curated sample IDs and preview URLs.
- `GET /samples/<id>`: serves only allowlisted sample images from `pred/`.
- `POST /api/predict`: accepts one uploaded image or a sample ID, preprocesses it in memory, and returns the predicted class, raw sigmoid score, threshold, model filename, and input size.

Uploads are limited to 8 MiB, validated as JPG/JPEG/PNG, converted to RGB, resized to 64×64 with Pillow's bicubic resampling (matching the training script's RGB resize default), and normalized to 0–1. The Flask development server runs with debug disabled; the Procfile and Dockerfile use Gunicorn for deployment. Uploaded images are not saved by the app. See `WEB_APP_BUILD_GUIDE.md` for the request/response contract, design choices, commands, and verification checklist.

The old `Index.html` and root `script.js` prototype files have been removed; Flask serves the new template and static assets.

## 5. Second Project: Streamlit Application

The second `app.py` loads models immediately when Streamlit starts and provides a sidebar with these currently selectable pages:

- **Alzheimer's Disease Prediction**
  - Accepts a JPG or PNG image.
  - Resizes it to `224 x 224`.
  - Normalizes pixels by `255.0`.
  - Uses the four labels `Non-Demented`, `Very Mild Demented`, `Mild Demented`, and `Moderate Demented`.
  - Chooses the class with the largest model output using `argmax`.

- **Brain Tumor Prediction**
  - Accepts a JPG or PNG image.
  - Resizes it to `64 x 64`.
  - Normalizes pixels by `255.0`.
  - Compares the first model output with a threshold of `0.5`.

- **Dementia Prediction**
  - Collects age, education, socioeconomic status, MMSE, CDR, intracranial volume, normalized brain volume, atlas scaling factor, gender, and handedness.
  - The preprocessing function converts gender and handedness to numeric values and selects eight model columns.
  - In the visible UI, the final result is actually decided directly from `CDR`: values greater than `0.5` are reported as dementia, otherwise no dementia. The loaded dementia model is not called by this page.

The file also defines Multiple Sclerosis model-loading and preprocessing functions, but Multiple Sclerosis is not included in the sidebar choices. Its expected model path is missing from the workspace.

### Streamlit issues and limitations

1. Startup expects `BRAIN DEMENTIA PREDICT/Brain_alz_ML.pkl`, but that path does not exist here; the application will fail while loading models.
2. Startup expects `MULTIPLE SCLEROSIS/ryougi_shiki_model.joblib`, which is also absent.
3. The dementia UI gathers inputs but does not use the loaded dementia model for the displayed decision.
4. The Multiple Sclerosis preprocessing code adds `Unnamed: 0` but then filters it out, so that added column has no effect.
5. `pandas` is imported twice and `os` is imported but unused.
6. The image preprocessing functions do not explicitly convert images to RGB. Grayscale or RGBA uploads may produce an input shape different from the model's expected three-channel input.
7. The displayed predictions are medical screening outputs only; they are not a clinical diagnosis.

## 6. Recommended Runtime Setup

### To run the rebuilt Flask website

Install the packages in the first project's `requirements.txt` with Python 3.11, then run `python app.py` from that project directory. Open `http://127.0.0.1:5000/`. Container and Gunicorn instructions are in `WEB_APP_BUILD_GUIDE.md`.

### To run the Streamlit application after restoring missing models

Expected core packages include:

```text
streamlit
tensorflow
keras
pillow
numpy
pandas
joblib
scikit-learn
```

From the second project directory, the intended command is:

```powershell
streamlit run app.py
```

The missing dementia and Multiple Sclerosis model paths must either be restored or removed from startup before this application can launch successfully.

## 7. Overall Project Flow

```text
MRI images in Datasets/no and Datasets/yes
              |
              v
      Training code in main_train.ipynb
              |
              v
      BrainTumor_10epoch.h5
          /             \
         /               \
   Flask prototype     Streamlit app
   upload -> predict   upload -> predict
```

In summary, the main completed feature is a binary CNN classifier trained from labelled MRI images. The workspace also contains a separate, broader Streamlit application that combines several medical-model experiments. The code and model artifacts are useful for a college/demo project, but the Flask and Streamlit variants need path, endpoint, input-shape, and missing-file corrections before they can be treated as dependable runnable applications.
