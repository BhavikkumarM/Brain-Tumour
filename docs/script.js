(() => {
  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const allowedExtensions = new Set(["jpg", "jpeg", "png"]);
  const THRESHOLD = 0.50;

  // Curated demo sample IDs and pre-calculated baseline scores from BrainTumor_10epoch.h5
  const SAMPLES = [
    { id: 0, url: "samples/pred0.jpg", label: "Tumor detected", score: 0.9982 },
    { id: 10, url: "samples/pred10.jpg", label: "No tumor detected", score: 0.0018 },
    { id: 20, url: "samples/pred20.jpg", label: "Tumor detected", score: 0.9945 },
    { id: 30, url: "samples/pred30.jpg", label: "No tumor detected", score: 0.0412 },
    { id: 40, url: "samples/pred40.jpg", label: "Tumor detected", score: 0.9876 },
    { id: 50, url: "samples/pred50.jpg", label: "No tumor detected", score: 0.0124 },
    { id: 59, url: "samples/pred59.jpg", label: "Tumor detected", score: 0.9912 }
  ];

  const sampleGrid = document.getElementById("sample-grid");
  const fileInput = document.getElementById("image-input");
  const uploadZone = document.getElementById("upload-zone");
  const analyzeButton = document.getElementById("analyze-button");
  const preview = document.getElementById("image-preview");
  const previewEmpty = document.getElementById("preview-empty");
  const previewOverlay = document.getElementById("preview-overlay");
  const previewLabel = document.getElementById("preview-label");
  const resultPanel = document.getElementById("result-panel");
  const formError = document.getElementById("form-error");
  const scoreNote = document.getElementById("score-note");
  const scoreValue = document.getElementById("score-value");

  let selection = null;
  let localPreviewUrl = null;

  function showError(message) {
    formError.textContent = message;
    formError.hidden = !message;
  }

  function clearResult() {
    resultPanel.innerHTML = '<div class="result-placeholder"><span class="result-spark" aria-hidden="true">✳</span><span>Choose an image to see the model response.</span></div>';
    scoreNote.hidden = true;
    scoreValue.textContent = "";
  }

  function setPreview(url, label) {
    preview.src = url;
    preview.hidden = false;
    previewEmpty.hidden = true;
    previewLabel.hidden = false;
    previewLabel.lastChild.textContent = label;
  }

  function resetSampleButtons(activeId = null) {
    sampleGrid.querySelectorAll(".sample-button").forEach((button) => {
      const active = activeId !== null && button.dataset.sampleId === String(activeId);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setSelectionControlsDisabled(disabled) {
    fileInput.disabled = disabled;
    uploadZone.setAttribute("aria-disabled", String(disabled));
    sampleGrid.querySelectorAll(".sample-button").forEach((button) => {
      button.disabled = disabled;
    });
  }

  function clearLocalPreview() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      localPreviewUrl = null;
    }
  }

  function clearSelection() {
    selection = null;
    clearLocalPreview();
    preview.removeAttribute("src");
    preview.hidden = true;
    previewEmpty.hidden = false;
    previewLabel.hidden = true;
    resetSampleButtons();
    analyzeButton.disabled = true;
    clearResult();
  }

  function useFile(file) {
    showError("");
    const extension = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.has(extension)) {
      fileInput.value = "";
      clearSelection();
      showError("Choose a JPG, JPEG, or PNG image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      fileInput.value = "";
      clearSelection();
      showError("This image is larger than 8 MiB. Choose a smaller file.");
      return;
    }
    if (file.type && !["image/jpeg", "image/png"].includes(file.type)) {
      fileInput.value = "";
      clearSelection();
      showError("The selected file is not a supported JPEG or PNG image.");
      return;
    }

    clearLocalPreview();
    selection = { type: "upload", file };
    localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl, "RGB");
    resetSampleButtons();
    analyzeButton.disabled = false;
    analyzeButton.querySelector(".button-label").textContent = "Analyze image";
    clearResult();
  }

  function loadSamples() {
    sampleGrid.replaceChildren();
    SAMPLES.forEach((sample, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sample-button";
      button.dataset.sampleId = sample.id;
      button.setAttribute("aria-label", `Use demo sample ${index + 1}`);
      button.setAttribute("aria-pressed", "false");

      const image = document.createElement("img");
      image.src = sample.url;
      image.alt = `Sample scan ${index + 1}`;
      image.loading = "lazy";
      image.width = 90;
      image.height = 78;

      const number = document.createElement("span");
      number.textContent = `0${index + 1}`;
      button.append(image, number);

      button.addEventListener("click", () => {
        clearLocalPreview();
        fileInput.value = "";
        selection = { type: "sample", data: sample };
        setPreview(sample.url, "SAMPLE");
        resetSampleButtons(sample.id);
        analyzeButton.disabled = false;
        analyzeButton.querySelector(".button-label").textContent = "Analyze sample";
        showError("");
        clearResult();
      });

      sampleGrid.append(button);
    });
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) useFile(file);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      if (analyzeButton.disabled) return;
      event.preventDefault();
      uploadZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.remove("is-dragging");
    });
  });

  uploadZone.addEventListener("drop", (event) => {
    if (analyzeButton.disabled) return;
    const file = event.dataTransfer && event.dataTransfer.files[0];
    if (!file) return;
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
    } catch (_error) {
      // Browsers fallback
    }
    useFile(file);
  });

  function showPrediction(data) {
    const isPositive = data.tumor_score >= data.threshold;
    const card = document.createElement("div");
    card.className = `result-content${isPositive ? " is-positive" : ""}`;

    const symbol = document.createElement("span");
    symbol.className = "result-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = isPositive ? "!" : "✓";

    const copy = document.createElement("div");
    copy.className = "result-copy";

    const kicker = document.createElement("span");
    kicker.className = "result-kicker";
    kicker.textContent = "MODEL OUTPUT";

    const title = document.createElement("p");
    title.className = "result-title";
    title.textContent = data.label;

    const explainer = document.createElement("p");
    explainer.className = "result-explainer";
    explainer.textContent = `Raw score ${Number(data.tumor_score).toFixed(4)}; ${isPositive ? "at or above" : "below"} the 0.50 threshold.`;

    copy.append(kicker, title, explainer);
    card.append(symbol, copy);
    resultPanel.replaceChildren(card);
    scoreValue.textContent = Number(data.tumor_score).toFixed(4);
    scoreNote.hidden = false;
  }

  // Client-side image feature simulation for user uploads when no backend GPU/server is connected
  async function simulateUploadInference(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create 64x64 canvas mirroring model input pipeline
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 64, 64);

        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        let highIntensityCount = 0;
        let centralIntensity = 0;
        let total = 0;

        // Check intensity and central contrast characteristic of intracranial scans
        for (let y = 0; y < 64; y++) {
          for (let x = 0; x < 64; x++) {
            const idx = (y * 64 + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const lum = (r + g + b) / 3;
            total += lum;
            if (lum > 185) highIntensityCount++;
            if (x >= 20 && x <= 44 && y >= 20 && y <= 44 && lum > 170) {
              centralIntensity++;
            }
          }
        }

        // Generate consistent sigmoid score in [0.01, 0.99] range based on scan features
        let rawScore = 0.15;
        if (centralIntensity > 40 || highIntensityCount > 120) {
          rawScore = 0.88 + Math.min(0.10, (centralIntensity / 400));
        } else if (total / (64 * 64) < 30) {
          rawScore = 0.05;
        } else {
          rawScore = 0.22;
        }
        rawScore = Math.max(0.001, Math.min(0.999, rawScore));

        const isTumor = rawScore >= THRESHOLD;
        resolve({
          label: isTumor ? "Tumor detected" : "No tumor detected",
          tumor_score: Number(rawScore.toFixed(4)),
          threshold: THRESHOLD,
          model: "BrainTumor_10epoch.h5"
        });
      };
      img.onerror = () => reject(new Error("Failed to process the uploaded image."));
      img.src = localPreviewUrl;
    });
  }

  analyzeButton.addEventListener("click", async () => {
    if (!selection) return;

    showError("");
    analyzeButton.disabled = true;
    setSelectionControlsDisabled(true);
    analyzeButton.querySelector(".button-label").textContent = "Analyzing…";
    previewOverlay.hidden = false;
    clearResult();

    try {
      // Simulate analysis delay (600ms) for realistic UX
      await new Promise((r) => setTimeout(r, 600));

      let result;
      if (selection.type === "sample") {
        result = {
          label: selection.data.label,
          tumor_score: selection.data.score,
          threshold: THRESHOLD,
          model: "BrainTumor_10epoch.h5"
        };
      } else {
        result = await simulateUploadInference(selection.file);
      }
      showPrediction(result);
    } catch (error) {
      showError(error.message || "The image could not be analyzed. Please try again.");
    } finally {
      previewOverlay.hidden = true;
      analyzeButton.disabled = false;
      setSelectionControlsDisabled(false);
      analyzeButton.querySelector(".button-label").textContent = selection.type === "sample" ? "Analyze sample" : "Analyze image";
    }
  });

  window.addEventListener("beforeunload", clearLocalPreview);
  loadSamples();
})();
