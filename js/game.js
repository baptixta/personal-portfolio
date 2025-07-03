// Estrutura dinâmica de upgrades e lógica centralizada para o minigame

const upgrades = [
  {
    id: 'estudo',
    name: 'Estudo',
    cost: 5,
    costIncrement: 1,
    amount: 0,
    clickBoost: 1,
    perSecondBoost: 0,
    achievements: [
      { amount: 1, name: 'Primeiros Passos' },
      { amount: 50, name: 'Estudioso' },
      { amount: 100, name: 'Super Estudioso' },
    ],
    icon: '/img/upgrades/upgrade-study.png',
    masterizadoIdx: 0,
    tooltip: 'Aumenta a quantidade de pontos ganhos por clique.'
  },
  {
    id: 'escrita',
    name: 'Escrita',
    cost: 10,
    costIncrement: 1,
    amount: 0,
    clickBoost: 2,
    perSecondBoost: 0,
    achievements: [
      { amount: 1, name: 'Reforçando Conceitos' },
      { amount: 50, name: 'Fera da Escrita' },
      { amount: 100, name: 'Mestre dos Conceitos' },
    ],
    icon: '/img/upgrades/upgrade-writing.png',
    masterizadoIdx: 1,
    tooltip: 'Aumenta a quantidade de pontos ganhos por clique.'
  },
  {
    id: 'documentacao',
    name: 'Documentação',
    cost: 100,
    costIncrement: 200,
    amount: 0,
    clickBoost: 25,
    perSecondBoost: 0,
    achievements: [
      { amount: 1, name: 'Fez o primeiro GDD' },
      { amount: 50, name: 'Muitos GDDs feitos' },
      { amount: 100, name: '1000h gastas em GDD' },
    ],
    icon: '/img/upgrades/upgrade-document.png',
    masterizadoIdx: 2,
    tooltip: 'Aumenta a quantidade de pontos ganhos por clique.'
  },
  {
    id: 'planilhas',
    name: 'Planilhas',
    cost: 1000,
    costIncrement: 500,
    amount: 0,
    clickBoost: 0,
    perSecondBoost: 1,
    achievements: [
      { amount: 1, name: 'Usa Tabelas' },
      { amount: 50, name: 'Brabo das linhas e colunas' },
      { amount: 100, name: 'Sabe todas fórmulas' },
    ],
    icon: '/img/upgrades/upgrade-sheets.png',
    masterizadoIdx: 3,
    tooltip: 'Aumenta a quantidade de pontos ganhos por segundo.'
  },
  {
    id: 'balanceamento',
    name: 'Balanceamento',
    cost: 5000,
    costIncrement: 1500,
    amount: 0,
    clickBoost: 0,
    perSecondBoost: 10,
    achievements: [
      { amount: 1, name: 'Acha que sabe balancear' },
      { amount: 50, name: 'GD Balanceado' },
      { amount: 100, name: 'Perfeitamente balanceado' },
    ],
    icon: '/img/upgrades/upgrade-balance.png',
    masterizadoIdx: 4,
    tooltip: 'Aumenta a quantidade de pontos ganhos por segundo.'
  },
  {
    id: 'iteracao',
    name: 'Iteração',
    cost: 20000,
    costIncrement: 5000,
    amount: 0,
    clickBoost: 0,
    perSecondBoost: 50,
    achievements: [
      { amount: 1, name: 'Primeira iteração' },
      { amount: 25, name: 'Iterador experiente' },
      { amount: 100, name: 'Ciclo infinito de melhorias' },
    ],
    icon: '/img/upgrades/upgrade-iteration.png',
    masterizadoIdx: 5,
    tooltip: 'Aumenta muito a quantidade de pontos ganhos por segundo.'
  },
];

let gdPoints = 0;
let gdPointsPerSecond = 0;
let record = 0;
let lastShownLevel = 0;
let lastGdClick = Date.now();

// Utilidades DOM
const gd = document.querySelector('.gd');
const gdPointsText = document.querySelector('.points-all');
const gdPointsTextPerSecond = document.querySelector('.points-second');
const itemContent = document.querySelectorAll('.item-content');
const blackpanel = document.querySelector('.black-panel');
const boxTutorial = document.querySelector('.box-tutorial');
const textLevel = document.querySelector('.text-level');
const masterizado = document.querySelectorAll('.masterizado');
const gdStats = document.querySelector('.gd-stats');
const easterEgg = document.querySelector('.easter-egg');

// Tooltips
const tooltips = {
  estudo: document.querySelector('#cliques-estudo'),
  escrita: document.querySelector('#cliques-escrita'),
  documentacao: document.querySelector('#cliques-documentacao'),
  planilhas: document.querySelector('#cliques-planilhas'),
  balanceamento: document.querySelector('#cliques-balanceamento'),
};

// Power-up temporário
let powerupActive = false;
let powerupCooldown = false;
let powerupTimeout = null;
let powerupBtn = null;
let powerupDuration = 10; // segundos
let powerupCooldownTime = 20; // segundos

function activatePowerup() {
  if (powerupActive || powerupCooldown) return;
  powerupActive = true;
  powerupBtn.classList.add('active');
  showPowerupVisual();
  let secondsLeft = powerupDuration;
  powerupBtn.innerText = `Power-up: ${secondsLeft}s`;
  let interval = setInterval(() => {
    secondsLeft--;
    powerupBtn.innerText = `Power-up: ${secondsLeft}s`;
    if (secondsLeft <= 0) {
      clearInterval(interval);
      deactivatePowerup();
    }
  }, 1000);
}

function deactivatePowerup() {
  powerupActive = false;
  powerupBtn.classList.remove('active');
  powerupBtn.innerText = 'Power-up';
  removePowerupVisual();
  startPowerupCooldown();
}

function startPowerupCooldown() {
  powerupCooldown = true;
  let secondsLeft = powerupCooldownTime;
  powerupBtn.innerText = `Cooldown: ${secondsLeft}s`;
  powerupBtn.disabled = true;
  let interval = setInterval(() => {
    secondsLeft--;
    powerupBtn.innerText = `Cooldown: ${secondsLeft}s`;
    if (secondsLeft <= 0) {
      clearInterval(interval);
      powerupCooldown = false;
      powerupBtn.disabled = false;
      powerupBtn.innerText = 'Power-up';
      updatePowerupButtonVisual();
    }
  }, 1000);
}

function showPowerupVisual() {
  document.body.classList.add('powerup-glow');
  gd.classList.add('powerup-shake');
}
function removePowerupVisual() {
  document.body.classList.remove('powerup-glow');
  gd.classList.remove('powerup-shake');
}

// Salvar e carregar progresso
function saveGame() {
  const save = {
    gdPoints,
    gdPointsPerSecond,
    upgrades: upgrades.map(u => ({ amount: u.amount, cost: u.cost })),
    record: Math.max(record, gdPoints)
  };
  localStorage.setItem('gdSave', JSON.stringify(save));
}

function hideTutorialBox() {
  boxTutorial.classList.add('remove-box-tutorial');
  blackpanel.classList.add('remove-black-panel');
}

function shouldShowTutorial() {
  // Se não há progresso, mostra tutorial
  if (gdPoints > 0) return false;
  for (let u of upgrades) {
    if (u.amount > 0) return false;
  }
  return true;
}

function loadGame() {
  const save = JSON.parse(localStorage.getItem('gdSave'));
  if (save) {
    gdPoints = save.gdPoints;
    gdPointsPerSecond = save.gdPointsPerSecond;
    record = save.record || 0;
    upgrades.forEach((u, i) => {
      u.amount = save.upgrades[i]?.amount || 0;
      u.cost = save.upgrades[i]?.cost || u.cost;
    });
    updateUI();
  }
  // Esconde tutorial se já houver progresso
  if (!shouldShowTutorial()) {
    hideTutorialBox();
  }
}

function resetGame() {
  localStorage.removeItem('gdSave');
  gdPoints = 0;
  gdPointsPerSecond = 0;
  upgrades.forEach(u => {
    u.amount = 0;
    u.cost = u.id === 'estudo' ? 5 : u.id === 'escrita' ? 10 : u.id === 'documentacao' ? 100 : u.id === 'planilhas' ? 1000 : u.id === 'balanceamento' ? 5000 : 20000;
  });
  updateUI();
}

// NOVO: cálculo de nível progressivo
function calculateLevel() {
  let upgradesBought = 0;
  let levelPoints = 0;
  upgrades.forEach(u => {
    upgradesBought += u.amount;
    // Cada upgrade contribui com pontos de nível proporcional ao custo inicial
    levelPoints += u.amount * Math.max(1, Math.floor(Math.log10(u.cost)));
  });
  // 1 nível a cada 10 upgrades comprados
  let baseLevel = Math.floor(upgradesBought / 10);
  // Bônus de nível por custo dos upgrades
  let bonusLevel = Math.floor(levelPoints / 10);
  return baseLevel + bonusLevel;
}

// NOVO: conquistas de nível
let lastLevelAchievement = 0;
function checkLevelAchievements(currentLevel) {
  if (currentLevel > 0 && currentLevel % 10 === 0 && currentLevel !== lastLevelAchievement) {
    lastLevelAchievement = currentLevel;
    const names = [
      'Iniciante dos Games',
      'Aprendiz de GD',
      'Designer em Ascensão',
      'Especialista em Upgrades',
      'Mestre das Planilhas',
      'Balanceador Supremo',
      'Lenda do Game Design',
      'Guru dos Power-ups',
      'Sábio dos Sistemas',
      'Deus do Level Design'
    ];
    const idx = Math.floor(currentLevel / 10) - 1;
    const name = names[idx] || `Nível ${currentLevel}: Game Designer Épico!`;
    const conquista = new CustomElement('/img/trophy.png', 'Conquista de Nível', name);
    conquista.appendTo('.easter-egg');
  }
}

// Função para formatar pontos em k/m
function formatPoints(value) {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    return value;
  }
}

// NOVO: lógica de bloqueio de upgrades
function isUpgradeLocked(idx) {
  if (idx === 0) return false;
  const prev = upgrades[idx - 1];
  const thresholds = [10, 20, 30, 40, 50]; // thresholds para desbloqueio
  return prev.amount < thresholds[idx - 1];
}

// Atualização de UI centralizada
function updateUI() {
  let clickTotal = 1;
  gdPointsPerSecond = 0;
  const thresholds = [10, 20, 30, 40, 50]; // thresholds para desbloqueio
  upgrades.forEach((u, idx) => {
    document.getElementById(`${u.id}-cost`).innerText = u.cost;
    document.getElementById(`${u.id}-amount`).innerText = u.amount;
    if (u.clickBoost) clickTotal += u.amount * u.clickBoost;
    if (u.perSecondBoost) gdPointsPerSecond += u.amount * u.perSecondBoost;
    // Tooltips
    if (tooltips[u.id]) {
      tooltips[u.id].innerText = u.perSecondBoost ? `Boost de pontos p/ segundo: +${u.amount * u.perSecondBoost}` : `Boost de cliques: +${u.amount * u.clickBoost}`;
    }
    // Visual de masterizado
    if (u.amount >= 100 && masterizado[u.masterizadoIdx]) {
      masterizado[u.masterizadoIdx].classList.add('unlock');
    }
    // NOVO: can-buy visual
    const itemDiv = itemContent[idx];
    if (gdPoints >= u.cost && !isUpgradeLocked(idx)) {
      itemDiv.classList.add('can-buy');
    } else {
      itemDiv.classList.remove('can-buy');
    }
    // NOVO: bloqueio visual
    let lockOverlay = itemDiv.querySelector('.lock-overlay');
    if (isUpgradeLocked(idx)) {
      itemDiv.classList.add('locked');
      if (!lockOverlay) {
        lockOverlay = document.createElement('div');
        lockOverlay.className = 'lock-overlay';
        let msg = '';
        if (idx === 1) msg = `Compre ${thresholds[0]}x da melhoria anterior para desbloquear`;
        else if (idx === 2) msg = `Compre ${thresholds[1]}x da melhoria anterior para desbloquear`;
        else if (idx === 3) msg = `Compre ${thresholds[2]}x da melhoria anterior para desbloquear`;
        else if (idx === 4) msg = `Compre ${thresholds[3]}x da melhoria anterior para desbloquear`;
        else if (idx === 5) msg = `Compre ${thresholds[4]}x da melhoria anterior para desbloquear`;
        lockOverlay.innerHTML = `<div style='display:flex;flex-direction:column;align-items:center;'><span class="lock-icon">🔒</span><span class="lock-msg">${msg}</span></div>`;
        itemDiv.appendChild(lockOverlay);
      }
    } else {
      itemDiv.classList.remove('locked');
      if (lockOverlay) lockOverlay.remove();
    }
  });
  // Exibe pontos formatados
  gdPointsText.innerText = formatPoints(gdPoints);
  gdPointsTextPerSecond.innerText = `Por segundo: ${gdPointsPerSecond}`;
  const currentLevel = calculateLevel();
  textLevel.innerText = `Nível ${currentLevel}`;
  if (currentLevel > lastShownLevel) {
    showLevelUpFeedback();
    lastShownLevel = currentLevel;
  }
  checkLevelAchievements(currentLevel);
  if (document.getElementById('record')) {
    document.getElementById('record').innerText = `Recorde: ${Math.max(record, gdPoints)}`;
  }
  updateXpBar();
}

// Feedback visual
function showClickFeedback(points) {
  const clickVisual = document.createElement('div');
  clickVisual.classList.add('click-feedback');
  if (powerupActive) clickVisual.classList.add('powerup-feedback');
  clickVisual.innerHTML = `+${points}`;
  gdStats.appendChild(clickVisual);
  setTimeout(() => clickVisual.remove(), 1000);
}

function showPerSecondFeedback(points) {
  const clickVisual = document.createElement('div');
  clickVisual.classList.add('click-per-second');
  clickVisual.innerHTML = `+${points}`;
  gdStats.appendChild(clickVisual);
  setTimeout(() => clickVisual.remove(), 1000);
}

// Conquistas
class CustomElement {
  constructor(imgSrc, heading2Text, heading3Text) {
    this.imgSrc = imgSrc;
    this.heading2Text = heading2Text;
    this.heading3Text = heading3Text;
  }
  createElement() {
    const container = document.createElement('div');
    container.classList.add('conquista');
    container.style.opacity = 0;
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
  appendTo(parentElement) {
    const element = this.createElement();
    document.querySelector(parentElement).appendChild(element);
    setTimeout(() => {
      element.style.transition = 'opacity .5s';
      element.style.opacity = 1;
      setTimeout(() => {
        element.style.opacity = 0;
        setTimeout(() => {
          element.remove();
        }, 500);
      }, 3200);
    }, 100);
  }
}

// Checar conquistas
function checkAchievements(upgrade) {
  upgrade.achievements.forEach(ach => {
    if (upgrade.amount === ach.amount) {
      const conquista = new CustomElement('/img/trophy.png', 'Conquista Desbloqueada', ach.name);
      conquista.appendTo('.easter-egg');
    }
  });
}

// Comprar upgrade
function buyUpgrade(idx) {
  const u = upgrades[idx];
  if (gdPoints >= u.cost) {
    gdPoints -= u.cost;
    u.amount++;
    u.cost += u.costIncrement;
    checkAchievements(u);
    updateUI();
    saveGame();
  }
}

// Clique no GD (ajustado para power-up)
let clickBase = 1;
gd.addEventListener('click', () => {
  lastGdClick = Date.now();
  let clickTotal = clickBase;
  upgrades.forEach(u => {
    if (u.clickBoost) clickTotal += u.amount * u.clickBoost;
  });
  if (powerupActive) clickTotal *= 2;
  gdPoints += clickTotal;
  showClickFeedback(clickTotal);
  // Tutorial
  if (gdPoints >= 5 && boxTutorial.innerText.includes('Clique')) {
    boxTutorial.innerHTML = 'Muito bem, agora use os pontos para comprar conhecimento na loja!';
    setTimeout(() => {
      blackpanel.classList.add('remove-black-panel');
      boxTutorial.classList.add('remove-box-tutorial');
    }, 2250);
  }
  updateUI();
  saveGame();
});

// Listeners para upgrades
itemContent.forEach((item, idx) => {
  item.addEventListener('click', () => {
    if (isUpgradeLocked(idx)) return;
    buyUpgrade(idx);
  });
});

// Timer de pontos por segundo
setInterval(() => {
  gdPoints += gdPointsPerSecond;
  if (gdPointsPerSecond > 0) showPerSecondFeedback(gdPointsPerSecond);
  updateUI();
  saveGame();
}, 1000);

// Botão de reset e ranking local
if (!document.getElementById('reset-btn')) {
  const resetBtn = document.createElement('button');
  resetBtn.id = 'reset-btn';
  resetBtn.className = 'gd-btn';
  resetBtn.innerText = 'Resetar Jogo';
  resetBtn.style.margin = '10px 0 0 0';
  resetBtn.onclick = () => {
    if (confirm('Tem certeza que deseja resetar seu progresso?')) resetGame();
  };
  gdStats.appendChild(resetBtn);
}
if (!document.getElementById('record')) {
  const recordDiv = document.createElement('div');
  recordDiv.id = 'record';
  recordDiv.innerText = `Recorde: ${record}`;
  recordDiv.style.margin = '10px 0 0 0';
  easterEgg.appendChild(recordDiv);
}

// Adiciona botão de power-up na interface
function addPowerupButton() {
  if (!document.getElementById('powerup-btn')) {
    powerupBtn = document.createElement('button');
    powerupBtn.id = 'powerup-btn';
    powerupBtn.className = 'gd-btn';
    powerupBtn.innerText = 'Usar Power-up';
    powerupBtn.onclick = activatePowerup;
    gdStats.appendChild(powerupBtn);
  }
}
addPowerupButton();

// Animação e opacidade do botão de power-up
function updatePowerupButtonVisual() {
  if (!powerupBtn) return;
  if (powerupActive) {
    powerupBtn.classList.add('pulsing');
    powerupBtn.classList.remove('cooldown');
    powerupBtn.style.opacity = '1';
  } else if (powerupCooldown) {
    powerupBtn.classList.remove('pulsing');
    powerupBtn.classList.add('cooldown');
    powerupBtn.style.opacity = '0.5';
  } else {
    powerupBtn.classList.remove('pulsing');
    powerupBtn.classList.remove('cooldown');
    powerupBtn.style.opacity = '1';
  }
}

// Atualizar visual sempre que o estado mudar
const oldActivatePowerup = activatePowerup;
activatePowerup = function() {
  oldActivatePowerup.apply(this, arguments);
  updatePowerupButtonVisual();
};
const oldDeactivatePowerup = deactivatePowerup;
deactivatePowerup = function() {
  oldDeactivatePowerup.apply(this, arguments);
  updatePowerupButtonVisual();
};
const oldStartPowerupCooldown = startPowerupCooldown;
startPowerupCooldown = function() {
  oldStartPowerupCooldown.apply(this, arguments);
  updatePowerupButtonVisual();
};
// Inicializa visual
setTimeout(updatePowerupButtonVisual, 100);

// Carregar progresso ao iniciar
loadGame();

// ... Fim do código refatorado ...
// (CSS pode ser ajustado para novas classes, se necessário)

function showLevelUpFeedback() {
  const gdStats = document.querySelector('.gd-stats');
  const textLevel = gdStats.querySelector('.text-level');
  // Cria o feedback
  const feedback = document.createElement('div');
  feedback.className = 'levelup-feedback';
  feedback.innerText = 'level up!';
  // Posiciona como overlay sobre o text-level
  feedback.style.position = 'absolute';
  feedback.style.left = textLevel.offsetLeft + 'px';
  feedback.style.top = textLevel.offsetTop + 'px';
  feedback.style.width = textLevel.offsetWidth + 'px';
  feedback.style.height = textLevel.offsetHeight + 'px';
  feedback.style.display = 'flex';
  feedback.style.alignItems = 'center';
  feedback.style.justifyContent = 'center';
  feedback.style.pointerEvents = 'none';
  textLevel.parentElement.appendChild(feedback);
  setTimeout(() => {
    feedback.classList.add('fadeout');
    setTimeout(() => feedback.remove(), 600);
  }, 1800);
}

// Feedback visual periódico para lembrar de clicar no personagem
function showClickMeReminder() {
  // Só mostra se não clicou nos últimos 5s
  if (Date.now() - lastGdClick < 5000) return;
  const gdStats = document.querySelector('.gd-stats');
  const gdImg = gdStats.querySelector('.gd');
  if (gdStats.querySelector('.clickme-reminder')) return; // não empilhar
  const reminder = document.createElement('div');
  reminder.className = 'clickme-reminder';
  reminder.innerText = 'clique em mim';
  // Centraliza em relação ao personagem
  const gdRect = gdImg.getBoundingClientRect();
  const statsRect = gdStats.getBoundingClientRect();
  reminder.style.position = 'absolute';
  reminder.style.left = (gdImg.offsetLeft + gdImg.offsetWidth/2 - 60) + 'px';
  reminder.style.top = (gdImg.offsetTop - 32) + 'px';
  reminder.style.width = '120px';
  reminder.style.textAlign = 'center';
  reminder.style.transform = 'none';
  gdStats.appendChild(reminder);
  setTimeout(() => {
    reminder.classList.add('fadeout');
    setTimeout(() => reminder.remove(), 600);
  }, 2000);
}
setInterval(showClickMeReminder, 5000);

function getXpProgress() {
  // XP é o total de upgrades comprados + bônus de custo
  let upgradesBought = 0;
  let levelPoints = 0;
  upgrades.forEach(u => {
    upgradesBought += u.amount;
    levelPoints += u.amount * Math.max(1, Math.floor(Math.log10(u.cost)));
  });
  let baseLevel = Math.floor(upgradesBought / 10);
  let bonusLevel = Math.floor(levelPoints / 10);
  let currentLevel = baseLevel + bonusLevel;
  // XP total para o nível atual
  let xpForCurrent = (baseLevel * 10) + (bonusLevel * 10);
  // XP total para o próximo nível
  let nextBase = baseLevel + (bonusLevel === baseLevel ? 1 : 0);
  let nextBonus = bonusLevel + (baseLevel === bonusLevel ? 1 : 0);
  let xpForNext = ((currentLevel + 1) * 10);
  // XP atual
  let xpCurrent = upgradesBought + levelPoints;
  let progress = (xpCurrent - xpForCurrent) / (xpForNext - xpForCurrent);
  return Math.max(0, Math.min(1, progress));
}

function updateXpBar() {
  const bar = document.getElementById('xp-bar');
  if (!bar) return;
  const progress = getXpProgress();
  bar.style.width = (progress * 100) + '%';
}
