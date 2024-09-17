const easterEgg = document.querySelector('.easter-egg')
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
const upgradeBalanceamentoCostText = document.querySelector('#balanceamento-cost');
const upgradeBalanceamentoAmountText = document.querySelector('#balanceamento-amount');

const itemContent = document.querySelectorAll('.item-content');
const blackpanel = document.querySelector('.black-panel');
const boxTutorial = document.querySelector('.box-tutorial');
const textLevel = document.querySelector('.text-level');
const masterizado = document.querySelectorAll('.masterizado');

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
let balanceamentoCost = 10000
let balanceamentoAmount = 0;
let balanceamentoPoints = 0;

const cliquesEstudo = document.querySelector('#cliques-estudo');
const cliquesEscrita = document.querySelector('#cliques-escrita');
const cliquesDocumentacao = document.querySelector('#cliques-documentacao');
const cliquesPlanilhas = document.querySelector('#cliques-planilhas');
const cliquesBalanceamento = document.querySelector('#cliques-balanceamento');

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

    // visuals add balanceamento
    if (gdPoints >= balanceamentoCost) {
        itemContent.forEach((item, idx) => {
            if (idx == 4) {
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

        // feedback de quantidade de cliques
        cliquesEstudo.innerHTML = `Boost de cliques: +${estudoAmount}`;

        // conquistas desbloqueadas
        if (estudoAmount == 1) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Primeiros Passos');
            conquista.appendTo('.easter-egg');
        }

        if (estudoAmount == 50) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Estudioso');
            conquista.appendTo('.easter-egg');
        }

        if (estudoAmount >= 100) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Super Estudioso');
            conquista.appendTo('.easter-egg');

            masterizado.forEach((item, idx) => {
                if (idx == 0) {
                    item.classList.add('unlock')
                }
            });
        }
    }    
});

upgradeEscrita.addEventListener('click', ()=> {
    if (gdPoints >= escritaCost) {
        gdPoints -= escritaCost;        
        gdPointsText.innerHTML = gdPoints       
        escritaCost += 1;
        escritaAmount += 1;
        escritaPoints += 2;         

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

        // feedback de quantidade de cliques
        cliquesEscrita.innerHTML = `Boost de cliques: +${escritaPoints}`;

        // conquistas desbloqueadas
        if (escritaAmount == 1) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Reforçando Conceitos');
            conquista.appendTo('.easter-egg');          
        }

        if (escritaAmount == 50) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Fera da Escrita');
            conquista.appendTo('.easter-egg');          
        }

        if (escritaAmount >= 100) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Mestre dos Conceitos');
            conquista.appendTo('.easter-egg'); 

            masterizado.forEach((item, idx) => {
                if (idx == 1) {
                    item.classList.add('unlock')
                }
            });
        }
    }    
});

upgradeDocumentacao.addEventListener('click', ()=> {
    if (gdPoints >= documentacaoCost) {
        gdPoints -= documentacaoCost;                
        gdPointsText.innerHTML = gdPoints       
        documentacaoCost += 200;
        documentacaoAmount += 1;
        documentacaoPoints += 25;        

        upgradeDocumentacaoCostText.innerHTML = documentacaoCost;
        upgradeDocumentacaoAmountText.innerHTML = documentacaoAmount;

        if(gdPoints < documentacaoCost) {
            itemContent.forEach((item, idx) => {
                if (idx == 2) {
                    item.classList.remove('can-buy')
                }
            });
        }

        // feedback de quantidade de cliques
        cliquesDocumentacao.innerHTML = `Boost de cliques: +${documentacaoPoints}`;

        // conquistas desbloqueadas
        if (documentacaoAmount == 1) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Fez o primeiro GDD');
            conquista.appendTo('.easter-egg');
        }

        if (documentacaoAmount == 50) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Muitos GDDs feitos');
            conquista.appendTo('.easter-egg');
        }

        if (documentacaoAmount == 100) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', '1000h gastas em GDD');
            conquista.appendTo('.easter-egg');
        }

        if (documentacaoAmount >= 50) {
            itemContent.forEach((item, idx) => {
                if (idx == 2) {
                    item.classList.add('evo-1')
                }
            });
        }

        if (documentacaoAmount >= 50) {
            masterizado.forEach((item, idx) => {
                if (idx == 2) {
                    item.classList.add('unlock')
                }
            });
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

        // feedback de quantidade de cliques por segundo
        cliquesPlanilhas.innerHTML = `Boost de cliques p/ segundo: +${planilhasAmount}`;

        // conquistas desbloqueadas
        if (planilhasAmount == 1) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Usa Tabelas');
            conquista.appendTo('.easter-egg');
        }

        if (planilhasAmount == 50) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Brabo das linhas e colunas');
            conquista.appendTo('.easter-egg');
        }

        if (planilhasAmount == 100) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Sabe todas fórmulas');
            conquista.appendTo('.easter-egg');
        }
    }    
});

upgradeBalanceamento.addEventListener('click', ()=> {
    if (gdPoints >= balanceamentoCost) {
        gdPoints -= balanceamentoCost;      
        gdPointsPerSecond += 1;         
        gdPointsText.innerHTML = gdPoints          
        gdPointsTextPerSecond.innerHTML = "Por segundo: " + gdPointsPerSecond;
        balanceamentoCost += 5000;
        balanceamentoAmount += 1;  
        balanceamentoPoints += 10;            

        upgradeBalanceamentoCostText.innerHTML = balanceamentoCost;
        upgradeBalanceamentoAmountText.innerHTML = balanceamentoAmount;

        if(gdPoints < balanceamentoCost) {
            itemContent.forEach((item, idx) => {
                if (idx == 4) {
                    item.classList.remove('can-buy')
                }
            });
        }

        // feedback de quantidade de cliques por segundo
        cliquesBalanceamento.innerHTML = `Boost de cliques p/ segundo: +${balanceamentoPoints}`;

        // conquistas desbloqueadas
        if (balanceamentoAmount == 1) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Acha que sabe balancear');
            conquista.appendTo('.easter-egg');
        }

        if (balanceamentoAmount == 50) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'GD Balanceado');
            conquista.appendTo('.easter-egg');
        }
        
        if (balanceamentoAmount == 100) {
            const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', 'Perfeitamente balanceado');
            conquista.appendTo('.easter-egg');
        }
        
    }    
});


function upgradesTimer() {    
    gdPoints += gdPointsPerSecond + balanceamentoPoints;
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


// Constructor para conquistas

class CustomElement {
    constructor(imgSrc, heading2Text, heading3Text) {
      this.imgSrc = imgSrc;
      this.heading2Text = heading2Text;
      this.heading3Text = heading3Text;
    }
  
    // Método para criar o elemento
    createElement() {
      const container = document.createElement('div');
      container.classList.add('conquista');
      container.style.opacity = 0; // Inicialmente invisível
  
      const img = document.createElement('img');
      img.src = this.imgSrc;
      img.alt = this.heading2Text || 'Image';
      container.appendChild(img);
  
      const infoContainer = document.createElement('div');
      infoContainer.classList.add('conquista-info');
  
      const h2 = document.createElement('h2');
      h2.textContent = this.heading2Text;
      infoContainer.appendChild(h2);
  
      const h3 = document.createElement('h3');
      h3.textContent = this.heading3Text;
      infoContainer.appendChild(h3);
  
      container.appendChild(infoContainer);
      return container;
    }
  
    // Método para adicionar o elemento ao DOM com animação de fade in e fade out
    appendTo(parentElement) {
      const element = this.createElement();
      document.querySelector(parentElement).appendChild(element);
  
      // Fade in
      setTimeout(() => {
        element.style.transition = 'opacity .5s'; // Transição suave de 1 segundo
        element.style.opacity = 1; // Aparecer
  
        // Após 2 segundos de exibição, iniciar o fade out
        setTimeout(() => {
          element.style.opacity = 0; // Desaparecer com fade out
  
          // Após a transição do fade out, remover o elemento do DOM
          setTimeout(() => {
            element.remove();
          }, 500); // Esperar 1 segundo para a animação de fade out ser concluída
        }, 3200); // Esperar 3 segundos antes do fade out
      }, 100); // Iniciar o fade in logo após a adição ao DOM
    }
  }
  