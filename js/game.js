const gd = document.querySelector('.gd');
const gdPointsText = document.querySelector('.points-all')
let gdPoints = 0;
let gdPoints = 0;

const upgradeEscrita = document.querySelector('#escrita');
const upgradeDocumentacao = document.querySelector('#documentacao');
const upgradePlanilhas = document.querySelector('#planilhas');
const upgradeBalanceamento = document.querySelector('#balanceamento');

/* Ganhar GD Points */
gd.addEventListener('click', () => {
    gdPoints += 1;
    gdPointsText.innerHTML = gdPoints + " GD Points"
});


/* upgrades */