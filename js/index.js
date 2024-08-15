var hpBar = document.getElementById("hp-bar");
var hpText = document.querySelector(".lifecount");
const portrait = document.querySelector('.portrait');

portrait.addEventListener('click', (e) => {
    hpBar.style.width = "130px";
    hpText.innerHTML = "100";
});