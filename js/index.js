var hpBar = document.getElementById("hp-bar");
var hpText = document.querySelector(".lifecount");
var menuResponsive = document.querySelector('.menu-responsive');
var closeMenu = document.querySelector('.close-menu');
var nav = document.querySelector('nav');
var backgroundBlur = document.querySelector('.background-blur');
const portrait = document.querySelector('.portrait');

portrait.addEventListener('click', (e) => {
    hpBar.style.width = "130px";
    hpText.innerHTML = "100";
});

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