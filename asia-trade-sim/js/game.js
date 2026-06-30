/**
 * アジア貿易シミュレーション
 * インコタームズと輸出入費用を反映した貿易ゲーム
 */

const CONFIG = {
  initialMoney: 10000,
  initialCity: 'tokyo',
  cargoCapacity: 50,
  maxDays: 120,
  winMoney: 100000,
  saveKey: 'asia-trade-sim-save-v2',
  defaultIncoterm: 'FOB',
  personalTravelFee: 80,
};

const COST_TYPES = {
  freight: { label: '海上運賃', icon: '🚢' },
  insurance: { label: '海上保険料', icon: '🛡️' },
  exportClearance: { label: '輸出通関・書類', icon: '📋' },
  importClearance: { label: '輸入通関・書類', icon: '📄' },
  originPortHandling: { label: '積地港荷役(THC)', icon: '⚓' },
  destPortHandling: { label: '揚地港荷役(THC)', icon: '⚓' },
  importDuty: { label: '輸入関税', icon: '🏛️' },
  vat: { label: '輸入消費税/VAT', icon: '💴' },
  inlandTransport: { label: '内陸運送', icon: '🚛' },
};

const INCOTERMS = {
  EXW: {
    id: 'EXW',
    name: 'EXW',
    fullName: 'Ex Works（工場渡し）',
    desc: '売主は工場で引渡すのみ。運賃・保険・関税・通関費はすべて買主（あなた）負担。商品単価は最安。',
    sellerPays: [],
    buyerPays: ['inlandTransport', 'exportClearance', 'originPortHandling', 'freight', 'insurance', 'importClearance', 'destPortHandling', 'importDuty', 'vat'],
    purchaseModifier: 1.0,
    riskLevel: 'high',
  },
  FOB: {
    id: 'FOB',
    name: 'FOB',
    fullName: 'Free On Board（本船渡し）',
    desc: '出口港まで売主負担。本船積み後の海上運賃・保険・輸入関税は買主負担。国際貿易で最も一般的。',
    sellerPays: ['exportClearance', 'originPortHandling'],
    buyerPays: ['freight', 'insurance', 'importClearance', 'destPortHandling', 'importDuty', 'vat'],
    purchaseModifier: 1.03,
    riskLevel: 'medium',
  },
  CIF: {
    id: 'CIF',
    name: 'CIF',
    fullName: 'Cost, Insurance & Freight（運賃保険料込み）',
    desc: '目的港まで運賃・保険は売主負担。到着後の関税・通関・港荷役は買主負担。',
    sellerPays: ['exportClearance', 'originPortHandling', 'freight', 'insurance'],
    buyerPays: ['importClearance', 'destPortHandling', 'importDuty', 'vat'],
    purchaseModifier: 1.07,
    riskLevel: 'low',
  },
  DDP: {
    id: 'DDP',
    name: 'DDP',
    fullName: 'Delivered Duty Paid（関税込持込渡し）',
    desc: '関税・通関込みで指定場所まで売主がすべて負担。商品単価は高いが到着後の追加費用なし。',
    sellerPays: ['exportClearance', 'originPortHandling', 'freight', 'insurance', 'importClearance', 'destPortHandling', 'importDuty', 'vat'],
    buyerPays: [],
    purchaseModifier: 1.15,
    riskLevel: 'minimal',
  },
};

const FTA_GROUPS = {
  rcep: ['tokyo', 'shanghai', 'seoul', 'singapore', 'bangkok', 'hanoi', 'jakarta'],
  asean: ['singapore', 'bangkok', 'hanoi', 'jakarta'],
  jpkorea: ['tokyo', 'seoul'],
};

const CITIES = {
  tokyo: {
    id: 'tokyo', name: '東京', country: '日本', flag: '🇯🇵',
    desc: 'テクノロジーと精密機器の中心地。電子製品が安く手に入る。',
    specialties: ['electronics', 'automobiles'],
    tariffRate: 0.05, vatRate: 0.10, portFee: 12, customsFee: 180,
  },
  shanghai: {
    id: 'shanghai', name: '上海', country: '中国', flag: '🇨🇳',
    desc: '世界最大級の港。製造業のハブで衣料品・電子部品が豊富。',
    specialties: ['textiles', 'electronics'],
    tariffRate: 0.08, vatRate: 0.13, portFee: 8, customsFee: 150,
  },
  seoul: {
    id: 'seoul', name: 'ソウル', country: '韓国', flag: '🇰🇷',
    desc: 'K-POPと半導体の街。化粧品と電子製品の需要が高い。',
    specialties: ['cosmetics', 'electronics'],
    tariffRate: 0.06, vatRate: 0.10, portFee: 10, customsFee: 160,
  },
  singapore: {
    id: 'singapore', name: 'シンガポール', country: 'シンガポール', flag: '🇸🇬',
    desc: '東南アジアの金融・物流ハブ。高級品の取引が活発。',
    specialties: ['spices', 'seafood'],
    tariffRate: 0.0, vatRate: 0.09, portFee: 15, customsFee: 120,
  },
  bangkok: {
    id: 'bangkok', name: 'バンコク', country: 'タイ', flag: '🇹🇭',
    desc: '香辛料と米の産地。観光地としても栄える交易の要衝。',
    specialties: ['spices', 'rice'],
    tariffRate: 0.10, vatRate: 0.07, portFee: 7, customsFee: 140,
  },
  mumbai: {
    id: 'mumbai', name: 'ムンバイ', country: 'インド', flag: '🇮🇳',
    desc: '南アジア最大の商業都市。宝石・香辛料・繊維の集散地。',
    specialties: ['spices', 'textiles'],
    tariffRate: 0.18, vatRate: 0.18, portFee: 9, customsFee: 220,
  },
  hanoi: {
    id: 'hanoi', name: 'ハノイ', country: 'ベトナム', flag: '🇻🇳',
    desc: 'コーヒーとシルクの産地。急成長する製造業の拠点。',
    specialties: ['coffee', 'silk'],
    tariffRate: 0.12, vatRate: 0.10, portFee: 6, customsFee: 130,
  },
  jakarta: {
    id: 'jakarta', name: 'ジャカルタ', country: 'インドネシア', flag: '🇮🇩',
    desc: '群島国家の首都。コーヒー・パーム油・海産物が豊富。',
    specialties: ['coffee', 'seafood'],
    tariffRate: 0.11, vatRate: 0.11, portFee: 7, customsFee: 145,
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
  electronics: { id: 'electronics', name: '電子製品', icon: '📱', basePrice: 800, dutyMultiplier: 1.0, insuranceRate: 0.012, weight: 1.2 },
  textiles: { id: 'textiles', name: '繊維製品', icon: '👔', basePrice: 300, dutyMultiplier: 0.8, insuranceRate: 0.006, weight: 0.8 },
  spices: { id: 'spices', name: '香辛料', icon: '🌶️', basePrice: 250, dutyMultiplier: 0.6, insuranceRate: 0.008, weight: 0.5 },
  rice: { id: 'rice', name: '米', icon: '🍚', basePrice: 150, dutyMultiplier: 0.5, insuranceRate: 0.005, weight: 1.5 },
  silk: { id: 'silk', name: 'シルク', icon: '🧵', basePrice: 600, dutyMultiplier: 0.9, insuranceRate: 0.007, weight: 0.6 },
  seafood: { id: 'seafood', name: '海産物', icon: '🦐', basePrice: 400, dutyMultiplier: 0.7, insuranceRate: 0.015, weight: 1.3 },
  coffee: { id: 'coffee', name: 'コーヒー', icon: '☕', basePrice: 350, dutyMultiplier: 0.55, insuranceRate: 0.006, weight: 1.0 },
  cosmetics: { id: 'cosmetics', name: '化粧品', icon: '💄', basePrice: 500, dutyMultiplier: 1.1, insuranceRate: 0.008, weight: 0.7 },
  automobiles: { id: 'automobiles', name: '自動車部品', icon: '🚗', basePrice: 1200, dutyMultiplier: 1.2, insuranceRate: 0.010, weight: 2.0 },
};

const EVENTS = [
  {
    id: 'typhoon', title: '台風接近', type: 'negative',
    message: '台風で海運混乱。運賃20%増＋全商品価格20%上昇。',
    effect: (state) => { applyPriceMultiplier(state, 1.2); state.freightSurcharge = 1.2; },
  },
  {
    id: 'festival', title: '地域祭り', type: 'positive',
    message: '祭りで需要急増！特産品の価格が30%上昇。',
    effect: (state) => {
      CITIES[state.currentCity].specialties.forEach((goodId) => {
        state.prices[state.currentCity][goodId] = Math.round(state.prices[state.currentCity][goodId] * 1.3);
      });
    },
  },
  {
    id: 'trade_deal', title: 'FTA発効', type: 'positive',
    message: '新FTA発効。関税率が一時的に50%減＋商品価格15%下落。',
    effect: (state) => { applyPriceMultiplier(state, 0.85); state.ftaBonus = 0.5; },
  },
  {
    id: 'harvest', title: '豊作', type: 'positive',
    message: '農作物の豊作で米・コーヒーの価格が25%下落。',
    effect: (state) => {
      ['rice', 'coffee'].forEach((goodId) => {
        Object.keys(state.prices).forEach((cityId) => {
          state.prices[cityId][goodId] = Math.round(state.prices[cityId][goodId] * 0.75);
        });
      });
    },
  },
  {
    id: 'tech_boom', title: 'テックブーム', type: 'negative',
    message: '半導体需要急増。電子製品の価格が35%上昇。',
    effect: (state) => {
      Object.keys(state.prices).forEach((cityId) => {
        state.prices[cityId].electronics = Math.round(state.prices[cityId].electronics * 1.35);
      });
    },
  },
  {
    id: 'customs_delay', title: '通関遅延', type: 'negative',
    message: '輸入通関検査強化。次の到着時に通関費用が50%増加。',
    effect: (state) => { state.customsSurcharge = 1.5; },
  },
  {
    id: 'pirate', title: '海賊出没', type: 'negative',
    message: '航路で海賊に遭遇！所持金の5%を失った。',
    effect: (state) => {
      const loss = Math.round(state.money * 0.05);
      state.money -= loss;
      state.lastEventLoss = loss;
    },
  },
  {
    id: 'investor', title: '投資家の支援', type: 'positive',
    message: '現地投資家から資金援助！$2,000を獲得。',
    effect: (state) => { state.money += 2000; },
  },
];

let gameState = null;
let previousPrices = null;
let gameOver = false;
let pendingTravel = null;
let selectedTravelIncoterm = CONFIG.defaultIncoterm;

function createInitialState() {
  const prices = {};
  Object.keys(CITIES).forEach((cityId) => { prices[cityId] = generateCityPrices(cityId); });

  return {
    day: 1,
    money: CONFIG.initialMoney,
    currentCity: CONFIG.initialCity,
    cargo: {},
    cargoMeta: {},
    prices,
    log: [{ day: 1, message: '東京港に到着。インコタームズを確認し、貿易の旅を始めよう。' }],
    traveling: false,
    travelDaysLeft: 0,
    travelDestination: null,
    currentEvent: null,
    totalProfit: 0,
    selectedIncoterm: CONFIG.defaultIncoterm,
    lastTradeCosts: null,
    totalTradeCosts: 0,
    freightSurcharge: 1.0,
    customsSurcharge: 1.0,
    ftaBonus: null,
  };
}

function generateCityPrices(cityId) {
  const city = CITIES[cityId];
  const prices = {};
  Object.keys(GOODS).forEach((goodId) => {
    const good = GOODS[goodId];
    let multiplier = 0.8 + Math.random() * 0.4;
    if (city.specialties.includes(goodId)) multiplier *= 0.65;
    else multiplier *= 1.1;
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

function getCargoWeight(cargo) {
  return Object.entries(cargo).reduce((sum, [goodId, qty]) => sum + qty * GOODS[goodId].weight, 0);
}

function getCargoValue(cargo, cityId, useMeta) {
  return Object.entries(cargo).reduce((sum, [goodId, qty]) => {
    const unitVal = useMeta && gameState.cargoMeta[goodId]
      ? gameState.cargoMeta[goodId].avgCost
      : gameState.prices[cityId][goodId];
    return sum + unitVal * qty;
  }, 0);
}

function getFtaReduction(originId, destId) {
  if (originId === destId) return 1.0;
  let reduction = 0;
  Object.values(FTA_GROUPS).forEach((group) => {
    if (group.includes(originId) && group.includes(destId)) reduction = Math.max(reduction, 0.5);
  });
  if (FTA_GROUPS.jpkorea.includes(originId) && FTA_GROUPS.jpkorea.includes(destId)) reduction = Math.max(reduction, 0.6);
  if (gameState.ftaBonus) reduction = Math.max(reduction, gameState.ftaBonus);
  return reduction;
}

function calculateImportDuty(fromCityId, toCityId, cargo) {
  const dest = CITIES[toCityId];
  const ftaReduction = getFtaReduction(fromCityId, toCityId);
  let totalDuty = 0;

  Object.entries(cargo).forEach(([goodId, qty]) => {
    const good = GOODS[goodId];
    const meta = gameState.cargoMeta[goodId];
    const cifValue = meta ? meta.avgCost * qty : gameState.prices[toCityId][goodId] * qty;
    const effectiveRate = dest.tariffRate * good.dutyMultiplier * (1 - ftaReduction);
    totalDuty += Math.round(cifValue * effectiveRate);
  });

  return totalDuty;
}

function calculateVat(toCityId, cargo, cifTotal, dutyTotal) {
  const dest = CITIES[toCityId];
  const taxableBase = cifTotal + dutyTotal;
  return Math.round(taxableBase * dest.vatRate);
}

function calculateAllTradeCosts(fromCityId, toCityId, cargo, incotermId) {
  const incoterm = INCOTERMS[incotermId];
  const days = DISTANCES[fromCityId][toCityId];
  const origin = CITIES[fromCityId];
  const dest = CITIES[toCityId];
  const cargoUnits = getCargoUsed(cargo);
  const cargoWeight = getCargoWeight(cargo);
  const cargoValue = getCargoValue(cargo, fromCityId, true);

  let insuranceBase = 0;
  Object.entries(cargo).forEach(([goodId, qty]) => {
    const meta = gameState.cargoMeta[goodId];
    const val = meta ? meta.avgCost * qty : gameState.prices[fromCityId][goodId] * qty;
    insuranceBase += val * GOODS[goodId].insuranceRate;
  });

  const freight = Math.round(65 * days * cargoWeight * (gameState.freightSurcharge || 1));
  const insurance = Math.round(insuranceBase);
  const exportClearance = Math.round(origin.customsFee * 0.6 + cargoUnits * 4);
  const importClearance = Math.round(dest.customsFee * (gameState.customsSurcharge || 1) + cargoUnits * 6);
  const originPortHandling = Math.round(origin.portFee * cargoUnits);
  const destPortHandling = Math.round(dest.portFee * cargoUnits);
  const inlandTransport = Math.round(30 + cargoUnits * 3);
  const importDuty = calculateImportDuty(fromCityId, toCityId, cargo);
  const cifTotal = cargoValue + freight + insurance;
  const vat = calculateVat(toCityId, cargo, cifTotal, importDuty);

  const allCosts = {
    freight, insurance, exportClearance, importClearance,
    originPortHandling, destPortHandling, importDuty, vat, inlandTransport,
  };

  const sellerPays = {};
  const buyerPays = {};
  let playerTotal = 0;
  let sellerTotal = 0;

  incoterm.sellerPays.forEach((key) => {
    sellerPays[key] = allCosts[key];
    sellerTotal += allCosts[key];
  });
  incoterm.buyerPays.forEach((key) => {
    buyerPays[key] = allCosts[key];
    playerTotal += allCosts[key];
  });

  const purchasePremium = Math.round(cargoValue * (incoterm.purchaseModifier - 1));

  return {
    allCosts, sellerPays, buyerPays,
    playerTotal: playerTotal + purchasePremium,
    sellerTotal,
    purchasePremium,
    cargoValue,
    cargoUnits,
    days,
    ftaReduction: getFtaReduction(fromCityId, toCityId),
  };
}

function addLog(message) {
  gameState.log.unshift({ day: gameState.day, message });
  if (gameState.log.length > 60) gameState.log.pop();
}

function fluctuatePrices() {
  Object.keys(gameState.prices).forEach((cityId) => {
    Object.keys(gameState.prices[cityId]).forEach((goodId) => {
      const change = 0.9 + Math.random() * 0.2;
      gameState.prices[cityId][goodId] = Math.max(50, Math.round(gameState.prices[cityId][goodId] * change));
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

  const incoterm = INCOTERMS[gameState.selectedIncoterm];
  const basePrice = gameState.prices[gameState.currentCity][goodId];
  const unitPrice = Math.round(basePrice * incoterm.purchaseModifier);
  const totalCost = unitPrice * quantity;
  const space = getCargoSpace(gameState.cargo);

  if (quantity <= 0) return;
  if (quantity > space) { addLog(`積載量不足。あと${space}単位しか積めない。`); render(); return; }
  if (totalCost > gameState.money) { addLog('資金が足りない。'); render(); return; }

  gameState.money -= totalCost;
  gameState.cargo[goodId] = (gameState.cargo[goodId] || 0) + quantity;

  const prev = gameState.cargoMeta[goodId];
  if (prev) {
    const totalQty = prev.qty + quantity;
    gameState.cargoMeta[goodId] = {
      origin: gameState.currentCity,
      avgCost: Math.round((prev.avgCost * prev.qty + unitPrice * quantity) / totalQty),
      qty: totalQty,
    };
  } else {
    gameState.cargoMeta[goodId] = { origin: gameState.currentCity, avgCost: unitPrice, qty: quantity };
  }
  gameState.cargoMeta[goodId].qty = gameState.cargo[goodId];

  const good = GOODS[goodId];
  const premiumNote = incoterm.purchaseModifier > 1
    ? ` (${incoterm.name}条件 +${Math.round((incoterm.purchaseModifier - 1) * 100)}%)`
    : '';
  addLog(`${good.name}を${quantity}単位購入 (-$${totalCost.toLocaleString()})${premiumNote}`);
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
  if (gameState.cargo[goodId] === 0) {
    delete gameState.cargo[goodId];
    delete gameState.cargoMeta[goodId];
  } else {
    gameState.cargoMeta[goodId].qty = gameState.cargo[goodId];
  }

  gameState.totalProfit += totalGain;
  addLog(`${GOODS[goodId].name}を${quantity}単位売却 (+$${totalGain.toLocaleString()})`);
  render();
}

function openTravelModal(destinationId) {
  if (gameOver || gameState.traveling) return;
  pendingTravel = destinationId;
  selectedTravelIncoterm = gameState.selectedIncoterm;
  renderTravelModal();
  document.getElementById('travel-modal-overlay').classList.remove('hidden');
}

function closeTravelModal() {
  pendingTravel = null;
  document.getElementById('travel-modal-overlay').classList.add('hidden');
}

function renderTravelModal() {
  const from = CITIES[gameState.currentCity];
  const to = CITIES[pendingTravel];
  const cargoUnits = getCargoUsed(gameState.cargo);
  const hasCargo = cargoUnits > 0;

  document.getElementById('travel-modal-route').textContent =
    `${from.flag} ${from.name} → ${to.flag} ${to.name}（${DISTANCES[gameState.currentCity][pendingTravel]}日）`;

  const incotermEl = document.getElementById('travel-incoterm-options');

  if (!hasCargo) {
    incotermEl.innerHTML = '<p class="hint">貨物なし — 個人移動（港使用料のみ）</p>';
    renderCostBreakdown(null);
    return;
  }

  incotermEl.innerHTML = Object.values(INCOTERMS).map((term) => `
    <label class="incoterm-option ${selectedTravelIncoterm === term.id ? 'incoterm-option--active' : ''}">
      <input type="radio" name="travel-incoterm" value="${term.id}" ${selectedTravelIncoterm === term.id ? 'checked' : ''}>
      <div class="incoterm-option__head">
        <strong>${term.name}</strong>
        <span>${term.fullName}</span>
      </div>
      <p>${term.desc}</p>
    </label>
  `).join('');

  incotermEl.querySelectorAll('input[name="travel-incoterm"]').forEach((input) => {
    input.addEventListener('change', () => {
      selectedTravelIncoterm = input.value;
      gameState.selectedIncoterm = input.value;
      renderTravelModal();
      renderIncotermPanel();
    });
  });

  renderCostBreakdown(selectedTravelIncoterm);
}

function renderCostBreakdown(incotermId) {
  const el = document.getElementById('travel-cost-breakdown');
  const cargoUnits = getCargoUsed(gameState.cargo);

  if (cargoUnits === 0) {
    const fee = CONFIG.personalTravelFee;
    el.innerHTML = `
      <h3>費用見積もり</h3>
      <div class="cost-row"><span>港使用料・渡航費</span><span>$${fee.toLocaleString()}</span></div>
      <div class="cost-row cost-row--total"><span>あなたの負担</span><span>$${fee.toLocaleString()}</span></div>
    `;
    return;
  }

  const costs = calculateAllTradeCosts(gameState.currentCity, pendingTravel, gameState.cargo, incotermId);
  const incoterm = INCOTERMS[incotermId];

  let html = `<h3>費用内訳 — ${incoterm.name}（${incoterm.fullName}）</h3>`;

  if (costs.ftaReduction > 0) {
    html += `<p class="cost-fta">✅ FTA適用: 関税率 ${Math.round(costs.ftaReduction * 100)}% 減免</p>`;
  }

  html += '<div class="cost-section"><h4>あなた（輸入者）の負担</h4>';
  if (Object.keys(costs.buyerPays).length === 0 && costs.purchasePremium === 0) {
    html += '<p class="hint">追加費用なし（DDP条件）</p>';
  } else {
    Object.entries(costs.buyerPays).forEach(([key, val]) => {
      html += `<div class="cost-row"><span>${COST_TYPES[key].icon} ${COST_TYPES[key].label}</span><span>$${val.toLocaleString()}</span></div>`;
    });
    if (costs.purchasePremium > 0) {
      html += `<div class="cost-row"><span>📦 条件付き購入プレミアム</span><span>$${costs.purchasePremium.toLocaleString()}</span></div>`;
    }
  }
  html += `<div class="cost-row cost-row--total"><span>合計（自己負担）</span><span>$${costs.playerTotal.toLocaleString()}</span></div></div>`;

  html += '<div class="cost-section cost-section--seller"><h4>売主（相手方）の負担</h4>';
  if (Object.keys(costs.sellerPays).length === 0) {
    html += '<p class="hint">なし（EXW条件）</p>';
  } else {
    Object.entries(costs.sellerPays).forEach(([key, val]) => {
      html += `<div class="cost-row"><span>${COST_TYPES[key].icon} ${COST_TYPES[key].label}</span><span>$${val.toLocaleString()}</span></div>`;
    });
  }
  html += `<div class="cost-row"><span>売主負担合計</span><span>$${costs.sellerTotal.toLocaleString()}</span></div></div>`;

  html += `<p class="hint">CIF価格（税関評価基礎）: $${(costs.cargoValue + (costs.allCosts.freight || 0) + (costs.allCosts.insurance || 0)).toLocaleString()}</p>`;

  el.innerHTML = html;
}

function confirmTravel() {
  if (!pendingTravel) return;

  const destId = pendingTravel;
  const fromId = gameState.currentCity;
  const days = DISTANCES[fromId][destId];
  const cargoUnits = getCargoUsed(gameState.cargo);
  let playerCost = CONFIG.personalTravelFee;
  let costDetail = null;

  if (cargoUnits > 0) {
    costDetail = calculateAllTradeCosts(fromId, destId, gameState.cargo, selectedTravelIncoterm);
    playerCost = costDetail.playerTotal;

    if (playerCost > gameState.money) {
      addLog(`資金不足。${INCOTERMS[selectedTravelIncoterm].name}条件の貿易費用 $${playerCost.toLocaleString()} が必要。`);
      render();
      return;
    }

    gameState.money -= playerCost;
    gameState.totalTradeCosts += playerCost;
    gameState.lastTradeCosts = {
      incoterm: selectedTravelIncoterm,
      from: fromId,
      to: destId,
      buyerPays: costDetail.buyerPays,
      sellerPays: costDetail.sellerPays,
      playerTotal: playerCost,
      ftaReduction: costDetail.ftaReduction,
    };

    const incoterm = INCOTERMS[selectedTravelIncoterm];
    addLog(`${CITIES[destId].name}へ ${incoterm.name}（${incoterm.fullName}）で出航`);
    addLog(`貿易費用 -$${playerCost.toLocaleString()}（運賃・保険・関税・通関等）`);
  } else {
    gameState.money -= playerCost;
    addLog(`${CITIES[destId].name}へ移動（渡航費 -$${playerCost.toLocaleString()}）`);
  }

  gameState.selectedIncoterm = selectedTravelIncoterm;
  gameState.traveling = true;
  gameState.travelDaysLeft = days;
  gameState.travelDestination = destId;
  gameState.customsSurcharge = 1.0;
  gameState.freightSurcharge = 1.0;
  gameState.ftaBonus = null;

  closeTravelModal();
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
    addLog(`${dest.name}に到着。通関完了。`);

    if (Math.random() < 0.15) gameState.currentEvent = triggerRandomEvent();
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

  if (gameState.traveling) advanceTravel();
  else {
    gameState.day += 1;
    fluctuatePrices();
    if (Math.random() < 0.2) gameState.currentEvent = triggerRandomEvent();
    checkGameEnd();
  }

  render();
}

function checkGameEnd() {
  if (gameState.money >= CONFIG.winMoney) { gameOver = true; showGameEndModal(true); }
  else if (gameState.money < 0) { gameOver = true; showGameEndModal(false); }
  else if (gameState.day >= CONFIG.maxDays) {
    gameOver = true;
    showGameEndModal(gameState.money >= CONFIG.winMoney * 0.5);
  }
}

function showGameEndModal(success) {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const closeBtn = document.getElementById('modal-close');

  content.innerHTML = success ? `
    <h2>🎉 貿易王の誕生！</h2>
    <p>インコタームズを駆使し、アジア全域で貿易に成功しました。</p>
    <p>最終資産: <strong style="color: var(--accent-gold)">$${gameState.money.toLocaleString()}</strong></p>
    <p>累計貿易費用: $${gameState.totalTradeCosts.toLocaleString()}</p>
    <p>プレイ日数: ${gameState.day}日</p>
  ` : `
    <h2>💸 破産...</h2>
    <p>関税・運賃・通関費用が利益を圧迫しました。次こそ成功を。</p>
    <p>最終資産: <strong style="color: var(--accent-crimson)">$${gameState.money.toLocaleString()}</strong></p>
    <p>累計貿易費用: $${gameState.totalTradeCosts.toLocaleString()}</p>
    <p>プレイ日数: ${gameState.day}日</p>
  `;

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
    <p>インコタームズ（貿易条件）と実際の輸出入費用を学びながら、アジア市場で富を築きましょう。</p>
    <ul>
      <li>初期資金: $${CONFIG.initialMoney.toLocaleString()} / 目標: $${CONFIG.winMoney.toLocaleString()}（${CONFIG.maxDays}日以内）</li>
      <li><strong>EXW</strong> — 最安購入だが運賃・関税すべて自己負担</li>
      <li><strong>FOB</strong> — 本船渡し。海上運賃・保険・関税は自己負担（標準）</li>
      <li><strong>CIF</strong> — 目的港まで運賃・保険込み。関税・通関のみ自己負担</li>
      <li><strong>DDP</strong> — 関税込み持込渡し。到着後の追加費用なし</li>
      <li>費用項目: 海上運賃、保険料、港荷役(THC)、輸出入通関、関税、VAT</li>
      <li>RCEP・ASEAN等のFTAで関税が減免される場合あり</li>
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
  if (!saved) { addLog('セーブデータが見つかりません。'); render(); return; }
  gameState = JSON.parse(saved);
  gameState.cargoMeta = gameState.cargoMeta || {};
  gameState.totalTradeCosts = gameState.totalTradeCosts || 0;
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
    <div class="stat"><div class="stat__label">資金</div>
      <div class="stat__value ${gameState.money < 2000 ? 'stat__value--danger' : ''}">$${gameState.money.toLocaleString()}</div></div>
    <div class="stat"><div class="stat__label">日数</div>
      <div class="stat__value">${gameState.day} / ${CONFIG.maxDays}</div></div>
    <div class="stat"><div class="stat__label">残り</div>
      <div class="stat__value ${daysLeft <= 10 ? 'stat__value--danger' : ''}">${daysLeft}日</div></div>
    <div class="stat"><div class="stat__label">積載</div>
      <div class="stat__value">${cargoUsed} / ${CONFIG.cargoCapacity}</div></div>
    <div class="stat"><div class="stat__label">貿易費用累計</div>
      <div class="stat__value">$${gameState.totalTradeCosts.toLocaleString()}</div></div>
  `;
}

function renderLocation() {
  const city = CITIES[gameState.currentCity];
  const el = document.getElementById('location-info');
  const destTariff = Math.round(city.tariffRate * 100);

  if (gameState.traveling) {
    const dest = CITIES[gameState.travelDestination];
    el.innerHTML = `
      <div class="traveling-overlay">
        <div class="traveling-overlay__icon">🚢</div>
        <p>${dest.name}へ航行中...</p>
        <p>残り ${gameState.travelDaysLeft} 日</p>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="location-info__flag">${city.flag}</div>
    <div class="location-info__name">${city.name}</div>
    <div class="location-info__country">${city.country}</div>
    <p class="location-info__desc">${city.desc}</p>
    <p class="hint">特産: ${city.specialties.map((id) => GOODS[id].name).join('、')}</p>
    <p class="hint">基本関税率: ${destTariff}% / VAT: ${Math.round(city.vatRate * 100)}%</p>
  `;
}

function renderIncotermPanel() {
  const el = document.getElementById('incoterm-panel');
  const current = INCOTERMS[gameState.selectedIncoterm];

  el.innerHTML = Object.values(INCOTERMS).map((term) => `
    <button class="incoterm-btn ${gameState.selectedIncoterm === term.id ? 'incoterm-btn--active' : ''}"
      data-incoterm="${term.id}" ${gameState.traveling || gameOver ? 'disabled' : ''}>
      <strong>${term.name}</strong>
      <span>${term.fullName}</span>
    </button>
  `).join('') + `<p class="hint incoterm-hint">${current.desc}</p>`;

  el.querySelectorAll('.incoterm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      gameState.selectedIncoterm = btn.dataset.incoterm;
      renderIncotermPanel();
    });
  });
}

function renderCostSummary() {
  const el = document.getElementById('cost-summary');
  const last = gameState.lastTradeCosts;

  if (!last) {
    el.innerHTML = '<p class="hint">まだ貿易費用の記録がありません。</p>';
    return;
  }

  const incoterm = INCOTERMS[last.incoterm];
  let html = `<p><strong>${incoterm.name}</strong>: ${CITIES[last.from].name} → ${CITIES[last.to].name}</p>`;
  html += `<p class="cost-total">自己負担: -$${last.playerTotal.toLocaleString()}</p>`;

  Object.entries(last.buyerPays).forEach(([key, val]) => {
    html += `<div class="cost-mini">${COST_TYPES[key].label}: $${val.toLocaleString()}</div>`;
  });

  if (last.ftaReduction > 0) {
    html += `<p class="cost-fta">FTA減税 ${Math.round(last.ftaReduction * 100)}% 適用</p>`;
  }

  el.innerHTML = html;
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
    const meta = gameState.cargoMeta[goodId];
    const originLabel = meta ? CITIES[meta.origin].name : '—';
    return `
      <div class="cargo-item">
        <span><span class="cargo-item__icon">${good.icon}</span>${good.name}</span>
        <span>${qty}単位<br><small class="hint">原産: ${originLabel} / $${meta ? meta.avgCost.toLocaleString() : '—'}</small></span>
      </div>`;
  }).join('');
}

function renderTravel() {
  const el = document.getElementById('travel-list');
  const currentId = gameState.currentCity;

  el.innerHTML = Object.keys(CITIES).filter((id) => id !== currentId).map((id) => {
    const city = CITIES[id];
    const days = DISTANCES[currentId][id];
    const disabled = gameState.traveling || gameOver;
    return `
      <button class="travel-btn" data-dest="${id}" ${disabled ? 'disabled' : ''}>
        <span>${city.flag} ${city.name}</span>
        <span class="travel-btn__days">${days}日</span>
      </button>`;
  }).join('');

  el.querySelectorAll('.travel-btn').forEach((btn) => {
    btn.addEventListener('click', () => openTravelModal(btn.dataset.dest));
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
  const incoterm = INCOTERMS[gameState.selectedIncoterm];

  let html = `
    <div class="market-row market-row--header">
      <span>商品</span><span>価格 (${incoterm.name})</span><span>動向</span><span>所持</span><span>取引</span>
    </div>`;

  Object.keys(GOODS).forEach((goodId) => {
    const good = GOODS[goodId];
    const basePrice = gameState.prices[gameState.currentCity][goodId];
    const price = Math.round(basePrice * incoterm.purchaseModifier);
    const owned = gameState.cargo[goodId] || 0;
    const trend = getPriceTrend(goodId);
    const isSpecialty = city.specialties.includes(goodId);
    const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    const trendClass = trend === 'up' ? 'price--up' : trend === 'down' ? 'price--down' : 'price--stable';

    html += `
      <div class="market-row">
        <span class="good-name"><span class="good-icon">${good.icon}</span>${good.name}
          ${isSpecialty ? '<span class="specialty-tag">特産</span>' : ''}</span>
        <span class="price ${trendClass}">$${price.toLocaleString()}</span>
        <span class="trend ${trendClass}">${trendSymbol}</span>
        <span>${owned}</span>
        <span class="market-actions-cell">
          <button class="btn btn--buy" data-action="buy" data-good="${goodId}" ${disabled ? 'disabled' : ''}>買う</button>
          <button class="btn btn--sell" data-action="sell" data-good="${goodId}" ${disabled || owned === 0 ? 'disabled' : ''}>売る</button>
        </span>
      </div>`;
  });

  table.innerHTML = html;
  table.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goodId = btn.dataset.good;
      const action = btn.dataset.action;
      const max = action === 'buy' ? getCargoSpace(gameState.cargo) : gameState.cargo[goodId] || 0;
      const qty = parseInt(prompt(`${GOODS[goodId].name} — 数量 (1〜${max}):`, '1'), 10);
      if (isNaN(qty)) return;
      if (action === 'buy') buyGood(goodId, qty);
      else sellGood(goodId, qty);
    });
  });
}

function renderLog() {
  document.getElementById('game-log').innerHTML = gameState.log.map((entry) => `
    <div class="log-entry"><span class="log-entry__day">Day ${entry.day}</span>${entry.message}</div>
  `).join('');
}

function render() {
  renderHeaderStats();
  renderLocation();
  renderIncotermPanel();
  renderCargo();
  renderTravel();
  renderCostSummary();
  renderMarket();
  renderLog();
  document.getElementById('btn-next-day').disabled = gameOver;
}

function init() {
  gameState = createInitialState();
  gameOver = false;
  previousPrices = null;
  pendingTravel = null;

  document.getElementById('btn-next-day').addEventListener('click', nextDay);
  document.getElementById('btn-save').addEventListener('click', saveGame);
  document.getElementById('btn-load').addEventListener('click', loadGame);
  document.getElementById('travel-cancel').addEventListener('click', closeTravelModal);
  document.getElementById('travel-confirm').addEventListener('click', confirmTravel);

  render();
  showIntroModal();
}

document.addEventListener('DOMContentLoaded', init);
