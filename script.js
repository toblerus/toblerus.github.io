let games = [];
let currentFullscreenGameIndex = null;
let currentFullscreenImageIndex = null;

let featuredSelection = [
    'Assets/IdleBankTycoon',
	'Assets/Golfling',
    'Assets/MarketCraze',
    'Assets/BooloneyBandits',
    'Assets/Jack',
];

function isTimelinePage() {
    return location.pathname.endsWith('timeline.html');
}

function isHomePage() {
    return location.pathname.endsWith('/') || location.pathname.endsWith('index.html');
}

let carouselState = { index: 0, dragging: false, dragStartX: 0, dragDelta: 0, timer: null, items: [] };

function setupCarousel() {
    const container = document.getElementById('featuredCarousel');
    if (!container) return;
    const selectedGames = games.filter(g => featuredSelection.includes(g.folder)).slice(0,5);
    container.innerHTML = '';
    carouselState.items = selectedGames;
    selectedGames.forEach((game, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'item';
        wrapper.dataset.idx = i;
        const div = document.createElement('div');
        div.className = 'tile';
        div.onclick = () => openOverlay(findGameIndex(game.folder));
        const thumbPath = `${game.folder}/thumb.png`;
        div.innerHTML = `<img src="${thumbPath}" alt="${game.title || 'Game'}"><div class="tile-title">${game.title || 'Untitled'}</div>`;
        wrapper.appendChild(div);
        container.appendChild(wrapper);
    });
    positionCarousel();
    container.addEventListener('pointerdown', onCarouselPointerDown, {passive: true});
    window.addEventListener('pointermove', onCarouselPointerMove, {passive: true});
    window.addEventListener('pointerup', onCarouselPointerUp, {passive: true});
    container.addEventListener('mouseenter', pauseCarousel);
    container.addEventListener('mouseleave', resumeCarousel);
    resumeCarousel();
}

function findGameIndex(folder) {
    for (var i = 0; i < games.length; i++) if (games[i].folder === folder) return i;
    return -1;
}

function positionCarousel() {
    const container = document.getElementById('featuredCarousel');
    if (!container) return;
    const N = carouselState.items.length;
    for (var i = 0; i < N; i++) {
        const rel = ((i - carouselState.index) + N) % N;
        const pos = rel <= 2 ? rel : rel - N;
        const el = container.children[i];
        const offset = pos * 220;
        const scale = pos === 0 ? 1.0 : pos === -1 || pos === 1 ? 0.8 : 0.6;
        const opacity = pos === 0 ? 1 : pos === -1 || pos === 1 ? 0.65 : 0.3;
        const rotate = pos * -6;
        const z = pos === 0 ? 5 : pos === -1 || pos === 1 ? 4 : 3;
        el.style.transform = `translateX(calc(-50% + ${offset + carouselState.dragDelta}px)) scale(${scale}) rotate(${rotate}deg)`;
        el.style.opacity = opacity;
        el.style.zIndex = z;
        el.style.filter = pos === 0 ? 'none' : 'saturate(0.8) blur(0.2px)';
    }
}

function stepCarousel(dir) {
    carouselState.index = (carouselState.index + dir + carouselState.items.length) % carouselState.items.length;
    positionCarousel();
}

function onCarouselPointerDown(e) {
    carouselState.dragging = true;
    carouselState.dragStartX = e.clientX;
    carouselState.dragDelta = 0;
    pauseCarousel();
}

function onCarouselPointerMove(e) {
    if (!carouselState.dragging) return;
    carouselState.dragDelta = e.clientX - carouselState.dragStartX;
    positionCarousel();
}

function onCarouselPointerUp(e) {
    if (!carouselState.dragging) return;
    const dx = e.clientX - carouselState.dragStartX;
    carouselState.dragging = false;
    carouselState.dragStartX = 0;
    if (Math.abs(dx) > 60) {
        stepCarousel(dx < 0 ? 1 : -1);
    }
    carouselState.dragDelta = 0;
    positionCarousel();
    resumeCarousel();
}

function pauseCarousel() {
    if (carouselState.timer) {
        clearInterval(carouselState.timer);
        carouselState.timer = null;
    }
}

function resumeCarousel() {
    pauseCarousel();
    carouselState.timer = setInterval(() => stepCarousel(1), 4000);
}

function buildTimeline() {
    const content = document.getElementById('timelineContent');
    if (!content) return;
    const yearMap = {};
    games.forEach(g => {
        var year = 0;
        if (g.description) {
            var m = g.description.match(/20\d{2}/g);
            if (m && m.length) year = parseInt(m[0], 10);
        }
        if (!year) year = 2025;
        if (!yearMap[year]) yearMap[year] = [];
        yearMap[year].push(g);
    });
    const years = Object.keys(yearMap).map(x => parseInt(x,10)).sort((a,b)=>b-a);
    const yearList = document.getElementById('timelineYearList');
    yearList.innerHTML = '';
    years.forEach(y => {
        var li = document.createElement('li');
        li.textContent = y.toString();
        li.onclick = () => {
            var sec = document.getElementById('year-'+y);
            if (sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
        };
        yearList.appendChild(li);
    });
    content.innerHTML = '';
    years.forEach(y => {
        var section = document.createElement('section');
        section.className = 'timeline-section';
        section.id = 'year-'+y;
        var h2 = document.createElement('h2');
        h2.textContent = y.toString();
        section.appendChild(h2);
        var grid = document.createElement('div');
        grid.className = 'grid';
        yearMap[y].forEach(g => {
            var div = document.createElement('div');
            div.className = 'tile';
            div.onclick = () => openOverlay(findGameIndex(g.folder));
            var thumbPath = `${g.folder}/thumb.png`;
            div.innerHTML = `<img src="${thumbPath}" alt="${g.title || 'Game'}"><div class="tile-title">${g.title || 'Untitled'}</div>`;
            grid.appendChild(div);
        });
        section.appendChild(grid);
        content.appendChild(section);
    });
    const currentEl = document.getElementById('timelineCurrentYear');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                var y = entry.target.id.replace('year-','');
                currentEl.textContent = y;
                Array.from(yearList.children).forEach(li => li.classList.toggle('active', li.textContent === y));
            }
        });
    }, {root: null, rootMargin: '-40% 0px -60% 0px', threshold: 0});
    years.forEach(y => {
        var sec = document.getElementById('year-'+y);
        if (sec) obs.observe(sec);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const gameFolders = [
        'Assets/IdleBankTycoon',
        'Assets/Jack',
        'Assets/BooloneyBandits',
        'Assets/DoYouRemember',
        'Assets/Clanzy',
        'Assets/Golfling',
        'Assets/BadToTheRoots',
        'Assets/MarketCraze',
        'Assets/Dualitime',
        'Assets/IdleWitch',
        'Assets/ClumsyMechanic',
        'Assets/TileSwap',
        'Assets/AmazingUFOGame',
        'Assets/CiRCLE',
        'Assets/Bones&Arrows'
    ];

    Promise.all(
        gameFolders.map(folder =>
            fetch(`${folder}/description.json`)
                .then(res => res.json())
                .then(data => {
                    data.folder = folder;
                    return data;
                })
                .catch(err => {
                    return null;
                })
        )
    ).then(results => {
        games = results.filter(g => g !== null);

        games.forEach(game => {
            if (Array.isArray(game.images)) {
                game.images.forEach(img => {
                    const fullPath = `${game.folder}/${img}`;
                    const preloadImg = new Image();
                    preloadImg.src = fullPath;
                });
            }
        });

        const grid = document.getElementById('gameGrid');
        if (grid) {
            grid.innerHTML = '';
            games.forEach((game, index) => {
                const div = document.createElement('div');
                div.className = 'tile';
                div.onclick = () => openOverlay(index);
                const thumbPath = `${game.folder}/thumb.png`;
                div.innerHTML = `<img src="${thumbPath}" alt="${game.title || 'Game'}"><div class="tile-title">${game.title || 'Untitled'}</div>`;
                grid.appendChild(div);
            });
        }

        if (isHomePage()) {
            setupCarousel();
            var gridEl = document.getElementById('gameGrid');
            if (gridEl) gridEl.style.display = 'none';
        }
        if (isTimelinePage()) {
            buildTimeline();
        }
    });
});

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
    <h2>${title}</h2>
    ${description}
    ${imageBlock}
    ${linkBlock}
  `;

    overlay.style.display = 'flex';
};

function closeOverlay() {
    document.body.classList.remove('modal-open');
    document.getElementById('overlay').style.display = 'none';
}

function handleOverlayClick(e) {
    if (e.target.id === 'overlay') {
        closeOverlay();
    }
}

function openFullscreen(src) {
    const fullscreen = document.getElementById('fullscreenImage');
    const img = document.getElementById('fullscreenImg');
    img.src = src;

    currentFullscreenGameIndex = games.findIndex(g => Array.isArray(g.images) && g.images.some(i => `${g.folder}/${i}` === src));
    if (currentFullscreenGameIndex !== -1) {
        const currentGame = games[currentFullscreenGameIndex];
        currentFullscreenImageIndex = currentGame.images.findIndex(i => `${currentGame.folder}/${i}` === src);
    }

    fullscreen.style.display = 'flex';
}

function navigateFullscreen(direction) {
    if (currentFullscreenGameIndex === null || currentFullscreenImageIndex === null) return;

    const game = games[currentFullscreenGameIndex];
    if (!Array.isArray(game.images) || game.images.length === 0) return;

    currentFullscreenImageIndex = (currentFullscreenImageIndex + direction + game.images.length) % game.images.length;
    const nextSrc = `${game.folder}/${game.images[currentFullscreenImageIndex]}`;
    document.getElementById('fullscreenImg').src = nextSrc;
}

document.addEventListener('keydown', (e) => {
    const fullscreen = document.getElementById('fullscreenImage');
    if (fullscreen.style.display === 'flex') {
        if (e.key === 'ArrowLeft') {
            navigateFullscreen(-1);
        } else if (e.key === 'ArrowRight') {
            navigateFullscreen(1);
        } else if (e.key === 'Escape') {
            fullscreen.style.display = 'none';
        }
    }
});

document.getElementById('fullscreenImage').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        e.currentTarget.style.display = 'none';
    }
});
