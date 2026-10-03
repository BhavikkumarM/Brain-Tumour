(() => {
  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const allowedExtensions = new Set(["jpg", "jpeg", "png"]);
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

  async function loadSamples() {
    try {
      const response = await fetch("/api/samples");
      if (!response.ok) throw new Error("Could not load samples.");
      const data = await response.json();
      sampleGrid.replaceChildren();
      data.samples.forEach((sample, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sample-button";
        button.dataset.sampleId = sample.id;
        button.setAttribute("aria-label", `Use demo sample ${index + 1}`);
        button.setAttribute("aria-pressed", "false");
        const image = document.createElement("img");
        image.src = sample.url;
        image.alt = "";
        image.loading = "lazy";
        image.width = 90;
        image.height = 78;
        const number = document.createElement("span");
        number.textContent = `0${index + 1}`;
        button.append(image, number);
        button.addEventListener("click", () => {
          clearLocalPreview();
          fileInput.value = "";
          selection = { type: "sample", id: sample.id };
          setPreview(sample.url, "SAMPLE");
          resetSampleButtons(sample.id);
          analyzeButton.disabled = false;
          analyzeButton.querySelector(".button-label").textContent = "Analyze sample";
          showError("");
          clearResult();
        });
        sampleGrid.append(button);
      });
      if (data.samples.length === 0) throw new Error("No sample scans are available.");
    } catch (_error) {
      sampleGrid.innerHTML = '<p class="loading-copy">Sample scans are unavailable. You can still upload an image.</p>';
    }
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
      // Browsers that block assigning dropped files can still preview and submit
      // the retained file reference from the selection state.
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

  analyzeButton.addEventListener("click", async () => {
    if (!selection) return;
    const formData = new FormData();
    if (selection.type === "upload") formData.append("image", selection.file, selection.file.name);
    else formData.append("sample_id", selection.id);

    showError("");
    analyzeButton.disabled = true;
    setSelectionControlsDisabled(true);
    analyzeButton.querySelector(".button-label").textContent = "Analyzing…";
    previewOverlay.hidden = false;
    clearResult();
    try {
      const response = await fetch("/api/predict", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The image could not be analyzed.");
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
