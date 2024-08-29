const gd = document.querySelector('.gd');
const gdPointsText = document.querySelector('.points-all')
const gdPointsTextPerSecond = document.querySelector('.points-second')
let gdPoints = 0;
let gdPointsPerSecond = 0;

const upgradeEstudo = document.querySelector('#estudo');
const upgradeEstudoCostText = document.querySelector('#estudo-cost');
const upgradeEstudoAmountText = document.querySelector('#estudo-amount');

const upgradeEscrita = document.querySelector('#escrita');
const upgradeEscritaCostText = document.querySelector('#escrita-cost');
const upgradeEscritaAmountText = document.querySelector('#escrita-amount');

const upgradeDocumentacao = document.querySelector('#documentacao');
const upgradeDocumentacaoCostText = document.querySelector('#documentacao-cost');
const upgradeDocumentacaoAmountText = document.querySelector('#documentacao-amount');

const upgradePlanilhas = document.querySelector('#planilhas');
const upgradePlanilhasCostText = document.querySelector('#planilhas-cost');
const upgradePlanilhasAmountText = document.querySelector('#planilhas-amount');

const upgradeBalanceamento = document.querySelector('#balanceamento');

const itemContent = document.querySelectorAll('.item-content');
const blackpanel = document.querySelector('.black-panel');
const boxTutorial = document.querySelector('.box-tutorial');
const textLevel = document.querySelector('.text-level');

let estudoCost = 5;
let estudoAmount = 0;
let escritaCost = 10;
let escritaAmount = 0;
let escritaPoints = 0;
let documentacaoCost = 100
let documentacaoAmount = 0;
let documentacaoPoints = 0;
let planilhasCost = 1000
let planilhasAmount = 0;

const conquistas = document.querySelector('.conquistas');
const gdStats = document.querySelector('.gd-stats')


/* Ganhar GD Points */
gd.addEventListener('click', () => {
    gdPoints += 1;
    gdPoints += estudoAmount;
    gdPoints += escritaPoints;
    gdPoints += documentacaoPoints;
    gdPointsText.innerHTML = gdPoints

    // tutorial    
    if (gdPoints == 5) {
        boxTutorial.innerHTML = "Muito bem, agora use os pontos para comprar conhecimento na loja!"    
        setTimeout(() => {
            blackpanel.classList.add('remove-black-panel');
            boxTutorial.classList.add('remove-box-tutorial');
        }, 2250);
    }
    

    // visuals add estudo
    if (gdPoints >= escritaCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 0) {
                item.classList.add(('can-buy'))
            } else {
                item.classList.remove(('can-buy'))
            }
        });
    }


    // visuals add escrita
    if (gdPoints >= escritaCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 1) {
                item.classList.add(('can-buy'))
            }
        });
    }

    // visuals add documentacao
    if (gdPoints >= documentacaoCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 2) {
                item.classList.add(('can-buy'))
            }
        });
    } else {
        itemContent.forEach((item, idx) => {
            if (idx == 2) {
                item.classList.remove(('can-buy'))
            }
        });
    }

    // visuals add planilhas
    if (gdPoints >= planilhasCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 3) {
                item.classList.add(('can-buy'))
            }
        });
    }

    // visuals ponto ao clicar na tela
    const clickVisual = document.createElement("div")
    let totalPoints = 1 + estudoAmount + escritaPoints + documentacaoPoints;
    clickVisual.classList.add('click-feedback')
    clickVisual.innerHTML = `+${totalPoints}`;
    gdStats.appendChild(clickVisual);
    // destruir visual
    setTimeout(() => {
        clickVisual.remove();
    }, 1000);
});

/* upgrades regulares */

upgradeEstudo.addEventListener('click', ()=> {
    if (gdPoints >= estudoCost) {
        gdPoints -= estudoCost;        
        gdPointsText.innerHTML = gdPoints       
        estudoCost += 1;
        estudoAmount += 1;        

        upgradeEstudoCostText.innerHTML = estudoCost;
        upgradeEstudoAmountText.innerHTML = estudoAmount;

        // upgrade escrita visuals
        if(gdPoints < estudoCost) {
            itemContent.forEach((item, idx) => {
                if (idx == 0) {
                    item.classList.remove('can-buy')
                }
            });
        }

        // conquistas desbloqueadas
        if (estudoAmount == 1) {
            const conquistaInicial = document.createElement("div")
            conquistaInicial.classList.add('conquista')
            conquistaInicial.innerHTML = "Primeiros passos"
            conquistas.appendChild(conquistaInicial);
        }

        if (estudoAmount >= 10) {
            textLevel.innerHTML = "Nível 1";
        };
    }    
});

upgradeEscrita.addEventListener('click', ()=> {
    if (gdPoints >= escritaCost) {
        gdPoints -= escritaCost;        
        gdPointsText.innerHTML = gdPoints       
        escritaCost += 1;
        escritaAmount += 1;
        documentacaoPoints += 2;         

        upgradeEscritaCostText.innerHTML = escritaCost;
        upgradeEscritaAmountText.innerHTML = escritaAmount;

        // upgrade escrita visuals
        if(gdPoints < escritaCost) {
            itemContent.forEach((item, idx) => {
                if (idx == 1) {
                    item.classList.remove('can-buy')
                }
            });
        }

        // conquistas desbloqueadas
        if (escritaAmount == 1) {
            const conquistaInicial = document.createElement("div")
            conquistaInicial.classList.add('conquista')
            conquistaInicial.innerHTML = "Reforçando conceitos"
            conquistas.appendChild(conquistaInicial);            
        }

        if (estudoAmount >= 10 && escritaAmount >= 10) {
            textLevel.innerHTML = "Nível 2";
        };
    }    
});

upgradeDocumentacao.addEventListener('click', ()=> {
    if (gdPoints >= documentacaoCost) {
        gdPoints -= documentacaoCost;                
        gdPointsText.innerHTML = gdPoints       
        documentacaoCost += 200;
        documentacaoAmount += 1;
        documentacaoPoints += 50;        

        upgradeDocumentacaoCostText.innerHTML = documentacaoCost;
        upgradeDocumentacaoAmountText.innerHTML = documentacaoAmount;

        if(gdPoints < documentacaoCost) {
            itemContent.forEach((item, idx) => {
                if (idx == 2) {
                    item.classList.remove('can-buy')
                }
            });
        }

        if (documentacaoAmount == 1) {
            const conquistaInicial = document.createElement("div")
            conquistaInicial.classList.add('conquista')
            conquistaInicial.innerHTML = "Fez o primeiro GDD"
            conquistas.appendChild(conquistaInicial);
        }
    }    
});

/* upgrades de tempo (per second) */

upgradePlanilhas.addEventListener('click', ()=> {
    if (gdPoints >= planilhasCost) {
        gdPoints -= planilhasCost;      
        gdPointsPerSecond += 1;         
        gdPointsText.innerHTML = gdPoints          
        gdPointsTextPerSecond.innerHTML = "Por segundo: " + gdPointsPerSecond;
        planilhasCost += 500;
        planilhasAmount += 1;  
           

        upgradePlanilhasCostText.innerHTML = planilhasCost;
        upgradePlanilhasAmountText.innerHTML = planilhasAmount;

        if(gdPoints < planilhasCost) {
            itemContent.forEach((item, idx) => {
                if (idx == 3) {
                    item.classList.remove('can-buy')
                }
            });
        }

        if (planilhasAmount == 1) {
            const conquistaInicial = document.createElement("div")
            conquistaInicial.classList.add('conquista')
            conquistaInicial.innerHTML = "Usa tabelas"
            conquistas.appendChild(conquistaInicial);
        }
    }    
});


function upgradesTimer() {    
    gdPoints += gdPointsPerSecond;
    gdPointsText.innerHTML = gdPoints
    

    // visuals ponto por segundo na tela
    if (gdPointsPerSecond >= 1) {
        const clickVisual = document.createElement("div")
        let totalPoints = gdPointsPerSecond;
        clickVisual.classList.add('click-per-second')
        clickVisual.innerHTML = `+${totalPoints}`;
        gdStats.appendChild(clickVisual);
        // destruir visual
        setTimeout(() => {
            clickVisual.remove();
        }, 1000);
    }

    // visuals add estudo
    if (gdPoints >= estudoCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 0) {
                item.classList.add(('can-buy'))
            }
        });
    }
    
    // visuals add escrita
    if (gdPoints >= escritaCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 1) {
                item.classList.add(('can-buy'))
            }
        });
    }

    // visuals add documentacao
    if (gdPoints >= documentacaoCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 2) {
                item.classList.add(('can-buy'))
            }
        });
    } else {
        itemContent.forEach((item, idx) => {
            if (idx == 2) {
                item.classList.remove(('can-buy'))
            }
        });
    }

    // visuals add planilhas
    if (gdPoints >= planilhasCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 3) {
                item.classList.add(('can-buy'))
            }
        });
    }
}

setInterval(upgradesTimer, 1000);
