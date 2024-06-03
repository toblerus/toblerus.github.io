document.addEventListener('DOMContentLoaded', () => {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });
    const dropArea = document.getElementById('drop-area');
    const loading = document.getElementById('loading');
    const downloadLink = document.getElementById('download-link');

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
            await convertToOgg(file);
        } else {
            showError('Please drop a valid WAV file.');
        }
    });

    async function convertToOgg(file) {
        try {
            showLoading();
            await ffmpeg.load();
            ffmpeg.FS('writeFile', 'input.wav', await fetchFile(file));
            await ffmpeg.run('-i', 'input.wav', 'output.ogg');

            const data = ffmpeg.FS('readFile', 'output.ogg');
            const oggBlob = new Blob([data.buffer], { type: 'audio/ogg' });
            const url = URL.createObjectURL(oggBlob);

            downloadLink.href = url;
            downloadLink.download = 'output.ogg';
            downloadLink.style.display = 'block';

            showSuccess('Conversion successful!');
        } catch (error) {
            showError('Error during conversion: ' + error.message);
        }
    }

    function showLoading() {
        dropArea.style.display = 'none';
        loading.style.display = 'flex';
        dropArea.classList.remove('error', 'success');
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
});
