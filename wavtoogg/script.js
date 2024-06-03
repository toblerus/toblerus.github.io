document.addEventListener('DOMContentLoaded', () => {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });
    const dropArea = document.getElementById('drop-area');
    const loading = document.getElementById('loading');
    const downloadLink = document.getElementById('download-link');
    const progressBar = document.getElementById('progress');
    let isFFmpegLoaded = false;

    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.style.backgroundColor = '#e0e0e0';
    });

    dropArea.addEventListener('dragleave', (event) => {
        event.preventDefault();
        dropArea.style.backgroundColor = 'white';
    });

    dropArea.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropArea.style.backgroundColor = 'white';

        const file = event.dataTransfer.files[0];
        if (file && file.type === 'audio/wav') {
            if (!isFFmpegLoaded) {
                await loadFFmpeg();
                isFFmpegLoaded = true;
            }
            await convertToOgg(file);
        } else {
            showError('Please drop a valid WAV file.');
        }
    });

    async function loadFFmpeg() {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }
    }

    async function convertToOgg(file) {
        try {
            showLoading();
            ffmpeg.FS('writeFile', 'input.wav', await fetchFile(file));

            ffmpeg.setProgress(({ ratio }) => {
                const targetProgress = Math.min(ratio, 0.99); 
                const currentProgress = progressBar.value;
                progressBar.value = lerp(currentProgress, targetProgress, 0.1);
            });

            await ffmpeg.run('-i', 'input.wav', 'output.ogg');

            const data = ffmpeg.FS('readFile', 'output.ogg');
            const oggBlob = new Blob([data.buffer], { type: 'audio/ogg' });
            const url = URL.createObjectURL(oggBlob);

            const originalFilename = file.name.split('.').slice(0, -1).join('.');
            downloadLink.href = url;
            downloadLink.download = `${originalFilename}_ogg.ogg`;
            downloadLink.style.display = 'block';

            setTimeout(() => {
                showSuccess('Conversion successful!');
            }, 500);
        } catch (error) {
            showError('Error during conversion: ' + error.message);
        }
    }

    function showLoading() {
        dropArea.innerHTML = '<p>Converting...</p>';
        dropArea.className = '';
        loading.style.display = 'flex';
        dropArea.style.display = 'none';
        downloadLink.style.display = 'none';
        progressBar.value = 0;
    }

    function showSuccess(message) {
        loading.style.display = 'none';
        dropArea.style.display = 'flex';
        dropArea.className = 'success';
        dropArea.innerHTML = `<p>${message}</p>`;
    }

    function showError(message) {
        loading.style.display = 'none';
        dropArea.style.display = 'flex';
        dropArea.className = 'error';
        dropArea.innerHTML = `<p>${message}</p>`;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
});
