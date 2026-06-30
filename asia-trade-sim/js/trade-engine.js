/**
 * 貿易エンジン — 費用計算・Shipment進行・通関処理
 */

import {
  CITIES, GOODS, INCOTERMS, COST_TYPES, TRADE_STAGES, TRADE_DOCUMENTS,
  TRANSPORT_MODES, CUSTOMS_BROKERS, FORWARDERS, PAYMENT_TERMS, FTA_GROUPS,
  DISTANCES, getCarrier, getAvailableModes,
} from './data.js';

export { COST_TYPES, TRADE_STAGES };

export function getCargoUsed(cargo) {
  return Object.values(cargo).reduce((s, q) => s + q, 0);
}

export function getCargoWeight(cargo) {
  return Object.entries(cargo).reduce((s, [id, q]) => s + q * GOODS[id].weight, 0);
}

export function getCargoValue(cargo, cargoMeta, cityId, prices) {
  return Object.entries(cargo).reduce((s, [id, q]) => {
    const meta = cargoMeta[id];
    const val = meta ? meta.avgCost : prices[cityId][id];
    return s + val * q;
  }, 0);
}

export function getFtaReduction(state, originId, destId, hasCO) {
  if (originId === destId) return 0;
  let reduction = 0;
  Object.values(FTA_GROUPS).forEach((g) => {
    if (g.includes(originId) && g.includes(destId)) reduction = Math.max(reduction, 0.5);
  });
  if (FTA_GROUPS.jpkorea.includes(originId) && FTA_GROUPS.jpkorea.includes(destId)) reduction = Math.max(reduction, 0.6);
  if (state.ftaBonus) reduction = Math.max(reduction, state.ftaBonus);
  if (hasCO) reduction = Math.min(0.85, reduction + (TRADE_DOCUMENTS.certificate_of_origin.ftaBonus || 0));
  return reduction;
}

export function getRequiredDocuments(modeId, cargo, includeCO) {
  const docs = ['commercial_invoice', 'packing_list'];
  const mode = TRANSPORT_MODES[modeId];
  Object.values(TRADE_DOCUMENTS).forEach((d) => {
    if (d.modes && d.modes.includes(modeId)) docs.push(d.id);
  });
  if (includeCO) docs.push('certificate_of_origin');
  Object.keys(cargo).forEach((goodId) => {
    if (GOODS[goodId].quarantine && !docs.includes('phytosanitary')) docs.push('phytosanitary');
  });
  return [...new Set(docs)];
}

export function calcDocumentFees(docIds) {
  let total = 0;
  docIds.forEach((id) => {
    const d = TRADE_DOCUMENTS[id];
    if (d) total += d.cost || 0;
    if (id === 'phytosanitary') total += 110;
  });
  return total;
}

export function calculateImportDuty(state, fromId, toId, cargo, cargoMeta, prices, hasCO) {
  const dest = CITIES[toId];
  const fta = getFtaReduction(state, fromId, toId, hasCO);
  let total = 0;
  Object.entries(cargo).forEach(([goodId, qty]) => {
    const meta = cargoMeta[goodId];
    const cifVal = meta ? meta.avgCost * qty : prices[toId][goodId] * qty;
    total += Math.round(cifVal * dest.tariffRate * GOODS[goodId].dutyMultiplier * (1 - fta));
  });
  return total;
}

export function calculateTradeCosts(state, opts) {
  const {
    fromId, toId, cargo, cargoMeta, incotermId, modeId, carrierId,
    brokerId, forwarderId, includeCO, paymentTermId,
  } = opts;

  const incoterm = INCOTERMS[incotermId];
  const mode = TRANSPORT_MODES[modeId];
  const carrier = getCarrier(modeId, carrierId);
  const broker = CUSTOMS_BROKERS[brokerId];
  const forwarder = FORWARDERS[forwarderId];
  const payment = PAYMENT_TERMS[paymentTermId];
  const origin = CITIES[fromId];
  const dest = CITIES[toId];
  const baseDays = DISTANCES[fromId][toId];
  const cargoUnits = getCargoUsed(cargo);
  const cargoWeight = getCargoWeight(cargo);
  const cargoValue = getCargoValue(cargo, cargoMeta, fromId, state.prices);
  const docIds = getRequiredDocuments(modeId, cargo, includeCO);

  const transitDays = Math.max(1, Math.ceil(baseDays * mode.speedMult * carrier.speedMult) + (state.portDelay || 0));
  const freightMult = (state.freightSurcharge || 1) * mode.costMult * carrier.costMult;
  const freight = Math.round(55 * baseDays * cargoWeight * freightMult);

  let insurance = 0;
  Object.entries(cargo).forEach(([goodId, qty]) => {
    const meta = cargoMeta[goodId];
    const val = meta ? meta.avgCost * qty : state.prices[fromId][goodId] * qty;
    insurance += Math.round(val * GOODS[goodId].insuranceRate * (modeId === 'air' ? 1.3 : 1));
  });

  const handlingOrigin = mode.handlingKey === 'airport' ? origin.airportFee : origin.portFee;
  const handlingDest = mode.handlingKey === 'airport' ? dest.airportFee : dest.portFee;
  const originHandling = Math.round(handlingOrigin * cargoUnits);
  const destHandling = Math.round(handlingDest * cargoUnits);
  const exportClearance = Math.round((origin.customsFee * 0.55 + cargoUnits * 5) * broker.costMult);
  const importClearance = Math.round((dest.customsFee * (state.customsSurcharge || 1) + cargoUnits * 7) * broker.costMult);
  const inlandTransport = Math.round(35 + cargoUnits * 4);
  const documentFees = calcDocumentFees(docIds);
  const brokerFee = Math.round(80 + cargoUnits * 6 * broker.costMult);
  const forwarderFee = Math.round(cargoValue * forwarder.costMult);
  const lcFee = payment.lcFee || 0;
  const importDuty = calculateImportDuty(state, fromId, toId, cargo, cargoMeta, state.prices, includeCO);
  const cifTotal = cargoValue + freight + insurance;
  const vat = Math.round((cifTotal + importDuty) * dest.vatRate);
  const ftaReduction = getFtaReduction(state, fromId, toId, includeCO);

  const allCosts = {
    freight, insurance, exportClearance, importClearance,
    originHandling, destHandling, importDuty, vat, inlandTransport,
    documentFees, brokerFee, forwarderFee, lcFee,
  };

  const sellerPays = {};
  const buyerPays = {};
  let playerTotal = 0;
  let sellerTotal = 0;

  incoterm.sellerPays.forEach((k) => { sellerPays[k] = allCosts[k]; sellerTotal += allCosts[k]; });
  incoterm.buyerPays.forEach((k) => { buyerPays[k] = allCosts[k]; playerTotal += allCosts[k]; });

  const purchasePremium = Math.round(cargoValue * (incoterm.purchaseModifier - 1) * payment.modifier);

  const stageDays = buildStagePlan(modeId, broker, forwarder, transitDays, cargo);

  return {
    allCosts, sellerPays, buyerPays,
    playerTotal: playerTotal + purchasePremium + lcFee,
    sellerTotal, purchasePremium, cargoValue, cargoUnits,
    transitDays, ftaReduction, docIds, stageDays, totalDays: stageDays.reduce((s, st) => s + st.days, 0),
    carrier, mode, broker, forwarder, payment,
  };
}

export function buildStagePlan(modeId, broker, forwarder, transitDays, cargo) {
  const hasQuarantine = Object.keys(cargo).some((id) => GOODS[id].quarantine || GOODS[id].perishable);
  return [
    { id: 'documents', days: Math.max(1, Math.ceil(1 * forwarder.docSpeed)) },
    { id: 'export_customs', days: Math.max(1, Math.ceil(1.2 * broker.speedMult)) },
    { id: 'loading', days: 1 },
    { id: 'transit', days: transitDays },
    { id: 'import_customs', days: Math.max(1, Math.ceil((hasQuarantine ? 2.5 : 1.8) * broker.speedMult)) },
    { id: 'delivery', days: 1 },
  ];
}

export function createShipment(state, opts, costs) {
  const id = `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stages = costs.stageDays.map((s, i) => ({ ...s, index: i }));
  return {
    id,
    from: opts.fromId,
    to: opts.toId,
    cargo: { ...opts.cargo },
    cargoMeta: JSON.parse(JSON.stringify(opts.cargoMeta)),
    incoterm: opts.incotermId,
    mode: opts.modeId,
    carrier: opts.carrierId,
    broker: opts.brokerId,
    forwarder: opts.forwarderId,
    paymentTerm: opts.paymentTermId,
    documents: costs.docIds,
    stages,
    stageIndex: 0,
    stageDaysLeft: stages[0].days,
    costs: { playerTotal: costs.playerTotal, buyerPays: costs.buyerPays },
    status: 'active',
    createdDay: state.day,
  };
}

export function removeCargoFromWarehouse(warehouse, cargo) {
  Object.entries(cargo).forEach(([goodId, qty]) => {
    warehouse.cargo[goodId] = (warehouse.cargo[goodId] || 0) - qty;
    if (warehouse.cargo[goodId] <= 0) {
      delete warehouse.cargo[goodId];
      delete warehouse.cargoMeta[goodId];
    } else if (warehouse.cargoMeta[goodId]) {
      warehouse.cargoMeta[goodId].qty = warehouse.cargo[goodId];
    }
  });
}

export function mergeCargoToWarehouse(warehouse, cargo, cargoMeta) {
  Object.entries(cargo).forEach(([goodId, qty]) => {
    const meta = cargoMeta[goodId];
    const prev = warehouse.cargoMeta[goodId];
    if (prev) {
      const totalQty = prev.qty + qty;
      warehouse.cargo[goodId] = totalQty;
      warehouse.cargoMeta[goodId] = {
        origin: meta.origin,
        avgCost: Math.round((prev.avgCost * prev.qty + meta.avgCost * qty) / totalQty),
        qty: totalQty,
      };
    } else {
      warehouse.cargo[goodId] = qty;
      warehouse.cargoMeta[goodId] = { ...meta, qty };
    }
  });
}

export function advanceShipment(shipment, state) {
  const logs = [];
  shipment.stageDaysLeft -= 1;

  if (shipment.stageDaysLeft > 0) return logs;

  const stage = shipment.stages[shipment.stageIndex];
  const stageInfo = TRADE_STAGES.find((s) => s.id === stage.id);

  if (stage.id === 'import_customs') {
    const dest = CITIES[shipment.to];
    const baseRate = dest.inspectionRate || 0.15;
    const broker = CUSTOMS_BROKERS[shipment.broker];
    const inspectRate = Math.max(0.05, baseRate - broker.inspectionReduction + (state.inspectionBoost || 0));
    if (Math.random() < inspectRate) {
      shipment.stageDaysLeft = 2;
      const fee = Math.round(150 + getCargoUsed(shipment.cargo) * 10);
      state.money -= fee;
      state.totalTradeCosts += fee;
      logs.push(`【通関検査】${CITIES[shipment.to].name}: 税関検査実施 (+2日, -$${fee})`);
      state.inspectionBoost = 0;
      return logs;
    }
    const hasQuarantine = Object.keys(shipment.cargo).some((id) => GOODS[id].quarantine);
    if (hasQuarantine && Math.random() < 0.2) {
      shipment.stageDaysLeft = 1;
      logs.push(`【検疫】${CITIES[shipment.to].name}: 植物/動物検疫審査 (+1日)`);
      return logs;
    }
  }

  if (stage.id === 'transit') {
    const carrier = getCarrier(shipment.mode, shipment.carrier);
    if (Math.random() > carrier.reliability) {
      shipment.stageDaysLeft = 1;
      logs.push(`【輸送遅延】${carrier.name}: 天候/港湾混雑で+1日`);
      return logs;
    }
  }

  shipment.stageIndex += 1;
  if (shipment.stageIndex >= shipment.stages.length) {
    shipment.status = 'delivered';
    mergeCargoToWarehouse(state.warehouses[shipment.to], shipment.cargo, shipment.cargoMeta);
    state.completedShipments = (state.completedShipments || 0) + 1;
    logs.push(`【搬入完了】${CITIES[shipment.from].name}→${CITIES[shipment.to].name}: 貨物が倉庫に入庫`);
    return logs;
  }

  shipment.stageDaysLeft = shipment.stages[shipment.stageIndex].days;
  const next = TRADE_STAGES.find((s) => s.id === shipment.stages[shipment.stageIndex].id);
  logs.push(`【${next.label}】${CITIES[shipment.from].name}→${CITIES[shipment.to].name}: ${next.label}フェーズ開始`);
  return logs;
}

export function advanceAllShipments(state) {
  const logs = [];
  state.shipments.filter((s) => s.status === 'active').forEach((sh) => {
    advanceShipment(sh, state).forEach((m) => logs.push(m));
  });
  state.shipments = state.shipments.filter((s) => s.status === 'active');
  state.portDelay = 0;
  return logs;
}

export function formatCostBreakdown(costs, incotermId) {
  const incoterm = INCOTERMS[incotermId];
  let html = '';

  if (costs.ftaReduction > 0) {
    html += `<p class="cost-fta">✅ FTA/C/O適用: 関税最大${Math.round(costs.ftaReduction * 100)}%減免</p>`;
  }

  html += `<p class="hint">輸送: ${costs.mode.icon} ${costs.mode.name} / ${costs.carrier.name} / 所要${costs.totalDays}日</p>`;
  html += '<div class="cost-section"><h4>あなた（輸入者）の負担</h4>';
  Object.entries(costs.buyerPays).forEach(([k, v]) => {
    html += `<div class="cost-row"><span>${COST_TYPES[k].icon} ${COST_TYPES[k].label}</span><span>$${v.toLocaleString()}</span></div>`;
  });
  if (costs.purchasePremium > 0) html += `<div class="cost-row"><span>📦 インコタームズ調整</span><span>$${costs.purchasePremium.toLocaleString()}</span></div>`;
  if (costs.allCosts.lcFee) html += `<div class="cost-row"><span>🏦 L/C手数料</span><span>$${costs.allCosts.lcFee.toLocaleString()}</span></div>`;
  html += `<div class="cost-row cost-row--total"><span>合計</span><span>$${costs.playerTotal.toLocaleString()}</span></div></div>`;

  html += '<div class="cost-section cost-section--seller"><h4>売主/キャリア負担</h4>';
  if (Object.keys(costs.sellerPays).length === 0) {
    html += '<p class="hint">なし</p>';
  } else {
    Object.entries(costs.sellerPays).forEach(([k, v]) => {
      html += `<div class="cost-row"><span>${COST_TYPES[k].icon} ${COST_TYPES[k].label}</span><span>$${v.toLocaleString()}</span></div>`;
    });
    html += `<div class="cost-row"><span>売主負担合計</span><span>$${costs.sellerTotal.toLocaleString()}</span></div>`;
  }
  html += '</div>';

  html += '<div class="flow-preview"><h4>貿易フロー（予定）</h4><div class="flow-steps">';
  costs.stageDays.forEach((st) => {
    const info = TRADE_STAGES.find((s) => s.id === st.id);
    html += `<span class="flow-step">${info.icon} ${info.label}(${st.days}日)</span>`;
  });
  html += '</div></div>';

  return html;
}

export function getStageLabel(stageId) {
  return TRADE_STAGES.find((s) => s.id === stageId)?.label || stageId;
}

export function getStageIcon(stageId) {
  return TRADE_STAGES.find((s) => s.id === stageId)?.icon || '📦';
}
