var menuResponsive = document.querySelector('.menu-responsive');
var closeMenu = document.querySelector('.close-menu');
var nav = document.querySelector('nav');
var backgroundBlur = document.querySelector('.background-blur');
const portrait = document.querySelector('.portrait');
const gameSecret = document.querySelector('.game-secret');

// HP Bar
var currentValue = 100;
var maxValue = 100;
var hpFill = document.getElementById('hpBar-fill');
var hpLabel = document.getElementById('hpBar-label');

function setHP(value) {
    currentValue = Math.max(0, value);
    var pct = (currentValue / maxValue) * 100;
    hpFill.style.width = pct + '%';
    hpLabel.textContent = pct + '%';

    if (currentValue <= 0) {
        portrait.classList.add('blurred');
        portrait.style.pointerEvents = 'none';
        gameSecret.classList.add('game-unlock');
    }
}

portrait.addEventListener('click', () => {
    setHP(currentValue - 25);
});

/* Menu Responsivo */

menuResponsive.addEventListener('click', () => {
    nav.style.left = "0px";
    backgroundBlur.style.opacity = ".8";
    backgroundBlur.style.pointerEvents = "auto";
});

closeMenu.addEventListener('click', () => {
    nav.style.left = "-250px";
    backgroundBlur.style.opacity = "0";
    backgroundBlur.style.pointerEvents = "none";
});

/* abrir página secreta */
gameSecret.addEventListener('click', () => {
    window.location = "../pages/easter-egg.html";
});

// sistema bilíngue no site
function setLanguage(lang) {
    localStorage.setItem('preferredLanguage', lang);
    updateLanguage();
}

function updateLanguage() {
    const lang = localStorage.getItem('preferredLanguage') || 'pt';

    document.querySelectorAll('.lang').forEach(el => {
        el.style.display = 'none';
    });

    document.querySelectorAll(`.lang-${lang}`).forEach(el => {
        el.style.display = 'block';
    });

    document.getElementById('btn-pt').classList.remove('language-selected');
    document.getElementById('btn-en').classList.remove('language-selected');
    document.getElementById(`btn-${lang}`).classList.add('language-selected');
}

document.addEventListener('DOMContentLoaded', updateLanguage);