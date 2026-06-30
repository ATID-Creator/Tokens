/**
 * アジア貿易シミュレーション
 * 東アジア・東南アジアの都市間を行き来し、物価差を利用して財を築くゲーム
 */

const CONFIG = {
  initialMoney: 10000,
  initialCity: 'tokyo',
  cargoCapacity: 50,
  maxDays: 120,
  winMoney: 100000,
  saveKey: 'asia-trade-sim-save',
};

const CITIES = {
  tokyo: {
    id: 'tokyo',
    name: '東京',
    country: '日本',
    flag: '🇯🇵',
    desc: 'テクノロジーと精密機器の中心地。電子製品が安く手に入る。',
    specialties: ['electronics', 'automobiles'],
  },
  shanghai: {
    id: 'shanghai',
    name: '上海',
    country: '中国',
    flag: '🇨🇳',
    desc: '世界最大級の港。製造業のハブで衣料品・電子部品が豊富。',
    specialties: ['textiles', 'electronics'],
  },
  seoul: {
    id: 'seoul',
    name: 'ソウル',
    country: '韓国',
    flag: '🇰🇷',
    desc: 'K-POPと半導体の街。化粧品と電子製品の需要が高い。',
    specialties: ['cosmetics', 'electronics'],
  },
  singapore: {
    id: 'singapore',
    name: 'シンガポール',
    country: 'シンガポール',
    flag: '🇸🇬',
    desc: '東南アジアの金融・物流ハブ。高級品の取引が活発。',
    specialties: ['spices', 'seafood'],
  },
  bangkok: {
    id: 'bangkok',
    name: 'バンコク',
    country: 'タイ',
    flag: '🇹🇭',
    desc: '香辛料と米の産地。観光地としても栄える交易の要衝。',
    specialties: ['spices', 'rice'],
  },
  mumbai: {
    id: 'mumbai',
    name: 'ムンバイ',
    country: 'インド',
    flag: '🇮🇳',
    desc: '南アジア最大の商業都市。宝石・香辛料・繊維の集散地。',
    specialties: ['spices', 'textiles'],
  },
  hanoi: {
    id: 'hanoi',
    name: 'ハノイ',
    country: 'ベトナム',
    flag: '🇻🇳',
    desc: 'コーヒーとシルクの産地。急成長する製造業の拠点。',
    specialties: ['coffee', 'silk'],
  },
  jakarta: {
    id: 'jakarta',
    name: 'ジャカルタ',
    country: 'インドネシア',
    flag: '🇮🇩',
    desc: '群島国家の首都。コーヒー・パーム油・海産物が豊富。',
    specialties: ['coffee', 'seafood'],
  },
};

const DISTANCES = {
  tokyo: { shanghai: 3, seoul: 2, singapore: 7, bangkok: 6, mumbai: 8, hanoi: 5, jakarta: 7 },
  shanghai: { tokyo: 3, seoul: 2, singapore: 5, bangkok: 4, mumbai: 6, hanoi: 3, jakarta: 6 },
  seoul: { tokyo: 2, shanghai: 2, singapore: 6, bangkok: 5, mumbai: 7, hanoi: 4, jakarta: 6 },
  singapore: { tokyo: 7, shanghai: 5, seoul: 6, bangkok: 2, mumbai: 4, hanoi: 3, jakarta: 2 },
  bangkok: { tokyo: 6, shanghai: 4, seoul: 5, singapore: 2, mumbai: 4, hanoi: 2, jakarta: 3 },
  mumbai: { tokyo: 8, shanghai: 6, seoul: 7, singapore: 4, bangkok: 4, hanoi: 5, jakarta: 5 },
  hanoi: { tokyo: 5, shanghai: 3, seoul: 4, singapore: 3, bangkok: 2, mumbai: 5, jakarta: 4 },
  jakarta: { tokyo: 7, shanghai: 6, seoul: 6, singapore: 2, bangkok: 3, mumbai: 5, hanoi: 4 },
};

const GOODS = {
  electronics: { id: 'electronics', name: '電子製品', icon: '📱', basePrice: 800 },
  textiles: { id: 'textiles', name: '繊維製品', icon: '👔', basePrice: 300 },
  spices: { id: 'spices', name: '香辛料', icon: '🌶️', basePrice: 250 },
  rice: { id: 'rice', name: '米', icon: '🍚', basePrice: 150 },
  silk: { id: 'silk', name: 'シルク', icon: '🧵', basePrice: 600 },
  seafood: { id: 'seafood', name: '海産物', icon: '🦐', basePrice: 400 },
  coffee: { id: 'coffee', name: 'コーヒー', icon: '☕', basePrice: 350 },
  cosmetics: { id: 'cosmetics', name: '化粧品', icon: '💄', basePrice: 500 },
  automobiles: { id: 'automobiles', name: '自動車部品', icon: '🚗', basePrice: 1200 },
};

const EVENTS = [
  {
    id: 'typhoon',
    title: '台風接近',
    message: '台風の影響で海運が混乱。全商品の価格が20%上昇。',
    effect: (state) => applyPriceMultiplier(state, 1.2),
    type: 'negative',
  },
  {
    id: 'festival',
    title: '地域祭り',
    message: '盛大な祭りで需要が急増！特産品の価格が30%上昇。',
    effect: (state) => {
      const city = CITIES[state.currentCity];
      city.specialties.forEach((goodId) => {
        state.prices[state.currentCity][goodId] = Math.round(
          state.prices[state.currentCity][goodId] * 1.3
        );
      });
    },
    type: 'positive',
  },
  {
    id: 'trade_deal',
    title: 'FTA発効',
    message: '自由貿易協定が発効。全商品の価格が15%下落。',
    effect: (state) => applyPriceMultiplier(state, 0.85),
    type: 'positive',
  },
  {
    id: 'harvest',
    title: '豊作',
    message: '農作物の豊作で米・コーヒーの価格が25%下落。',
    effect: (state) => {
      ['rice', 'coffee'].forEach((goodId) => {
        Object.keys(state.prices).forEach((cityId) => {
          state.prices[cityId][goodId] = Math.round(state.prices[cityId][goodId] * 0.75);
        });
      });
    },
    type: 'positive',
  },
  {
    id: 'tech_boom',
    title: 'テックブーム',
    message: '半導体需要が急増。電子製品の価格が35%上昇。',
    effect: (state) => {
      Object.keys(state.prices).forEach((cityId) => {
        state.prices[cityId].electronics = Math.round(state.prices[cityId].electronics * 1.35);
      });
    },
    type: 'negative',
  },
  {
    id: 'pirate',
    title: '海賊出没',
    message: '航路で海賊に遭遇！所持金の5%を失った。',
    effect: (state) => {
      const loss = Math.round(state.money * 0.05);
      state.money -= loss;
      state.lastEventLoss = loss;
    },
    type: 'negative',
  },
  {
    id: 'investor',
    title: '投資家の支援',
    message: '現地の投資家から資金援助を受けた！$2,000を獲得。',
    effect: (state) => {
      state.money += 2000;
    },
    type: 'positive',
  },
];

let gameState = null;
let previousPrices = null;
let gameOver = false;

function createInitialState() {
  const prices = {};
  Object.keys(CITIES).forEach((cityId) => {
    prices[cityId] = generateCityPrices(cityId);
  });

  return {
    day: 1,
    money: CONFIG.initialMoney,
    currentCity: CONFIG.initialCity,
    cargo: {},
    prices,
    log: [{ day: 1, message: '東京港に到着。アジア貿易の旅が始まる。' }],
    traveling: false,
    travelDaysLeft: 0,
    travelDestination: null,
    currentEvent: null,
    totalProfit: 0,
  };
}

function generateCityPrices(cityId) {
  const city = CITIES[cityId];
  const prices = {};

  Object.keys(GOODS).forEach((goodId) => {
    const good = GOODS[goodId];
    let multiplier = 0.8 + Math.random() * 0.4;

    if (city.specialties.includes(goodId)) {
      multiplier *= 0.65;
    } else {
      multiplier *= 1.1;
    }

    prices[goodId] = Math.round(good.basePrice * multiplier);
  });

  return prices;
}

function applyPriceMultiplier(state, multiplier) {
  Object.keys(state.prices).forEach((cityId) => {
    Object.keys(state.prices[cityId]).forEach((goodId) => {
      state.prices[cityId][goodId] = Math.round(state.prices[cityId][goodId] * multiplier);
    });
  });
}

function getCargoUsed(cargo) {
  return Object.values(cargo).reduce((sum, qty) => sum + qty, 0);
}

function getCargoSpace(cargo) {
  return CONFIG.cargoCapacity - getCargoUsed(cargo);
}

function addLog(message) {
  gameState.log.unshift({ day: gameState.day, message });
  if (gameState.log.length > 50) gameState.log.pop();
}

function fluctuatePrices() {
  Object.keys(gameState.prices).forEach((cityId) => {
    Object.keys(gameState.prices[cityId]).forEach((goodId) => {
      const change = 0.9 + Math.random() * 0.2;
      gameState.prices[cityId][goodId] = Math.max(
        50,
        Math.round(gameState.prices[cityId][goodId] * change)
      );
    });
  });
}

function triggerRandomEvent() {
  if (Math.random() > 0.25) return null;

  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  event.effect(gameState);

  let message = event.message;
  if (event.id === 'pirate' && gameState.lastEventLoss) {
    message += ` (-$${gameState.lastEventLoss.toLocaleString()})`;
    delete gameState.lastEventLoss;
  }

  addLog(`【イベント】${event.title}: ${message}`);
  return { ...event, displayMessage: message };
}

function buyGood(goodId, quantity) {
  if (gameOver || gameState.traveling) return;

  const price = gameState.prices[gameState.currentCity][goodId];
  const totalCost = price * quantity;
  const space = getCargoSpace(gameState.cargo);

  if (quantity <= 0) return;
  if (quantity > space) {
    addLog(`積載量不足。あと${space}単位しか積めない。`);
    render();
    return;
  }
  if (totalCost > gameState.money) {
    addLog('資金が足りない。');
    render();
    return;
  }

  gameState.money -= totalCost;
  gameState.cargo[goodId] = (gameState.cargo[goodId] || 0) + quantity;

  const good = GOODS[goodId];
  addLog(`${good.name}を${quantity}単位購入 (-$${totalCost.toLocaleString()})`);
  render();
}

function sellGood(goodId, quantity) {
  if (gameOver || gameState.traveling) return;

  const owned = gameState.cargo[goodId] || 0;
  if (quantity <= 0 || quantity > owned) return;

  const price = gameState.prices[gameState.currentCity][goodId];
  const totalGain = price * quantity;

  gameState.money += totalGain;
  gameState.cargo[goodId] = owned - quantity;
  if (gameState.cargo[goodId] === 0) delete gameState.cargo[goodId];

  gameState.totalProfit += totalGain;

  const good = GOODS[goodId];
  addLog(`${good.name}を${quantity}単位売却 (+$${totalGain.toLocaleString()})`);
  render();
}

function startTravel(destinationId) {
  if (gameOver || gameState.traveling) return;
  if (destinationId === gameState.currentCity) return;

  const days = DISTANCES[gameState.currentCity][destinationId];
  gameState.traveling = true;
  gameState.travelDaysLeft = days;
  gameState.travelDestination = destinationId;

  const dest = CITIES[destinationId];
  addLog(`${dest.name}へ向けて出航 (${days}日)`);
  render();
}

function advanceTravel() {
  gameState.travelDaysLeft -= 1;
  gameState.day += 1;

  if (gameState.travelDaysLeft <= 0) {
    const dest = CITIES[gameState.travelDestination];
    gameState.currentCity = gameState.travelDestination;
    gameState.traveling = false;
    gameState.travelDestination = null;
    addLog(`${dest.name}に到着した。`);

    if (Math.random() < 0.15) {
      gameState.currentEvent = triggerRandomEvent();
    }
  } else if (Math.random() < 0.08) {
    gameState.currentEvent = triggerRandomEvent();
  }

  fluctuatePrices();
  checkGameEnd();
}

function nextDay() {
  if (gameOver) return;

  previousPrices = JSON.parse(JSON.stringify(gameState.prices[gameState.currentCity]));
  gameState.currentEvent = null;

  if (gameState.traveling) {
    advanceTravel();
  } else {
    gameState.day += 1;
    fluctuatePrices();

    if (Math.random() < 0.2) {
      gameState.currentEvent = triggerRandomEvent();
    }

    checkGameEnd();
  }

  render();
}

function checkGameEnd() {
  if (gameState.money >= CONFIG.winMoney) {
    gameOver = true;
    showGameEndModal(true);
  } else if (gameState.money < 0) {
    gameOver = true;
    showGameEndModal(false);
  } else if (gameState.day >= CONFIG.maxDays) {
    gameOver = true;
    showGameEndModal(gameState.money >= CONFIG.winMoney * 0.5);
  }
}

function showGameEndModal(success) {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const closeBtn = document.getElementById('modal-close');

  if (success) {
    content.innerHTML = `
      <h2>🎉 貿易王の誕生！</h2>
      <p>おめでとうございます！アジア全域で貿易を成功させ、巨万の富を築きました。</p>
      <p>最終資産: <strong style="color: var(--accent-gold)">$${gameState.money.toLocaleString()}</strong></p>
      <p>プレイ日数: ${gameState.day}日</p>
    `;
  } else {
    content.innerHTML = `
      <h2>💸 破産...</h2>
      <p>貿易の旅はここで終わりました。次こそはアジアの市場を制覇しましょう。</p>
      <p>最終資産: <strong style="color: var(--accent-crimson)">$${gameState.money.toLocaleString()}</strong></p>
      <p>プレイ日数: ${gameState.day}日</p>
    `;
  }

  closeBtn.textContent = 'もう一度プレイ';
  closeBtn.onclick = () => {
    modal.classList.add('hidden');
    gameState = createInitialState();
    gameOver = false;
    previousPrices = null;
    render();
    showIntroModal();
  };

  modal.classList.remove('hidden');
}

function showIntroModal() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const closeBtn = document.getElementById('modal-close');

  content.innerHTML = `
    <h2>⛩ アジア貿易シミュレーション</h2>
    <p>あなたは新進の貿易商。東アジア・東南アジアの8都市を行き来し、物価差を利用して富を築きましょう。</p>
    <ul>
      <li>初期資金: $${CONFIG.initialMoney.toLocaleString()}</li>
      <li>目標: $${CONFIG.winMoney.toLocaleString()} を ${CONFIG.maxDays}日以内に達成</li>
      <li>各都市には特産品があり、産地では安く買えます</li>
      <li>「次の日へ進む」で時間が進み、価格が変動します</li>
      <li>台風・祭り・FTAなどのイベントに注意！</li>
    </ul>
  `;

  closeBtn.textContent = '航海を始める';
  closeBtn.onclick = () => modal.classList.add('hidden');

  modal.classList.remove('hidden');
}

function saveGame() {
  localStorage.setItem(CONFIG.saveKey, JSON.stringify(gameState));
  addLog('ゲームをセーブした。');
  render();
}

function loadGame() {
  const saved = localStorage.getItem(CONFIG.saveKey);
  if (!saved) {
    addLog('セーブデータが見つかりません。');
    render();
    return;
  }

  gameState = JSON.parse(saved);
  gameOver = false;
  addLog('セーブデータをロードした。');
  render();
}

function getPriceTrend(goodId) {
  if (!previousPrices) return 'stable';
  const current = gameState.prices[gameState.currentCity][goodId];
  const prev = previousPrices[goodId];
  if (current > prev * 1.02) return 'up';
  if (current < prev * 0.98) return 'down';
  return 'stable';
}

function renderHeaderStats() {
  const el = document.getElementById('header-stats');
  const daysLeft = CONFIG.maxDays - gameState.day;
  const cargoUsed = getCargoUsed(gameState.cargo);

  el.innerHTML = `
    <div class="stat">
      <div class="stat__label">資金</div>
      <div class="stat__value ${gameState.money < 2000 ? 'stat__value--danger' : ''}">$${gameState.money.toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat__label">日数</div>
      <div class="stat__value">${gameState.day} / ${CONFIG.maxDays}</div>
    </div>
    <div class="stat">
      <div class="stat__label">残り日数</div>
      <div class="stat__value ${daysLeft <= 10 ? 'stat__value--danger' : ''}">${daysLeft}日</div>
    </div>
    <div class="stat">
      <div class="stat__label">積載</div>
      <div class="stat__value">${cargoUsed} / ${CONFIG.cargoCapacity}</div>
    </div>
  `;
}

function renderLocation() {
  const city = CITIES[gameState.currentCity];
  const el = document.getElementById('location-info');

  let travelStatus = '';
  if (gameState.traveling) {
    const dest = CITIES[gameState.travelDestination];
    travelStatus = `
      <div class="traveling-overlay">
        <div class="traveling-overlay__icon">🚢</div>
        <p>${dest.name}へ航行中...</p>
        <p>残り ${gameState.travelDaysLeft} 日</p>
      </div>
    `;
  }

  el.innerHTML = `
    ${travelStatus || `
      <div class="location-info__flag">${city.flag}</div>
      <div class="location-info__name">${city.name}</div>
      <div class="location-info__country">${city.country}</div>
      <p class="location-info__desc">${city.desc}</p>
      <p class="hint">特産: ${city.specialties.map((id) => GOODS[id].name).join('、')}</p>
    `}
  `;
}

function renderCargo() {
  const el = document.getElementById('cargo-list');
  document.getElementById('cargo-capacity').textContent = CONFIG.cargoCapacity;

  const entries = Object.entries(gameState.cargo);
  if (entries.length === 0) {
    el.innerHTML = '<div class="cargo-item__empty">貨物なし</div>';
    return;
  }

  el.innerHTML = entries.map(([goodId, qty]) => {
    const good = GOODS[goodId];
    return `
      <div class="cargo-item">
        <span><span class="cargo-item__icon">${good.icon}</span>${good.name}</span>
        <span>${qty} 単位</span>
      </div>
    `;
  }).join('');
}

function renderTravel() {
  const el = document.getElementById('travel-list');
  const currentId = gameState.currentCity;

  el.innerHTML = Object.keys(CITIES)
    .filter((id) => id !== currentId)
    .map((id) => {
      const city = CITIES[id];
      const days = DISTANCES[currentId][id];
      const disabled = gameState.traveling || gameOver;

      return `
        <button class="travel-btn" data-dest="${id}" ${disabled ? 'disabled' : ''}>
          <span>${city.flag} ${city.name}</span>
          <span class="travel-btn__days">${days}日</span>
        </button>
      `;
    }).join('');

  el.querySelectorAll('.travel-btn').forEach((btn) => {
    btn.addEventListener('click', () => startTravel(btn.dataset.dest));
  });
}

function renderMarket() {
  const city = CITIES[gameState.currentCity];
  document.getElementById('market-city').textContent = city.name;

  const eventBanner = document.getElementById('event-banner');
  if (gameState.currentEvent) {
    eventBanner.className = `event-banner event-banner--${gameState.currentEvent.type}`;
    eventBanner.innerHTML = `<strong>${gameState.currentEvent.title}</strong> — ${gameState.currentEvent.displayMessage}`;
    eventBanner.classList.remove('hidden');
  } else {
    eventBanner.classList.add('hidden');
  }

  const table = document.getElementById('market-table');
  const disabled = gameState.traveling || gameOver;

  let html = `
    <div class="market-row market-row--header">
      <span>商品</span>
      <span>価格</span>
      <span>動向</span>
      <span>所持</span>
      <span>取引</span>
    </div>
  `;

  Object.keys(GOODS).forEach((goodId) => {
    const good = GOODS[goodId];
    const price = gameState.prices[gameState.currentCity][goodId];
    const owned = gameState.cargo[goodId] || 0;
    const trend = getPriceTrend(goodId);
    const isSpecialty = city.specialties.includes(goodId);

    const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    const trendClass = trend === 'up' ? 'price--up' : trend === 'down' ? 'price--down' : 'price--stable';

    html += `
      <div class="market-row">
        <span class="good-name">
          <span class="good-icon">${good.icon}</span>
          ${good.name}
          ${isSpecialty ? '<span class="specialty-tag">特産</span>' : ''}
        </span>
        <span class="price ${trendClass}">$${price.toLocaleString()}</span>
        <span class="trend ${trendClass}">${trendSymbol}</span>
        <span>${owned}</span>
        <span class="market-actions-cell">
          <button class="btn btn--buy" data-action="buy" data-good="${goodId}" ${disabled ? 'disabled' : ''}>買う</button>
          <button class="btn btn--sell" data-action="sell" data-good="${goodId}" ${disabled || owned === 0 ? 'disabled' : ''}>売る</button>
        </span>
      </div>
    `;
  });

  table.innerHTML = html;

  table.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goodId = btn.dataset.good;
      const action = btn.dataset.action;
      const qty = parseInt(prompt(`${GOODS[goodId].name} — 数量を入力 (1〜${action === 'buy' ? getCargoSpace(gameState.cargo) : gameState.cargo[goodId] || 0}):`, '1'), 10);

      if (isNaN(qty)) return;
      if (action === 'buy') buyGood(goodId, qty);
      else sellGood(goodId, qty);
    });
  });
}

function renderLog() {
  const el = document.getElementById('game-log');
  el.innerHTML = gameState.log.map((entry) => `
    <div class="log-entry">
      <span class="log-entry__day">Day ${entry.day}</span>
      ${entry.message}
    </div>
  `).join('');
}

function render() {
  renderHeaderStats();
  renderLocation();
  renderCargo();
  renderTravel();
  renderMarket();
  renderLog();

  document.getElementById('btn-next-day').disabled = gameOver;
}

function init() {
  gameState = createInitialState();
  gameOver = false;
  previousPrices = null;

  document.getElementById('btn-next-day').addEventListener('click', nextDay);
  document.getElementById('btn-save').addEventListener('click', saveGame);
  document.getElementById('btn-load').addEventListener('click', loadGame);

  render();
  showIntroModal();
}

document.addEventListener('DOMContentLoaded', init);
