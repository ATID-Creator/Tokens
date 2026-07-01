/**
 * アジア貿易シミュレーション — メインゲーム & UI
 */

import {
  CONFIG, CITIES, GOODS, INCOTERMS, EVENTS, PAYMENT_TERMS, DISTANCES,
  TRANSPORT_MODES, CUSTOMS_BROKERS, FORWARDERS, TRADE_DOCUMENTS,
  BANKS, CONTAINER_TYPES, CUSTOMS_SYSTEMS,
  initWarehouses, generateCityPrices, getDefaultBank, getContainerYards,
  getAvailableModes, getAvailableCarriers, isRailAvailable, resolveCustomsSystemForRoute,
} from './data.js';

import {
  getCargoUsed, calculateTradeCosts, createShipment,
  removeCargoFromWarehouse, advanceAllShipments, formatCostBreakdown,
  getStageLabel, getStageIcon,
} from './trade-engine.js';

function getCargoSpace(cargo) {
  return CONFIG.warehouseCapacity - getCargoUsed(cargo);
}

let gameState = null;
let previousPrices = null;
let gameOver = false;
let pendingShipment = null;
let shipmentForm = {
  destId: null,
  incoterm: CONFIG.defaultIncoterm,
  mode: 'sea',
  carrier: 'one',
  broker: 'standard',
  forwarder: 'direct',
  includeCO: false,
  paymentTerm: 'tt_advance',
  bankId: 'mufg',
  containerTypeId: 'gp20',
  originCyId: null,
  destCyId: null,
  shipAll: true,
};

function createInitialState() {
  const prices = {};
  Object.keys(CITIES).forEach((id) => { prices[id] = generateCityPrices(id); });
  return {
    day: 1,
    money: CONFIG.initialMoney,
    currentCity: CONFIG.initialCity,
    warehouses: initWarehouses(),
    shipments: [],
    prices,
    log: [{ day: 1, message: '東京倉庫を開設。船会社・通関業者と契約し、貿易を開始しよう。' }],
    traveling: false,
    travelDaysLeft: 0,
    travelDestination: null,
    currentEvent: null,
    totalProfit: 0,
    selectedIncoterm: CONFIG.defaultIncoterm,
    selectedBank: 'mufg',
    lastTradeCosts: null,
    totalTradeCosts: 0,
    completedShipments: 0,
    freightSurcharge: 1,
    customsSurcharge: 1,
    ftaBonus: null,
    portDelay: 0,
    inspectionBoost: 0,
  };
}

function getWarehouse(cityId) {
  return gameState.warehouses[cityId || gameState.currentCity];
}

function addLog(message) {
  gameState.log.unshift({ day: gameState.day, message });
  if (gameState.log.length > 80) gameState.log.pop();
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
  if (Math.random() > 0.22) return null;
  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  event.effect(gameState);
  addLog(`【イベント】${event.title}: ${event.message}`);
  return { ...event, displayMessage: event.message };
}

function buyGood(goodId, quantity) {
  if (gameOver || gameState.traveling) return;
  const wh = getWarehouse();
  const incoterm = INCOTERMS[gameState.selectedIncoterm];
  const basePrice = gameState.prices[gameState.currentCity][goodId];
  const unitPrice = Math.round(basePrice * incoterm.purchaseModifier);
  const totalCost = unitPrice * quantity;
  const space = getCargoSpace(wh.cargo);

  if (quantity <= 0 || quantity > space) { addLog(`倉庫容量不足（残り${space}単位）`); render(); return; }
  if (totalCost > gameState.money) { addLog('資金不足'); render(); return; }

  gameState.money -= totalCost;
  wh.cargo[goodId] = (wh.cargo[goodId] || 0) + quantity;
  const prev = wh.cargoMeta[goodId];
  if (prev) {
    const t = prev.qty + quantity;
    wh.cargoMeta[goodId] = { origin: gameState.currentCity, avgCost: Math.round((prev.avgCost * prev.qty + unitPrice * quantity) / t), qty: t };
  } else {
    wh.cargoMeta[goodId] = { origin: gameState.currentCity, avgCost: unitPrice, qty: quantity };
  }
  wh.cargoMeta[goodId].qty = wh.cargo[goodId];
  addLog(`${GOODS[goodId].name} ${quantity}単位を${CITIES[gameState.currentCity].name}倉庫へ入庫 (-$${totalCost.toLocaleString()})`);
  render();
}

function sellGood(goodId, quantity) {
  if (gameOver || gameState.traveling) return;
  const wh = getWarehouse();
  const owned = wh.cargo[goodId] || 0;
  if (quantity <= 0 || quantity > owned) return;

  const gain = gameState.prices[gameState.currentCity][goodId] * quantity;
  gameState.money += gain;
  wh.cargo[goodId] = owned - quantity;
  if (wh.cargo[goodId] <= 0) { delete wh.cargo[goodId]; delete wh.cargoMeta[goodId]; }
  else wh.cargoMeta[goodId].qty = wh.cargo[goodId];

  gameState.totalProfit += gain;
  addLog(`${GOODS[goodId].name} ${quantity}単位を${CITIES[gameState.currentCity].name}で売却 (+$${gain.toLocaleString()})`);
  render();
}

function openShipmentModal(destId) {
  if (gameOver || gameState.traveling) return;
  const wh = getWarehouse();
  if (getCargoUsed(wh.cargo) === 0) { addLog('倉庫に出荷可能な貨物がありません'); render(); return; }
  if (gameState.shipments.filter((s) => s.status === 'active').length >= CONFIG.maxActiveShipments) {
    addLog(`同時出荷上限（${CONFIG.maxActiveShipments}件）に達しています`); render(); return;
  }

  pendingShipment = destId;
  shipmentForm.destId = destId;
  shipmentForm.incoterm = gameState.selectedIncoterm;
  const modes = getAvailableModes(gameState.currentCity, destId);
  shipmentForm.mode = modes[0]?.id || 'sea';
  const carriers = getAvailableCarriers(shipmentForm.mode, gameState.currentCity);
  shipmentForm.carrier = carriers[0]?.id || 'one';
  shipmentForm.bankId = gameState.selectedBank || getDefaultBank(gameState.currentCity).id;
  const originYards = getContainerYards(gameState.currentCity);
  const destYards = getContainerYards(destId);
  shipmentForm.originCyId = originYards[0]?.id;
  shipmentForm.destCyId = destYards[0]?.id;
  renderShipmentModal();
  document.getElementById('shipment-modal-overlay').classList.remove('hidden');
}

function closeShipmentModal() {
  pendingShipment = null;
  document.getElementById('shipment-modal-overlay').classList.add('hidden');
}

function getShipmentOpts() {
  const wh = getWarehouse();
  const cargo = shipmentForm.shipAll ? { ...wh.cargo } : { ...wh.cargo };
  const cargoMeta = {};
  Object.keys(cargo).forEach((id) => { cargoMeta[id] = { ...wh.cargoMeta[id] }; });
  return {
    fromId: gameState.currentCity,
    toId: shipmentForm.destId,
    cargo, cargoMeta,
    incotermId: shipmentForm.incoterm,
    modeId: shipmentForm.mode,
    carrierId: shipmentForm.carrier,
    brokerId: shipmentForm.broker,
    forwarderId: shipmentForm.forwarder,
    includeCO: shipmentForm.includeCO,
    paymentTermId: shipmentForm.paymentTerm,
    bankId: shipmentForm.bankId,
    containerTypeId: shipmentForm.containerTypeId,
    originCyId: shipmentForm.originCyId,
    destCyId: shipmentForm.destCyId,
  };
}

function estimateShipmentCosts(overrides = {}) {
  const opts = { ...getShipmentOpts(), ...overrides };
  if (overrides.modeId) {
    const carriers = getAvailableCarriers(opts.modeId, gameState.currentCity);
    if (!carriers.find((c) => c.id === opts.carrierId)) {
      opts.carrierId = carriers[0]?.id;
    }
  }
  return calculateTradeCosts(gameState, opts);
}

function fmtOptionMeta(costs, { compact = false } = {}) {
  if (!costs) return '';
  if (compact) {
    return `<span class="option-meta"><span class="option-meta__cost">$${costs.playerTotal.toLocaleString()}</span><span class="option-meta__sep">·</span><span class="option-meta__days">${costs.totalDays}日</span></span>`;
  }
  return `<div class="option-meta"><span class="option-meta__cost">💰 $${costs.playerTotal.toLocaleString()}</span><span class="option-meta__days">📅 ${costs.totalDays}日</span></div>`;
}

function fmtPurchaseMeta(incotermId) {
  const inc = INCOTERMS[incotermId];
  const pct = Math.round((inc.purchaseModifier - 1) * 100);
  const label = pct === 0 ? '仕入標準' : `仕入+${pct}%`;
  return `<span class="option-meta option-meta--small"><span class="option-meta__cost">${label}</span></span>`;
}

function renderShipmentModal() {
  const from = CITIES[gameState.currentCity];
  const to = CITIES[shipmentForm.destId];
  const wh = getWarehouse();
  const modes = getAvailableModes(gameState.currentCity, shipmentForm.destId);

  document.getElementById('shipment-modal-route').textContent =
    `${from.flag} ${from.name}（${from.port}）→ ${to.flag} ${to.name}（${to.port}）`;

  document.getElementById('shipment-cargo-summary').innerHTML =
    Object.entries(wh.cargo).map(([id, q]) =>
      `<span class="tag">${GOODS[id].icon} ${GOODS[id].name} ×${q}</span>`
    ).join('') || '<span class="hint">貨物なし</span>';

  document.getElementById('shipment-incoterm-options').innerHTML = Object.values(INCOTERMS).map((t) => {
    const costs = estimateShipmentCosts({ incotermId: t.id });
    return `
    <label class="incoterm-option ${shipmentForm.incoterm === t.id ? 'incoterm-option--active' : ''}">
      <input type="radio" name="sh-incoterm" value="${t.id}" ${shipmentForm.incoterm === t.id ? 'checked' : ''}>
      <div class="incoterm-option__head">
        <strong>${t.name}</strong><span>${t.fullName}</span>
        ${fmtOptionMeta(costs, { compact: true })}
      </div>
      <p>${t.desc}</p>
    </label>`;
  }).join('');

  document.getElementById('shipment-mode-options').innerHTML = modes.map((m) => {
    const costs = estimateShipmentCosts({ modeId: m.id });
    return `
    <button class="select-chip ${shipmentForm.mode === m.id ? 'select-chip--active' : ''}" data-mode="${m.id}">
      <span class="select-chip__label">${m.icon} ${m.name}</span>
      ${fmtOptionMeta(costs, { compact: true })}
    </button>`;
  }).join('');

  const carriers = getAvailableCarriers(shipmentForm.mode, gameState.currentCity);
  if (!carriers.find((c) => c.id === shipmentForm.carrier)) shipmentForm.carrier = carriers[0]?.id;

  document.getElementById('shipment-carrier-options').innerHTML = carriers.map((c) => {
    const costs = estimateShipmentCosts({ carrierId: c.id });
    return `
    <label class="carrier-option ${shipmentForm.carrier === c.id ? 'carrier-option--active' : ''}">
      <input type="radio" name="sh-carrier" value="${c.id}" ${shipmentForm.carrier === c.id ? 'checked' : ''}>
      <div class="carrier-option__head">
        <strong>${c.country} ${c.name}</strong>
        <span>信頼度 ${Math.round(c.reliability * 100)}%</span>
        ${fmtOptionMeta(costs, { compact: true })}
      </div>
      <p>${c.desc}</p>
    </label>`;
  }).join('');

  document.getElementById('shipment-broker-options').innerHTML = Object.values(CUSTOMS_BROKERS).map((b) => {
    const costs = estimateShipmentCosts({ brokerId: b.id });
    return `
    <button class="select-chip ${shipmentForm.broker === b.id ? 'select-chip--active' : ''}" data-broker="${b.id}">
      <span class="select-chip__label">${b.name}</span>
      ${fmtOptionMeta(costs, { compact: true })}
    </button>`;
  }).join('');

  document.getElementById('shipment-forwarder-options').innerHTML = Object.values(FORWARDERS).map((f) => {
    const costs = estimateShipmentCosts({ forwarderId: f.id });
    return `
    <button class="select-chip ${shipmentForm.forwarder === f.id ? 'select-chip--active' : ''}" data-forwarder="${f.id}">
      <span class="select-chip__label">${f.name}</span>
      ${fmtOptionMeta(costs, { compact: true })}
    </button>`;
  }).join('');

  document.getElementById('shipment-payment-options').innerHTML = Object.values(PAYMENT_TERMS).map((p) => {
    const costs = estimateShipmentCosts({ paymentTermId: p.id });
    return `
    <button class="select-chip ${shipmentForm.paymentTerm === p.id ? 'select-chip--active' : ''}" data-payment="${p.id}">
      <span class="select-chip__label">${p.name}</span>
      ${fmtOptionMeta(costs, { compact: true })}
    </button>`;
  }).join('');

  document.getElementById('shipment-bank-options').innerHTML = Object.values(BANKS).map((b) => {
    const costs = estimateShipmentCosts({ bankId: b.id });
    return `
    <label class="carrier-option ${shipmentForm.bankId === b.id ? 'carrier-option--active' : ''}">
      <input type="radio" name="sh-bank" value="${b.id}" ${shipmentForm.bankId === b.id ? 'checked' : ''}>
      <div class="carrier-option__head">
        <strong>${b.country} ${b.name}</strong>
        <span>${b.naccsLinked ? 'NACCS連携' : '国際網'}</span>
        ${fmtOptionMeta(costs, { compact: true })}
      </div>
      <p>${b.desc}</p>
    </label>`;
  }).join('');

  const originYards = getContainerYards(gameState.currentCity);
  const destYards = getContainerYards(shipmentForm.destId);
  if (!originYards.find((y) => y.id === shipmentForm.originCyId)) shipmentForm.originCyId = originYards[0]?.id;
  if (!destYards.find((y) => y.id === shipmentForm.destCyId)) shipmentForm.destCyId = destYards[0]?.id;

  document.getElementById('shipment-container-options').innerHTML = shipmentForm.mode === 'sea'
    ? Object.values(CONTAINER_TYPES).map((ct) => {
      const costs = estimateShipmentCosts({ containerTypeId: ct.id });
      return `
      <button class="select-chip ${shipmentForm.containerTypeId === ct.id ? 'select-chip--active' : ''}" data-container="${ct.id}">
        <span class="select-chip__label">${ct.name} (${ct.capacity}単位)</span>
        ${fmtOptionMeta(costs, { compact: true })}
      </button>`;
    }).join('')
    : '<p class="hint">航空/陸送はコンテナ不使用</p>';

  document.getElementById('shipment-cy-options').innerHTML = shipmentForm.mode === 'sea' ? `
    <p class="hint"><strong>積地CY</strong></p>
    <div class="chip-row">${originYards.map((y) => {
      const costs = estimateShipmentCosts({ originCyId: y.id });
      return `
      <button class="select-chip ${shipmentForm.originCyId === y.id ? 'select-chip--active' : ''}" data-origin-cy="${y.id}">
        <span class="select-chip__label">${y.name}</span>
        ${fmtOptionMeta(costs, { compact: true })}
      </button>`;
    }).join('')}</div>
    <p class="hint"><strong>揚地CY</strong></p>
    <div class="chip-row">${destYards.map((y) => {
      const costs = estimateShipmentCosts({ destCyId: y.id });
      return `
      <button class="select-chip ${shipmentForm.destCyId === y.id ? 'select-chip--active' : ''}" data-dest-cy="${y.id}">
        <span class="select-chip__label">${y.name}</span>
        ${fmtOptionMeta(costs, { compact: true })}
      </button>`;
    }).join('')}</div>`
    : '<p class="hint">—</p>';

  const exportSys = resolveCustomsSystemForRoute(gameState.currentCity, shipmentForm.destId, 'export');
  const importSys = resolveCustomsSystemForRoute(gameState.currentCity, shipmentForm.destId, 'import');
  document.getElementById('shipment-naccs-info').innerHTML = `
    <div class="naccs-info">
      <p><strong>輸出:</strong> ${exportSys.name} — ${exportSys.desc}</p>
      <p class="option-meta"><span class="option-meta__cost">手数料 $${exportSys.fee}</span><span class="option-meta__sep">·</span><span class="option-meta__days">+${Math.max(1, Math.ceil(1 * exportSys.speedMult))}日</span></p>
      <p><strong>輸入:</strong> ${importSys.name} — ${importSys.desc}</p>
      <p class="option-meta"><span class="option-meta__cost">手数料 $${importSys.fee}</span><span class="option-meta__sep">·</span><span class="option-meta__days">通関×${importSys.speedMult}</span></p>
      ${exportSys.id === 'naccs' ? '<p class="cost-fta">🇯🇵 NACCS（税関・港湾・通関業者・銀行間EDI）</p>' : ''}
    </div>`;

  const coCostsOff = estimateShipmentCosts({ includeCO: false });
  const coCostsOn = estimateShipmentCosts({ includeCO: true });
  document.getElementById('shipment-co-option').innerHTML = `
    <label class="checkbox-label">
      <input type="checkbox" id="include-co" ${shipmentForm.includeCO ? 'checked' : ''}>
      原産地証明書（C/O）を添付 — FTA追加減税
    </label>
    <div class="option-meta co-compare">
      <span>C/Oなし: <strong>$${coCostsOff.playerTotal.toLocaleString()}</strong> / ${coCostsOff.totalDays}日</span>
      <span>C/Oあり: <strong>$${coCostsOn.playerTotal.toLocaleString()}</strong> / ${coCostsOn.totalDays}日</span>
    </div>`;

  bindShipmentModalEvents();
  const costs = calculateTradeCosts(gameState, getShipmentOpts());
  document.getElementById('shipment-cost-breakdown').innerHTML = formatCostBreakdown(costs, shipmentForm.incoterm);
}

function bindShipmentModalEvents() {
  document.querySelectorAll('input[name="sh-incoterm"]').forEach((el) => {
    el.onchange = () => { shipmentForm.incoterm = el.value; gameState.selectedIncoterm = el.value; renderShipmentModal(); };
  });
  document.querySelectorAll('[data-mode]').forEach((el) => {
    el.onclick = () => { shipmentForm.mode = el.dataset.mode; renderShipmentModal(); };
  });
  document.querySelectorAll('input[name="sh-carrier"]').forEach((el) => {
    el.onchange = () => { shipmentForm.carrier = el.value; renderShipmentModal(); };
  });
  document.querySelectorAll('[data-broker]').forEach((el) => {
    el.onclick = () => { shipmentForm.broker = el.dataset.broker; renderShipmentModal(); };
  });
  document.querySelectorAll('[data-forwarder]').forEach((el) => {
    el.onclick = () => { shipmentForm.forwarder = el.dataset.forwarder; renderShipmentModal(); };
  });
  document.querySelectorAll('[data-payment]').forEach((el) => {
    el.onclick = () => { shipmentForm.paymentTerm = el.dataset.payment; renderShipmentModal(); };
  });
  document.querySelectorAll('input[name="sh-bank"]').forEach((el) => {
    el.onchange = () => { shipmentForm.bankId = el.value; gameState.selectedBank = el.value; renderShipmentModal(); renderBankPanel(); };
  });
  document.querySelectorAll('[data-container]').forEach((el) => {
    el.onclick = () => { shipmentForm.containerTypeId = el.dataset.container; renderShipmentModal(); };
  });
  document.querySelectorAll('[data-origin-cy]').forEach((el) => {
    el.onclick = () => { shipmentForm.originCyId = el.dataset.originCy; renderShipmentModal(); };
  });
  document.querySelectorAll('[data-dest-cy]').forEach((el) => {
    el.onclick = () => { shipmentForm.destCyId = el.dataset.destCy; renderShipmentModal(); };
  });
  const co = document.getElementById('include-co');
  if (co) co.onchange = () => { shipmentForm.includeCO = co.checked; renderShipmentModal(); };
}

function confirmShipment() {
  const opts = getShipmentOpts();
  const costs = calculateTradeCosts(gameState, opts);
  if (costs.playerTotal > gameState.money) {
    addLog(`資金不足: 必要額 $${costs.playerTotal.toLocaleString()}`); closeShipmentModal(); render(); return;
  }

  const wh = getWarehouse();
  removeCargoFromWarehouse(wh, opts.cargo);
  gameState.money -= costs.playerTotal;
  gameState.totalTradeCosts += costs.playerTotal;
  gameState.lastTradeCosts = { ...costs, incoterm: opts.incotermId, from: opts.fromId, to: opts.toId };

  const shipment = createShipment(gameState, opts, costs);
  gameState.shipments.push(shipment);

  const mode = TRANSPORT_MODES[opts.modeId];
  const carrier = costs.carrier;
  const bank = BANKS[opts.bankId];
  addLog(`【Shipment確定】${CITIES[opts.fromId].name}→${CITIES[opts.toId].name} | ${INCOTERMS[opts.incotermId].name} | ${mode.name} | ${carrier.name}`);
  addLog(`${bank.name} / ${costs.exportSys.name} / 書類${costs.docIds.length}点 / -$${costs.playerTotal.toLocaleString()} / 約${costs.totalDays}日`);
  closeShipmentModal();
  render();
}

function startPersonalTravel(destId) {
  if (gameOver || gameState.traveling) return;
  if (gameState.money < CONFIG.personalTravelFee) { addLog('渡航費が足りません'); render(); return; }
  gameState.money -= CONFIG.personalTravelFee;
  gameState.traveling = true;
  gameState.travelDaysLeft = Math.max(1, DISTANCES[gameState.currentCity][destId] - 1);
  gameState.travelDestination = destId;
  addLog(`${CITIES[destId].name}へ出張（-${CONFIG.personalTravelFee}）`);
  render();
}

function advancePersonalTravel() {
  gameState.travelDaysLeft -= 1;
  if (gameState.travelDaysLeft <= 0) {
    gameState.currentCity = gameState.travelDestination;
    gameState.traveling = false;
    gameState.travelDestination = null;
    addLog(`${CITIES[gameState.currentCity].name}に到着`);
    if (Math.random() < 0.12) gameState.currentEvent = triggerRandomEvent();
  }
}

function nextDay() {
  if (gameOver) return;
  previousPrices = JSON.parse(JSON.stringify(gameState.prices[gameState.currentCity]));
  gameState.currentEvent = null;
  gameState.day += 1;

  if (gameState.traveling) advancePersonalTravel();
  advanceAllShipments(gameState).forEach(addLog);
  fluctuatePrices();
  if (!gameState.traveling && Math.random() < 0.18) gameState.currentEvent = triggerRandomEvent();
  checkGameEnd();
  render();
}

function checkGameEnd() {
  const totalAssets = calcTotalAssets();
  if (totalAssets >= CONFIG.winMoney) { gameOver = true; showGameEndModal(true); }
  else if (gameState.money < -500) { gameOver = true; showGameEndModal(false); }
  else if (gameState.day >= CONFIG.maxDays) { gameOver = true; showGameEndModal(totalAssets >= CONFIG.winMoney * 0.5); }
}

function calcTotalAssets() {
  let total = gameState.money;
  Object.entries(gameState.warehouses).forEach(([cityId, wh]) => {
    Object.entries(wh.cargo).forEach(([goodId, qty]) => {
      total += gameState.prices[cityId][goodId] * qty;
    });
  });
  gameState.shipments.filter((s) => s.status === 'active').forEach((sh) => {
    Object.entries(sh.cargo).forEach(([goodId, qty]) => {
      total += gameState.prices[sh.to][goodId] * qty * 0.9;
    });
  });
  return Math.round(total);
}

function showGameEndModal(success) {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const closeBtn = document.getElementById('modal-close');
  const assets = calcTotalAssets();
  content.innerHTML = success ? `
    <h2>🎉 MISSION CLEAR</h2>
    <p>インコタームズと物流網を駆使し、アジア市場を制覇しました！</p>
    <p class="game-dialog__highlight">総資産: <strong style="color:var(--accent-gold)">$${assets.toLocaleString()}</strong></p>
    <p>累計貿易費: $${gameState.totalTradeCosts.toLocaleString()} / 完了Shipment: ${gameState.completedShipments || 0}件</p>
  ` : `
    <h2>💸 GAME OVER</h2>
    <p>物流費と関税が経営を圧迫しました。再挑戦してください。</p>
    <p class="game-dialog__highlight">総資産: <strong style="color:var(--accent-crimson)">$${assets.toLocaleString()}</strong></p>
  `;
  closeBtn.textContent = '▶ 再挑戦';
  closeBtn.onclick = () => { modal.classList.add('hidden'); gameState = createInitialState(); gameOver = false; render(); showIntroModal(); };
  modal.classList.remove('hidden');
}

function showIntroModal() {
  const content = document.getElementById('modal-content');
  document.getElementById('modal-close').onclick = () => document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-close').textContent = '▶ START';
  content.innerHTML = `
    <h2>⚓ TRADE EMPIRE</h2>
    <p>現実の国際貿易フローを体験するシミュレーションゲームです。</p>
    <ul>
      <li><strong>仕入れ</strong> → 現地倉庫に入庫</li>
      <li><strong>Shipment</strong> → 銀行・NACCS・CY・船会社を手配</li>
      <li><strong>貿易フロー</strong> → 書類→銀行→通関→輸送→搬入</li>
      <li><strong>出張</strong> → 別都市で売買</li>
      <li>目標: 総資産 <strong style="color:var(--accent-gold)">$${CONFIG.winMoney.toLocaleString()}</strong> / ${CONFIG.maxDays}日</li>
    </ul>`;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function saveGame() { localStorage.setItem(CONFIG.saveKey, JSON.stringify(gameState)); addLog('セーブ完了'); render(); }
function loadGame() {
  const saved = localStorage.getItem(CONFIG.saveKey);
  if (!saved) { addLog('セーブなし'); render(); return; }
  gameState = JSON.parse(saved);
  gameState.shipments = gameState.shipments || [];
  gameState.warehouses = gameState.warehouses || initWarehouses();
  if (gameState.cargo && getCargoUsed(gameState.cargo) > 0) {
    const wh = gameState.warehouses[gameState.currentCity];
    Object.assign(wh.cargo, gameState.cargo);
    Object.assign(wh.cargoMeta, gameState.cargoMeta || {});
    delete gameState.cargo;
    delete gameState.cargoMeta;
  }
  gameState.completedShipments = gameState.completedShipments || 0;
  gameOver = false;
  addLog('ロード完了');
  render();
}

function getPriceTrend(goodId) {
  if (!previousPrices) return 'stable';
  const c = gameState.prices[gameState.currentCity][goodId];
  const p = previousPrices[goodId];
  if (c > p * 1.02) return 'up';
  if (c < p * 0.98) return 'down';
  return 'stable';
}

function renderHeaderStats() {
  const assets = calcTotalAssets();
  const daysLeft = CONFIG.maxDays - gameState.day;
  document.getElementById('header-stats').innerHTML = `
    <div class="stat"><div class="stat__label">💰 CASH</div><div class="stat__value ${gameState.money < 3000 ? 'stat__value--danger' : ''}">$${gameState.money.toLocaleString()}</div></div>
    <div class="stat"><div class="stat__label">📊 ASSETS</div><div class="stat__value ${assets >= CONFIG.winMoney * 0.8 ? 'stat__value--success' : ''}">$${assets.toLocaleString()}</div></div>
    <div class="stat"><div class="stat__label">📅 DAY</div><div class="stat__value">${gameState.day}<span style="opacity:0.5;font-size:0.7rem">/${CONFIG.maxDays}</span></div></div>
    <div class="stat"><div class="stat__label">⏳ LEFT</div><div class="stat__value ${daysLeft <= 15 ? 'stat__value--danger' : ''}">${daysLeft}</div></div>
    <div class="stat"><div class="stat__label">🚢 SHIP</div><div class="stat__value">${gameState.shipments.filter((s) => s.status === 'active').length}</div></div>`;
}

function renderLocation() {
  const city = CITIES[gameState.currentCity];
  const el = document.getElementById('location-info');
  if (gameState.traveling) {
    el.innerHTML = `<div class="traveling-overlay"><div class="traveling-overlay__icon">✈️</div><p>${CITIES[gameState.travelDestination].name}へ出張中</p><p>残り${gameState.travelDaysLeft}日</p></div>`;
    return;
  }
  el.innerHTML = `
    <div class="location-info__flag">${city.flag}</div>
    <div class="location-info__name">${city.name}</div>
    <div class="location-info__country">${city.country}</div>
    <p class="location-info__desc">${city.desc}</p>
    <p class="hint">🚢 ${city.port}</p>
    <p class="hint">✈️ ${city.airport}</p>
    <p class="hint">🏗️ ${city.containerYard || '—'}</p>
    <p class="hint">💻 ${CUSTOMS_SYSTEMS[city.customsSystem]?.name || '書面通関'}</p>
    <p class="hint">🏛️ ${city.customs} / 関税${Math.round(city.tariffRate * 100)}%</p>`;
}

function renderBankPanel() {
  const el = document.getElementById('bank-panel');
  if (!el) return;
  const bank = BANKS[gameState.selectedBank] || getDefaultBank(gameState.currentCity);
  el.innerHTML = Object.values(BANKS).map((b) => {
    let shipmentNote = '';
    if (pendingShipment && shipmentForm.destId) {
      shipmentNote = fmtOptionMeta(estimateShipmentCosts({ bankId: b.id }), { compact: true });
    }
    return `
    <button class="incoterm-btn ${gameState.selectedBank === b.id ? 'incoterm-btn--active' : ''}" data-bank="${b.id}" ${gameOver ? 'disabled' : ''}>
      <div class="incoterm-btn__row"><strong>${b.name}</strong><span class="option-meta option-meta--small"><span class="option-meta__cost">T/T $${b.ttFee}</span></span>${shipmentNote}</div>
      <span>${b.naccsLinked ? 'NACCS連携' : '国際取引'}</span>
    </button>`;
  }).join('')
    + `<p class="hint incoterm-hint">${bank.desc} L/C手数料×${bank.lcFeeMult} / 為替${(bank.fxSpread * 100).toFixed(1)}%</p>`;
  el.querySelectorAll('[data-bank]').forEach((b) => {
    b.onclick = () => { gameState.selectedBank = b.dataset.bank; shipmentForm.bankId = b.dataset.bank; renderBankPanel(); if (pendingShipment) renderShipmentModal(); };
  });
}

function renderWarehouse() {
  const wh = getWarehouse();
  document.getElementById('cargo-capacity').textContent = CONFIG.warehouseCapacity;
  const el = document.getElementById('cargo-list');
  const entries = Object.entries(wh.cargo);
  if (!entries.length) { el.innerHTML = '<div class="cargo-item__empty">倉庫空</div>'; return; }
  el.innerHTML = entries.map(([id, q]) => {
    const g = GOODS[id]; const m = wh.cargoMeta[id];
    return `<div class="cargo-item"><span>${g.icon} ${g.name} <small class="hs-code">HS${g.hsCode}</small></span>
      <span>${q}単位<br><small class="hint">$${m.avgCost}/原産:${CITIES[m.origin].name}</small></span></div>`;
  }).join('');
}

function renderRemoteWarehouses() {
  const el = document.getElementById('remote-warehouses');
  const rows = Object.keys(CITIES).filter((id) => id !== gameState.currentCity).map((id) => {
    const wh = gameState.warehouses[id];
    const used = getCargoUsed(wh.cargo);
    if (!used) return '';
    return `<div class="remote-wh"><span>${CITIES[id].flag} ${CITIES[id].name}</span><span>${used}単位</span></div>`;
  }).filter(Boolean);
  el.innerHTML = rows.length ? rows.join('') : '<p class="hint">他都市の在庫なし</p>';
}

function renderShipments() {
  const el = document.getElementById('shipments-panel');
  const active = gameState.shipments.filter((s) => s.status === 'active');
  if (!active.length) { el.innerHTML = '<p class="hint">進行中のShipmentはありません</p>'; return; }

  el.innerHTML = active.map((sh) => {
    const stage = sh.stages[sh.stageIndex];
    const stageInfo = { icon: getStageIcon(stage.id), label: getStageLabel(stage.id) };
    const mode = TRANSPORT_MODES[sh.mode];
    const progressPct = Math.round((sh.stageIndex / sh.stages.length) * 100);
    const progress = sh.stages.map((st, i) =>
      `<span class="pipeline-step ${i < sh.stageIndex ? 'pipeline-step--done' : i === sh.stageIndex ? 'pipeline-step--active' : ''}" title="${getStageLabel(st.id)}">${getStageIcon(st.id)}</span>`
    ).join('');
    const bank = BANKS[sh.bank];
    const docsReady = sh.documentStatus ? sh.documentStatus.filter((d) => d.ready).length : 0;
    const docsTotal = sh.documentStatus ? sh.documentStatus.length : 0;
    return `
      <div class="shipment-card">
        <div class="shipment-card__head">
          <strong>${CITIES[sh.from].flag} → ${CITIES[sh.to].flag}</strong>
          <span>${mode.icon} ${INCOTERMS[sh.incoterm].name}</span>
        </div>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${progressPct}%"></div></div>
        <div class="pipeline">${progress}</div>
        <p class="hint">${stageInfo.icon} ${stageInfo.label} — 残り ${sh.stageDaysLeft} 日</p>
        <p class="hint">📋 ${docsReady}/${docsTotal} · 🏦 ${bank?.name || ''}</p>
        <p class="hint">${Object.entries(sh.cargo).map(([id, q]) => `${GOODS[id].name}×${q}`).join(' / ')}</p>
      </div>`;
  }).join('');
}

function renderIncotermPanel() {
  const el = document.getElementById('incoterm-panel');
  const cur = INCOTERMS[gameState.selectedIncoterm];
  el.innerHTML = Object.values(INCOTERMS).map((t) => {
    const purchaseNote = fmtPurchaseMeta(t.id);
    let shipmentNote = '';
    if (pendingShipment && shipmentForm.destId) {
      const costs = estimateShipmentCosts({ incotermId: t.id });
      shipmentNote = fmtOptionMeta(costs, { compact: true });
    }
    return `
    <button class="incoterm-btn ${gameState.selectedIncoterm === t.id ? 'incoterm-btn--active' : ''}" data-incoterm="${t.id}" ${gameOver ? 'disabled' : ''}>
      <div class="incoterm-btn__row"><strong>${t.name}</strong>${purchaseNote}${shipmentNote}</div>
      <span>${t.fullName}</span>
    </button>`;
  }).join('') + `<p class="hint incoterm-hint">${cur.desc}</p>`;
  el.querySelectorAll('.incoterm-btn').forEach((b) => { b.onclick = () => { gameState.selectedIncoterm = b.dataset.incoterm; shipmentForm.incoterm = b.dataset.incoterm; renderIncotermPanel(); renderMarket(); if (pendingShipment) renderShipmentModal(); }; });
}

function renderTravelAndShip() {
  const el = document.getElementById('travel-list');
  const from = gameState.currentCity;
  const disabled = gameOver || gameState.traveling;

  el.innerHTML = Object.keys(CITIES).filter((id) => id !== from).map((id) => {
    const c = CITIES[id];
    const d = DISTANCES[from][id];
    const rail = isRailAvailable(from, id);
    return `<div class="route-card">
      <div class="route-card__info"><span>${c.flag} ${c.name}</span><span class="hint">${d}日 / ${rail ? '🚂陸路可' : '🚢海上'}</span></div>
      <div class="route-card__actions">
        <button class="game-btn game-btn--blue game-btn--sm" data-travel="${id}" ${disabled ? 'disabled' : ''}>✈️ 出張</button>
        <button class="game-btn game-btn--gold game-btn--sm" data-ship="${id}" ${disabled ? 'disabled' : ''}>📦 Shipment</button>
      </div></div>`;
  }).join('');

  el.querySelectorAll('[data-travel]').forEach((b) => { b.onclick = () => startPersonalTravel(b.dataset.travel); });
  el.querySelectorAll('[data-ship]').forEach((b) => { b.onclick = () => openShipmentModal(b.dataset.ship); });
}

function renderMarket() {
  const city = CITIES[gameState.currentCity];
  document.getElementById('market-city').textContent = city.name;
  const banner = document.getElementById('event-banner');
  if (gameState.currentEvent) {
    banner.className = `event-banner event-banner--${gameState.currentEvent.type}`;
    banner.innerHTML = `<strong>${gameState.currentEvent.title}</strong> — ${gameState.currentEvent.displayMessage}`;
    banner.classList.remove('hidden');
  } else banner.classList.add('hidden');

  const wh = getWarehouse();
  const inc = INCOTERMS[gameState.selectedIncoterm];
  const disabled = gameOver || gameState.traveling;
  let html = `<div class="market-row market-row--header"><span>商品(HS)</span><span>価格</span><span>動向</span><span>在庫</span><span>取引</span></div>`;

  Object.keys(GOODS).forEach((id) => {
    const g = GOODS[id];
    const price = Math.round(gameState.prices[gameState.currentCity][id] * inc.purchaseModifier);
    const owned = wh.cargo[id] || 0;
    const trend = getPriceTrend(id);
    const ts = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    const tc = trend === 'up' ? 'price--up' : trend === 'down' ? 'price--down' : 'price--stable';
    html += `<div class="market-row">
      <span class="good-name">${g.icon} ${g.name}<small class="hs-code">HS${g.hsCode}</small>${city.specialties.includes(id) ? '<span class="specialty-tag">特産</span>' : ''}</span>
      <span class="price ${tc}">$${price.toLocaleString()}</span><span class="${tc}">${ts}</span><span>${owned}</span>
      <span class="market-actions-cell">
        <button class="game-btn game-btn--buy" data-buy="${id}" ${disabled ? 'disabled' : ''}>BUY</button>
        <button class="game-btn game-btn--sell" data-sell="${id}" ${disabled || !owned ? 'disabled' : ''}>SELL</button>
      </span></div>`;
  });

  document.getElementById('market-table').innerHTML = html;
  document.querySelectorAll('[data-buy]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.buy;
      const max = getCargoSpace(getWarehouse().cargo);
      const q = parseInt(prompt(`${GOODS[id].name} 数量(1-${max}):`, '1'), 10);
      if (!isNaN(q)) buyGood(id, q);
    };
  });
  document.querySelectorAll('[data-sell]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.sell;
      const max = getWarehouse().cargo[id] || 0;
      const q = parseInt(prompt(`${GOODS[id].name} 数量(1-${max}):`, '1'), 10);
      if (!isNaN(q)) sellGood(id, q);
    };
  });
}

function renderLog() {
  document.getElementById('game-log').innerHTML = gameState.log.map((e) =>
    `<div class="log-entry"><span class="log-entry__day">Day${e.day}</span>${e.message}</div>`
  ).join('');
}

function render() {
  renderHeaderStats();
  renderLocation();
  renderWarehouse();
  document.getElementById('warehouse-city').textContent = CITIES[gameState.currentCity].name;
  renderRemoteWarehouses();
  renderBankPanel();
  renderIncotermPanel();
  renderTravelAndShip();
  renderShipments();
  renderMarket();
  renderLog();
  document.getElementById('btn-next-day').disabled = gameOver;
}

function init() {
  gameState = createInitialState();
  gameOver = false;
  document.getElementById('btn-next-day').onclick = nextDay;
  document.getElementById('btn-save').onclick = saveGame;
  document.getElementById('btn-load').onclick = loadGame;
  document.getElementById('shipment-cancel').onclick = closeShipmentModal;
  document.getElementById('shipment-confirm').onclick = confirmShipment;
  render();
  showIntroModal();
}

document.addEventListener('DOMContentLoaded', init);
