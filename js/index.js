var menuResponsive = document.querySelector('.menu-responsive');
var closeMenu = document.querySelector('.close-menu');
var nav = document.querySelector('nav');
var backgroundBlur = document.querySelector('.background-blur');
const portrait = document.querySelector('.portrait');
const gameSecret = document.querySelector('.game-secret');
var currentValue = 100;

/* loadingbar.js feito por js */

var bar1 = new ldBar("#hpBar");
/* ldBar stored in the element */
var bar2 = document.getElementById('hpBar').ldBar;
bar1.set(currentValue);

/* Interação com HP */

portrait.addEventListener('click', (e) => {
    bar1.set(currentValue-= 25);

    if (currentValue == 0) {
        console.log('oi')
        portrait.classList.add('blurred');
        gameSecret.classList.add('game-unlock')
    }
});

/* abrir página secreta */

gameSecret.addEventListener('click', (e) => {
    window.location = "../pages/easter-egg.html"
});

/* Menu Reponsivo */

menuResponsive.addEventListener('click', (e) => {
    nav.style.left = "0px";
    backgroundBlur.style.opacity = ".8";
    backgroundBlur.style.pointerEvents = "auto";
});

closeMenu.addEventListener('click', (e) => {
    nav.style.left = "-250px";
    backgroundBlur.style.opacity = "0";
    backgroundBlur.style.pointerEvents = "none";
})


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

  // Atualiza estilo dos botões
  document.getElementById('btn-pt').classList.remove('language-selected');
  document.getElementById('btn-en').classList.remove('language-selected');
  document.getElementById(`btn-${lang}`).classList.add('language-selected');
}

// Executa ao carregar
document.addEventListener('DOMContentLoaded', updateLanguage);