document.addEventListener('DOMContentLoaded', () => {
    // Generate Stars Background
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3 + 1}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.animationDuration = `${Math.random() * 3 + 2}s`;
        starsContainer.appendChild(star);
    }

    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    // Sections
    const uploadSection = document.getElementById('upload-section');
    const actionSection = document.getElementById('action-section');
    const resultSection = document.getElementById('result-section');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Action elements
    const previewImage = document.getElementById('preview-image');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const removeBtn = document.getElementById('remove-btn');
    const convertBtn = document.getElementById('convert-btn');
    const convertAnotherBtn = document.getElementById('convert-another-btn');
    const downloadLink = document.getElementById('download-link');

    let currentFile = null;

    // Helper: format bytes
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    // Show appropriate section
    const showSection = (sectionName) => {
        uploadSection.classList.add('hidden');
        actionSection.classList.add('hidden');
        resultSection.classList.add('hidden');

        if (sectionName === 'upload') uploadSection.classList.remove('hidden');
        if (sectionName === 'action') actionSection.classList.remove('hidden');
        if (sectionName === 'result') resultSection.classList.remove('hidden');
    };

    // Handle file selection
    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            alert('File size exceeds 20MB limit.');
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            showSection('action');
        };
        reader.readAsDataURL(file);
    };

    // Drag and Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) handleFile(files[0]);
    }, false);

    // Input change event
    fileInput.addEventListener('change', function () {
        if (this.files.length > 0) handleFile(this.files[0]);
    });

    // Remove file
    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        showSection('upload');
    });

    // Convert Another
    convertAnotherBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        showSection('upload');
    });

    // Handle Conversion
    convertBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        const selectedFormat = document.getElementById('format-select').value;
        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('format', selectedFormat);

        try {
            loadingOverlay.classList.remove('hidden');

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Conversion failed');
            }

            // Set up download link
            const oldName = currentFile.name;
            const nameWithoutExt = oldName.substring(0, oldName.lastIndexOf('.')) || oldName;

            downloadLink.href = result.data;
            downloadLink.download = `${nameWithoutExt}-converted.${result.format}`;

            showSection('result');

        } catch (error) {
            console.error('Error:', error);
            alert(`Conversion error: ${error.message}`);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });
});
