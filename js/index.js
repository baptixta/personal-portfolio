// Inicializa todos os eventos da página (chamado no load e após cada transição Swup)
function initPage() {
    // HP Bar
    var hpFill = document.getElementById('hpBar-fill');
    var hpLabel = document.getElementById('hpBar-label');

    // Restaura HP do sessionStorage para manter estado entre páginas
    var currentValue = parseInt(sessionStorage.getItem('hp') ?? '100');
    var maxValue = 100;

    function setHP(value) {
        currentValue = Math.max(0, value);
        sessionStorage.setItem('hp', currentValue);
        var pct = (currentValue / maxValue) * 100;
        if (hpFill) hpFill.style.width = pct + '%';
        if (hpLabel) hpLabel.textContent = pct + '%';

        var portrait = document.querySelector('.portrait');
        var gameSecret = document.querySelector('.game-secret');
        if (currentValue <= 0) {
            if (portrait) {
                portrait.classList.add('blurred');
                portrait.style.pointerEvents = 'none';
            }
            if (gameSecret) gameSecret.classList.add('game-unlock');
        } else {
            if (portrait) {
                portrait.classList.remove('blurred');
                portrait.style.pointerEvents = '';
            }
            if (gameSecret) gameSecret.classList.remove('game-unlock');
        }
    }

    // Aplica HP atual ao carregar a página
    setHP(currentValue);

    // Clique na foto
    var portrait = document.querySelector('.portrait');
    var gameSecret = document.querySelector('.game-secret');

    if (portrait) {
        portrait.addEventListener('click', () => {
            setHP(currentValue - 25);
        });
    }

    // Clique no ícone de easter egg
    if (gameSecret) {
        gameSecret.addEventListener('click', () => {
            window.location = "/pages/easter-egg.html";
        });
    }

    // Sistema bilíngue
    updateLanguage();
}

/* Menu Responsivo — fica fora do #swup (na nav), não precisa reiniciar */
var menuResponsive = document.querySelector('.menu-responsive');
var closeMenu = document.querySelector('.close-menu');
var nav = document.querySelector('nav');
var backgroundBlur = document.querySelector('.background-blur');

if (menuResponsive) {
    menuResponsive.addEventListener('click', () => {
        nav.style.left = "0px";
        backgroundBlur.style.opacity = ".8";
        backgroundBlur.style.pointerEvents = "auto";
    });
}

if (closeMenu) {
    closeMenu.addEventListener('click', () => {
        nav.style.left = "-250px";
        backgroundBlur.style.opacity = "0";
        backgroundBlur.style.pointerEvents = "none";
    });
}

// Sistema bilíngue
function setLanguage(lang) {
    localStorage.setItem('preferredLanguage', lang);
    updateLanguage();
}

function updateLanguage() {
    const lang = localStorage.getItem('preferredLanguage') || 'pt';
    document.querySelectorAll('.lang').forEach(el => el.style.display = 'none');
    document.querySelectorAll(`.lang-${lang}`).forEach(el => el.style.display = 'block');
    const btnPt = document.getElementById('btn-pt');
    const btnEn = document.getElementById('btn-en');
    if (btnPt) btnPt.classList.remove('language-selected');
    if (btnEn) btnEn.classList.remove('language-selected');
    const active = document.getElementById(`btn-${lang}`);
    if (active) active.classList.add('language-selected');
}

// Inicializa na primeira carga
document.addEventListener('DOMContentLoaded', initPage);

// Reinicializa após cada troca de página do Swup
document.addEventListener('swup:page:view', initPage);