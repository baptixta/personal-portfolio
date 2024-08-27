const gd = document.querySelector('.gd');
const gdPointsText = document.querySelector('.points-all')
let gdPoints = 0;
let gdPointsPerSecond = 0;

const upgradeEscrita = document.querySelector('#escrita');
const upgradeEscritaCostText = document.querySelector('#escrita-cost');
const upgradeEscritaAmountText = document.querySelector('#escrita-amount');
const upgradeDocumentacao = document.querySelector('#documentacao');
const upgradePlanilhas = document.querySelector('#planilhas');
const upgradeBalanceamento = document.querySelector('#balanceamento');
const itemContent = document.querySelector('.item-content');

let escritaCost = 10;
let escritaAmount = 0;

const conquistas = document.querySelector('.conquistas');

/* Ganhar GD Points */
gd.addEventListener('click', () => {
    gdPoints += 1;
    gdPoints += escritaAmount;
    gdPointsText.innerHTML = gdPoints

    if (gdPoints >= escritaCost) {
        itemContent.classList.add('can-buy')
    }
});

/* upgrades */

upgradeEscrita.addEventListener('click', ()=> {
    if (gdPoints >= escritaCost) {
        gdPoints -= escritaCost;        
        gdPointsText.innerHTML = gdPoints       
        escritaCost += 1;
        escritaAmount += 1;        

        upgradeEscritaCostText.innerHTML = escritaCost;
        upgradeEscritaAmountText.innerHTML = escritaAmount;

        if(gdPoints < escritaCost) {
            itemContent.classList.remove('can-buy')
        }

        if (escritaAmount == 1) {
            const conquistaInicial = document.createElement("div")
            conquistaInicial.classList.add('conquista')
            conquistaInicial.innerHTML = "[NÍVEL 0] Conhecendo Game Design"
            conquistas.appendChild(conquistaInicial);
        }
    }    
});