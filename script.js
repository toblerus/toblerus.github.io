let games = [];
let currentFullscreenGameIndex = null;
let currentFullscreenImageIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    const gameFolders = [
        'Assets/Jack',
        'Assets/ClumsyMechanic',
        'Assets/TileSwap',
        'Assets/CiRCLE',
        'Assets/Bones&Arrows'
    ];

    const grid = document.getElementById('gameGrid');

    Promise.all(
        gameFolders.map(folder =>
            fetch(`${folder}/description.json`)
                .then(res => res.json())
                .then(data => {
                    data.folder = folder;
                    return data;
                })
                .catch(err => {
                    console.error(`Failed to load ${folder}/description.json`, err);
                    return null;
                })
        )
    ).then(results => {
        games = results.filter(g => g !== null);
        renderGameGrid(games, grid);
    });

    function renderGameGrid(games, grid) {
        games.forEach((game, index) => {
            const div = document.createElement('div');
            div.className = 'tile';
            div.onclick = () => openOverlay(index);

            const thumbPath = `${game.folder}/thumb.png`;

            div.innerHTML = `
        <img src="${thumbPath}" alt="${game.title || 'Game'}">
        <div class="tile-title">${game.title || 'Untitled'}</div>
      `;

            grid.appendChild(div);
        });
    }

    window.openOverlay = function (index) {
        document.body.classList.add('modal-open');
        const game = games[index];
        const overlay = document.getElementById('overlay');
        const content = document.getElementById('overlayContent');

        const title = game.title || 'Untitled';
        const description = game.description ? `<div class="overlay-description">${game.description}</div>` : '';
        const images = Array.isArray(game.images)
            ? game.images.map(img => `<img src="${game.folder}/${img}" alt="" onclick="openFullscreen('${game.folder}/${img}')">`).join('')
            : '';
        const imageBlock = images ? `<div class="images">${images}</div>` : '';
        const linkBlock = game.link ? `<div class="overlay-button"><a href="${game.link}" target="_blank">Take a look</a></div>` : '';

        content.innerHTML = `
          <div class="scrollable-content">
            <h2>${title}</h2>
            ${description}
            ${imageBlock}
            ${linkBlock}
          </div>
        `;

        overlay.style.display = 'flex';
    };
});


function openOverlay(index) {
    const game = games[index];
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlayContent');

    const title = game.title || 'Untitled';
    const description = game.description ? `<div class="overlay-description">${game.description}</div>` : '';
    const images = Array.isArray(game.images) ? game.images.map(img => `<img src="${game.folder}/${img}" alt="" onclick="openFullscreen('${game.folder}/${img}')">`).join('') : '';
    const imageBlock = images ? `<div class="images">${images}</div>` : '';
    const linkBlock = game.link ? `<div class="overlay-button"><a href="${game.link}" target="_blank">Take a look</a></div>` : '';

    content.innerHTML = `
    <h2>${title}</h2>
    ${description}
    ${imageBlock}
    ${linkBlock}
  `;

    overlay.style.display = 'flex';
}

function closeOverlay() {
    document.body.classList.remove('modal-open');
    document.getElementById('overlay').style.display = 'none';
}

function handleOverlayClick(event) {
    const content = document.getElementById('overlayContent');
    if (!content.contains(event.target)) {
        closeOverlay();
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    const icon = document.querySelector('.theme-toggle button i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function openFullscreen(src) {
    const fullscreen = document.getElementById('fullscreenImage');
    const img = document.getElementById('fullscreenImg');
    fullscreen.style.display = 'flex';
    img.src = src;

    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        const index = game.images?.findIndex(imgPath => `${game.folder}/${imgPath}` === src);
        if (index !== -1) {
            currentFullscreenGameIndex = i;
            currentFullscreenImageIndex = index;
            break;
        }
    }
}

function navigateFullscreen(direction) {
    const game = games[currentFullscreenGameIndex];
    if (!game || !Array.isArray(game.images)) return;

    currentFullscreenImageIndex += direction;
    if (currentFullscreenImageIndex < 0) currentFullscreenImageIndex = game.images.length - 1;
    if (currentFullscreenImageIndex >= game.images.length) currentFullscreenImageIndex = 0;

    const newSrc = `${game.folder}/${game.images[currentFullscreenImageIndex]}`;
    document.getElementById('fullscreenImg').src = newSrc;
}

function applyStoredTheme() {
    const icon = document.querySelector('.theme-toggle button i');
    const isDark = document.documentElement.classList.contains('dark-mode');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    requestAnimationFrame(() => {
        document.body.classList.remove('preload');
    });
}

window.openOverlay = openOverlay;
window.closeOverlay = closeOverlay;
window.toggleTheme = toggleTheme;
window.handleOverlayClick = handleOverlayClick;
window.openFullscreen = openFullscreen;
window.applyStoredTheme = applyStoredTheme;

document.addEventListener('keydown', (e) => {
    const fullscreen = document.getElementById('fullscreenImage');
    if (fullscreen.style.display !== 'flex') return;

    if (e.key === 'ArrowLeft') {
        navigateFullscreen(-1);
    } else if (e.key === 'ArrowRight') {
        navigateFullscreen(1);
    } else if (e.key === 'Escape') {
        fullscreen.style.display = 'none';
    }
});

document.getElementById('fullscreenImage').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        e.currentTarget.style.display = 'none';
    }
});

