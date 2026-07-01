/**
 * ゲームデータ定義 — 都市・商品・輸送・通関・インコタームズ
 */

export const CONFIG = {
  initialMoney: 15000,
  initialCity: 'tokyo',
  warehouseCapacity: 80,
  maxDays: 150,
  winMoney: 120000,
  saveKey: 'asia-trade-sim-save-v4',
  defaultIncoterm: 'FOB',
  personalTravelFee: 120,
  maxActiveShipments: 5,
};

export const TRADE_STAGES = [
  { id: 'documents', label: '通関書類作成', icon: '📋' },
  { id: 'bank', label: '銀行手続', icon: '🏦' },
  { id: 'naccs', label: 'NACCS/電子申告', icon: '💻' },
  { id: 'export_customs', label: '輸出通関', icon: '🛂' },
  { id: 'container_yard', label: 'コンテナヤード', icon: '🏗️' },
  { id: 'loading', label: '積込み', icon: '📦' },
  { id: 'transit', label: '輸送中', icon: '🚢' },
  { id: 'import_customs', label: '輸入通関', icon: '🏛️' },
  { id: 'duty_payment', label: '関税納付', icon: '💴' },
  { id: 'delivery', label: '搬出・入庫', icon: '✅' },
];

export const COST_TYPES = {
  freight: { label: '運賃', icon: '🚢' },
  insurance: { label: '保険料', icon: '🛡️' },
  exportClearance: { label: '輸出通関', icon: '📋' },
  importClearance: { label: '輸入通関', icon: '📄' },
  originHandling: { label: '積地ターミナル', icon: '⚓' },
  destHandling: { label: '揚地ターミナル', icon: '⚓' },
  importDuty: { label: '輸入関税', icon: '🏛️' },
  vat: { label: 'VAT/消費税', icon: '💴' },
  inlandTransport: { label: '内陸運送', icon: '🚛' },
  documentFees: { label: '貿易書類', icon: '📝' },
  brokerFee: { label: '通関委任料', icon: '🤝' },
  forwarderFee: { label: 'フォワーダー手数料', icon: '🌐' },
  lcFee: { label: 'L/C手数料', icon: '🏦' },
  inspectionFee: { label: '検査・検疫', icon: '🔍' },
  containerYardFee: { label: 'CYターミナル', icon: '🏗️' },
  demurrage: { label: 'デマレージ/D&D', icon: '⏱️' },
  naccsFee: { label: 'NACCS/電子通関', icon: '💻' },
  bankFee: { label: '銀行手数料', icon: '🏦' },
  fxFee: { label: '為替手数料', icon: '💱' },
  dutyPaymentFee: { label: '関税納付手数料', icon: '💴' },
};

export const TRANSPORT_MODES = {
  sea: {
    id: 'sea', name: '海上コンテナ輸送', icon: '🚢',
    speedMult: 1.0, costMult: 1.0, maxCapacity: 80,
    handlingKey: 'port', docType: 'bill_of_lading',
  },
  air: {
    id: 'air', name: '国際航空貨物', icon: '✈️',
    speedMult: 0.3, costMult: 4.0, maxCapacity: 20,
    handlingKey: 'airport', docType: 'air_waybill',
  },
  rail: {
    id: 'rail', name: '国際鉄道/トラック', icon: '🚂',
    speedMult: 0.55, costMult: 1.2, maxCapacity: 40,
    handlingKey: 'terminal', docType: 'cmr', landOnly: true,
  },
};

export const SHIPPING_LINES = {
  maersk: { id: 'maersk', name: 'Maersk Line', country: '🇩🇰', reliability: 0.96, costMult: 1.12, speedMult: 1.0, desc: '世界最大級。安定だがやや高め。' },
  one: { id: 'one', name: 'Ocean Network Express', country: '🇯🇵', reliability: 0.93, costMult: 1.0, speedMult: 0.95, desc: '日本発アジア航路に強い。' },
  cosco: { id: 'cosco', name: 'COSCO Shipping', country: '🇨🇳', reliability: 0.88, costMult: 0.82, speedMult: 1.05, desc: '中国発航路で最安クラス。' },
  evergreen: { id: 'evergreen', name: 'Evergreen Line', country: '🇹🇼', reliability: 0.91, costMult: 0.95, speedMult: 1.0, desc: '東アジア〜東南アジアに網羅。' },
  msc: { id: 'msc', name: 'MSC', country: '🇨🇭', reliability: 0.86, costMult: 0.78, speedMult: 1.12, desc: '低運賃だが遅延リスクやや高。' },
};

export const AIRLINES = {
  ana: { id: 'ana', name: 'ANA Cargo', country: '🇯🇵', reliability: 0.97, costMult: 1.25, speedMult: 0.88, hub: 'tokyo', desc: '成田ハブ。精密機器・高付加価値品向け。' },
  sq: { id: 'sq', name: 'Singapore Airlines Cargo', country: '🇸🇬', reliability: 0.95, costMult: 1.18, speedMult: 0.9, hub: 'singapore', desc: '東南アジアの航空貨物ハブ。' },
  cathay: { id: 'cathay', name: 'Cathay Cargo', country: '🇭🇰', reliability: 0.94, costMult: 1.15, speedMult: 0.9, hub: 'shanghai', desc: '香港経由で中国〜ASEANを接続。' },
  korean: { id: 'korean', name: 'Korean Air Cargo', country: '🇰🇷', reliability: 0.92, costMult: 1.1, speedMult: 0.85, hub: 'seoul', desc: '仁川発。電子部品・化粧品に強み。' },
  fedex: { id: 'fedex', name: 'FedEx Express', country: '🇺🇸', reliability: 0.98, costMult: 1.55, speedMult: 0.75, hub: null, desc: '最速だが最高値。緊急便向け。' },
};

export const CUSTOMS_BROKERS = {
  standard: { id: 'standard', name: '一般通関業者', costMult: 1.0, speedMult: 1.0, inspectionReduction: 0, desc: '標準的な通関スピードと費用。' },
  premium: { id: 'premium', name: 'AEO認定ブローカー', costMult: 1.35, speedMult: 0.75, inspectionReduction: 0.12, desc: '優遇通関。検査率低下・処理迅速。' },
  local: { id: 'local', name: '現地特化ブローカー', costMult: 1.15, speedMult: 0.85, inspectionReduction: 0.2, desc: '仕向国に精通。インド・ベトナム等で有効。' },
};

export const FORWARDERS = {
  direct: { id: 'direct', name: '直接手配（自社管理）', costMult: 0, docSpeed: 1.0, desc: 'フォワーダー費用なし。書類は自分で作成。' },
  dhl: { id: 'dhl', name: 'DHL Global Forwarding', costMult: 0.09, docSpeed: 0.65, desc: 'ドアtoドア一貫手配。書類作成を代行。' },
  kuehne: { id: 'kuehne', name: 'Kuehne+Nagel', costMult: 0.07, docSpeed: 0.7, desc: '海上・航空の統合ロジスティクス。' },
};

export const TRADE_DOCUMENTS = {
  commercial_invoice: { id: 'commercial_invoice', name: 'Invoice', label: '商業送り状（INVOICE）', required: true, cost: 0, category: 'commercial' },
  packing_list: { id: 'packing_list', name: 'P/L', label: '梱包明細書（P/L）', required: true, cost: 0, category: 'commercial' },
  shipping_instruction: { id: 'shipping_instruction', name: 'S/I', label: '船積指示書（S/I）', required: true, cost: 15, category: 'shipping', modes: ['sea'] },
  bill_of_lading: { id: 'bill_of_lading', name: 'B/L', label: '船荷証券（B/L）', modes: ['sea'], cost: 30, category: 'shipping' },
  air_waybill: { id: 'air_waybill', name: 'AWB', label: '航空運送状（AWB）', modes: ['air'], cost: 40, category: 'shipping' },
  cmr: { id: 'cmr', name: 'CMR', label: '国際道路運送状', modes: ['rail'], cost: 25, category: 'shipping' },
  export_declaration: { id: 'export_declaration', name: 'E/D', label: '輸出申告書（Export Declaration）', required: true, cost: 20, category: 'customs' },
  import_declaration: { id: 'import_declaration', name: 'I/D', label: '輸入申告書（Import Declaration）', required: true, cost: 25, category: 'customs' },
  customs_power: { id: 'customs_power', name: '委任状', label: '通関委任状（Customs POA）', required: true, cost: 10, category: 'customs' },
  naccs_manifest: { id: 'naccs_manifest', name: 'NACCS', label: 'NACCS貨物情報（電子マニフェスト）', cost: 35, category: 'electronic', systems: ['naccs'] },
  delivery_order: { id: 'delivery_order', name: 'D/O', label: 'デリバリーオーダー（D/O）', cost: 20, category: 'shipping', modes: ['sea'] },
  certificate_of_origin: { id: 'certificate_of_origin', name: 'C/O', label: '原産地証明書', optional: true, cost: 90, ftaBonus: 0.15, category: 'commercial' },
  phytosanitary: { id: 'phytosanitary', name: '検疫', label: '植物検疫証明書', cost: 110, category: 'regulatory' },
  lc_documents: { id: 'lc_documents', name: 'L/C', label: '信用状関連書類セット', cost: 60, category: 'bank', paymentTerms: ['lc'] },
};

export const BANKS = {
  mufg: { id: 'mufg', name: '三菱UFJ銀行', country: '🇯🇵', lcFeeMult: 1.0, ttFee: 38, fxSpread: 0.011, naccsLinked: true, desc: 'NACCS連携口座。L/C実務に強いメガバンク。' },
  smbc: { id: 'smbc', name: '三井住友銀行', country: '🇯🇵', lcFeeMult: 0.98, ttFee: 35, fxSpread: 0.012, naccsLinked: true, desc: '貿易融資・為替コストバランス型。' },
  mizuho: { id: 'mizuho', name: 'みずほ銀行', country: '🇯🇵', lcFeeMult: 1.02, ttFee: 40, fxSpread: 0.010, naccsLinked: true, desc: '為替スプレッドが狭い。大口取引向け。' },
  hsbc: { id: 'hsbc', name: 'HSBC', country: '🇬🇧', lcFeeMult: 1.12, ttFee: 48, fxSpread: 0.014, naccsLinked: false, desc: 'アジア全域の貿易ネットワーク。' },
  dbs: { id: 'dbs', name: 'DBS Bank', country: '🇸🇬', lcFeeMult: 1.05, ttFee: 42, fxSpread: 0.013, naccsLinked: false, hub: 'singapore', desc: 'ASEAN貿易のハブ銀行。' },
  icbc: { id: 'icbc', name: '中国工商銀行', country: '🇨🇳', lcFeeMult: 0.92, ttFee: 30, fxSpread: 0.015, naccsLinked: false, hub: 'shanghai', desc: '中国発取引で低コスト。' },
};

export const CUSTOMS_SYSTEMS = {
  naccs: {
    id: 'naccs', name: 'NACCS', fullName: 'Nippon Automated Cargo & Port Consolidated System',
    cities: ['tokyo'], fee: 48, speedMult: 0.75, errorRate: 0.04,
    desc: '日本税関の電子データ処理システム。海上・航空貨物の申告を電子化。',
  },
  ktnet: {
    id: 'ktnet', name: 'KTNET/uTradeHub', fullName: '韓国貿易通関プラットフォーム',
    cities: ['seoul'], fee: 40, speedMult: 0.8, errorRate: 0.05,
    desc: '韓国の電子通関。仁川・釜山経由の貨物に適用。',
  },
  single_window: {
    id: 'single_window', name: '中国单一窗口', fullName: '国际贸易单一窗口',
    cities: ['shanghai'], fee: 35, speedMult: 0.82, errorRate: 0.06,
    desc: '中国の貿易単一窓口。輸出入申告の電子化。',
  },
  trade_net: {
    id: 'trade_net', name: 'TradeNet', fullName: 'シンガポール電子通関',
    cities: ['singapore'], fee: 42, speedMult: 0.78, errorRate: 0.03,
    desc: 'シンガポールの電子通関。処理速度が速い。',
  },
  manual: {
    id: 'manual', name: '書面申告', fullName: 'Paper-based Customs Entry',
    cities: [], fee: 0, speedMult: 1.3, errorRate: 0.12,
    desc: '電子システム非対応港向け。時間がかかる。',
  },
};

export const CONTAINER_TYPES = {
  gp20: { id: 'gp20', name: "20'GP", teu: 1, capacity: 28, costMult: 1.0 },
  gp40: { id: 'gp40', name: "40'GP", teu: 2, capacity: 58, costMult: 1.65 },
  hc40: { id: 'hc40', name: "40'HC", teu: 2, capacity: 68, costMult: 1.85 },
};

export const CONTAINER_YARDS = {
  tokyo: [
    { id: 'tokyo_oi', name: '大井コンテナターミナル', operator: 'ONE/東京港', costMult: 1.0, freeDays: 4, congestion: 0.12 },
    { id: 'tokyo_kawasaki', name: '川崎臨港CY', operator: 'JPN CY', costMult: 0.88, freeDays: 3, congestion: 0.18 },
  ],
  shanghai: [
    { id: 'sha_yangshan', name: '洋山深水港CY', operator: 'COSCO', costMult: 0.95, freeDays: 5, congestion: 0.15 },
    { id: 'sha_waigaoqiao', name: '外高桥CY', operator: 'SIPG', costMult: 0.85, freeDays: 3, congestion: 0.22 },
  ],
  seoul: [
    { id: 'sel_busan', name: '釜山新港CY', operator: 'HMM', costMult: 0.9, freeDays: 4, congestion: 0.14 },
  ],
  singapore: [
    { id: 'sg_psa', name: 'PSA Singapore CY', operator: 'PSA', costMult: 1.1, freeDays: 5, congestion: 0.10 },
  ],
  bangkok: [
    { id: 'bkk_leam', name: 'Laem Chabang CY', operator: 'LCIT', costMult: 0.82, freeDays: 3, congestion: 0.16 },
  ],
  mumbai: [
    { id: 'bom_jnpt', name: 'JNPT CY', operator: 'JNPT', costMult: 0.95, freeDays: 2, congestion: 0.28 },
  ],
  hanoi: [
    { id: 'han_haiphong', name: 'ハイフォンCY', operator: 'VIP Green', costMult: 0.78, freeDays: 3, congestion: 0.18 },
  ],
  jakarta: [
    { id: 'jkt_tanjung', name: 'Tanjung Priok CY', operator: 'IPC', costMult: 0.85, freeDays: 3, congestion: 0.20 },
  ],
};

export const PAYMENT_TERMS = {
  tt_advance: { id: 'tt_advance', name: 'T/T 前払い', desc: '電信送金（T/T）。即時決済。', modifier: 1.0, lcFee: 0, needsBankDays: 0 },
  tt_deferred: { id: 'tt_deferred', name: 'T/T 後払い（30日）', desc: 'D/A相当。資金繰り有利だが2%割増。', modifier: 1.02, lcFee: 0, needsBankDays: 0 },
  lc: { id: 'lc', name: 'L/C（信用状）', desc: '銀行が代金支払を保証。開設に3〜5日。', modifier: 1.04, lcFee: 180, needsBankDays: 3 },
  dp: { id: 'dp', name: 'D/P（手形渡し）', desc: '銀行が書類と引換に代金回収。', modifier: 1.01, lcFee: 90, needsBankDays: 2 },
};

export const INCOTERMS = {
  EXW: {
    id: 'EXW', name: 'EXW', fullName: 'Ex Works（工場渡し）',
    desc: '引渡しのみ。以降の費用・リスクすべて買主負担。',
    sellerPays: [], buyerPays: ['inlandTransport', 'exportClearance', 'originHandling', 'freight', 'insurance', 'importClearance', 'destHandling', 'importDuty', 'vat', 'documentFees', 'brokerFee', 'forwarderFee', 'containerYardFee', 'naccsFee', 'bankFee', 'fxFee', 'dutyPaymentFee'],
    purchaseModifier: 1.0,
  },
  FOB: {
    id: 'FOB', name: 'FOB', fullName: 'Free On Board（本船渡し）',
    desc: '本船積みまで売主負担。以降は買主。',
    sellerPays: ['exportClearance', 'originHandling'], buyerPays: ['freight', 'insurance', 'importClearance', 'destHandling', 'importDuty', 'vat', 'documentFees', 'brokerFee', 'forwarderFee', 'containerYardFee', 'naccsFee', 'bankFee', 'fxFee', 'dutyPaymentFee'],
    purchaseModifier: 1.03,
  },
  CIF: {
    id: 'CIF', name: 'CIF', fullName: 'Cost, Insurance & Freight',
    desc: '目的港まで運賃・保険込み。通関・関税は買主。',
    sellerPays: ['exportClearance', 'originHandling', 'freight', 'insurance'], buyerPays: ['importClearance', 'destHandling', 'importDuty', 'vat', 'documentFees', 'brokerFee', 'forwarderFee', 'containerYardFee', 'naccsFee', 'bankFee', 'fxFee', 'dutyPaymentFee'],
    purchaseModifier: 1.07,
  },
  DDP: {
    id: 'DDP', name: 'DDP', fullName: 'Delivered Duty Paid',
    desc: '関税込みで指定場所まで。買主の追加費用なし。',
    sellerPays: ['exportClearance', 'originHandling', 'freight', 'insurance', 'importClearance', 'destHandling', 'importDuty', 'vat', 'documentFees', 'brokerFee', 'containerYardFee', 'naccsFee', 'bankFee'],
    buyerPays: ['forwarderFee', 'fxFee', 'dutyPaymentFee'],
    purchaseModifier: 1.16,
  },
};

export const FTA_GROUPS = {
  rcep: ['tokyo', 'shanghai', 'seoul', 'singapore', 'bangkok', 'hanoi', 'jakarta'],
  asean: ['singapore', 'bangkok', 'hanoi', 'jakarta'],
  jpkorea: ['tokyo', 'seoul'],
};

export const RAIL_ROUTES = new Set([
  'tokyo|seoul', 'seoul|tokyo', 'shanghai|hanoi', 'hanoi|shanghai',
  'bangkok|hanoi', 'hanoi|bangkok', 'singapore|bangkok', 'bangkok|singapore',
  'singapore|jakarta', 'jakarta|singapore', 'bangkok|jakarta', 'jakarta|bangkok',
]);

export const CITIES = {
  tokyo: {
    id: 'tokyo', name: '東京', country: '日本', flag: '🇯🇵',
    port: '東京港', airport: '成田国際空港', customs: '東京税関',
    containerYard: '大井コンテナターミナル', customsSystem: 'naccs',
    desc: 'テクノロジーと精密機器の中心地。NACCS電子通関対応。',
    specialties: ['electronics', 'automobiles'],
    tariffRate: 0.05, vatRate: 0.10, portFee: 12, airportFee: 22, customsFee: 180,
  },
  shanghai: {
    id: 'shanghai', name: '上海', country: '中国', flag: '🇨🇳',
    port: '上海港', airport: '浦东国際空港', customs: '上海税関',
    containerYard: '洋山深水港CY', customsSystem: 'single_window',
    desc: '世界最大級の港。製造業のハブ。',
    specialties: ['textiles', 'electronics'],
    tariffRate: 0.08, vatRate: 0.13, portFee: 8, airportFee: 18, customsFee: 150,
  },
  seoul: {
    id: 'seoul', name: 'ソウル', country: '韓国', flag: '🇰🇷',
    port: '釜山港', airport: '仁川国際空港', customs: '仁川税関',
    containerYard: '釜山新港CY', customsSystem: 'ktnet',
    desc: '半導体とK-ビューティーの都市。',
    specialties: ['cosmetics', 'electronics'],
    tariffRate: 0.06, vatRate: 0.10, portFee: 10, airportFee: 20, customsFee: 160,
  },
  singapore: {
    id: 'singapore', name: 'シンガポール', country: 'シンガポール', flag: '🇸🇬',
    port: 'シンガポール港', airport: 'チャンギ空港', customs: 'シンガポール税関',
    containerYard: 'PSA Singapore CY', customsSystem: 'trade_net',
    desc: '東南アジアの物流・金融ハブ。',
    specialties: ['spices', 'seafood'],
    tariffRate: 0.0, vatRate: 0.09, portFee: 15, airportFee: 24, customsFee: 120,
  },
  bangkok: {
    id: 'bangkok', name: 'バンコク', country: 'タイ', flag: '🇹🇭',
    port: 'レイムチャバン港', airport: 'スワンナプーム空港', customs: 'バンコク税関',
    desc: '香辛料と米の産地。ASEANの要衝。',
    specialties: ['spices', 'rice'],
    tariffRate: 0.10, vatRate: 0.07, portFee: 7, airportFee: 16, customsFee: 140,
  },
  mumbai: {
    id: 'mumbai', name: 'ムンバイ', country: 'インド', flag: '🇮🇳',
    port: 'ジュワハルラル・ネルー港', airport: 'チャトラパティ・シヴァージー空港', customs: 'ムンバイ税関',
    desc: '南アジア最大の商業都市。通関は慎重。',
    specialties: ['spices', 'textiles'],
    tariffRate: 0.18, vatRate: 0.18, portFee: 9, airportFee: 19, customsFee: 220, inspectionRate: 0.35,
  },
  hanoi: {
    id: 'hanoi', name: 'ハノイ', country: 'ベトナム', flag: '🇻🇳',
    port: 'ハイフォン港', airport: 'ノイバイ国際空港', customs: 'ハノイ税関',
    desc: 'コーヒーとシルクの産地。',
    specialties: ['coffee', 'silk'],
    tariffRate: 0.12, vatRate: 0.10, portFee: 6, airportFee: 14, customsFee: 130,
  },
  jakarta: {
    id: 'jakarta', name: 'ジャカルタ', country: 'インドネシア', flag: '🇮🇩',
    port: 'タンジュン・プリオク港', airport: 'スカルノ・ハッタ空港', customs: 'ジャカルタ税関',
    desc: '群島国家の首都。島嶼部配送に時間。',
    specialties: ['coffee', 'seafood'],
    tariffRate: 0.11, vatRate: 0.11, portFee: 7, airportFee: 15, customsFee: 145,
  },
};

export const DISTANCES = {
  tokyo: { shanghai: 3, seoul: 2, singapore: 7, bangkok: 6, mumbai: 8, hanoi: 5, jakarta: 7 },
  shanghai: { tokyo: 3, seoul: 2, singapore: 5, bangkok: 4, mumbai: 6, hanoi: 3, jakarta: 6 },
  seoul: { tokyo: 2, shanghai: 2, singapore: 6, bangkok: 5, mumbai: 7, hanoi: 4, jakarta: 6 },
  singapore: { tokyo: 7, shanghai: 5, seoul: 6, bangkok: 2, mumbai: 4, hanoi: 3, jakarta: 2 },
  bangkok: { tokyo: 6, shanghai: 4, seoul: 5, singapore: 2, mumbai: 4, hanoi: 2, jakarta: 3 },
  mumbai: { tokyo: 8, shanghai: 6, seoul: 7, singapore: 4, bangkok: 4, hanoi: 5, jakarta: 5 },
  hanoi: { tokyo: 5, shanghai: 3, seoul: 4, singapore: 3, bangkok: 2, mumbai: 5, jakarta: 4 },
  jakarta: { tokyo: 7, shanghai: 6, seoul: 6, singapore: 2, bangkok: 3, mumbai: 5, hanoi: 4 },
};

export const GOODS = {
  electronics: { id: 'electronics', name: '電子製品', icon: '📱', hsCode: '8517', basePrice: 800, dutyMultiplier: 1.0, insuranceRate: 0.012, weight: 1.2, perishable: false },
  textiles: { id: 'textiles', name: '繊維製品', icon: '👔', hsCode: '6204', basePrice: 300, dutyMultiplier: 0.8, insuranceRate: 0.006, weight: 0.8, perishable: false },
  spices: { id: 'spices', name: '香辛料', icon: '🌶️', hsCode: '0904', basePrice: 250, dutyMultiplier: 0.6, insuranceRate: 0.008, weight: 0.5, perishable: false, quarantine: true },
  rice: { id: 'rice', name: '米', icon: '🍚', hsCode: '1006', basePrice: 150, dutyMultiplier: 0.5, insuranceRate: 0.005, weight: 1.5, perishable: false, quarantine: true },
  silk: { id: 'silk', name: 'シルク', icon: '🧵', hsCode: '5002', basePrice: 600, dutyMultiplier: 0.9, insuranceRate: 0.007, weight: 0.6, perishable: false },
  seafood: { id: 'seafood', name: '海産物', icon: '🦐', hsCode: '0306', basePrice: 400, dutyMultiplier: 0.7, insuranceRate: 0.018, weight: 1.3, perishable: true, quarantine: true },
  coffee: { id: 'coffee', name: 'コーヒー', icon: '☕', hsCode: '0901', basePrice: 350, dutyMultiplier: 0.55, insuranceRate: 0.006, weight: 1.0, perishable: false, quarantine: true },
  cosmetics: { id: 'cosmetics', name: '化粧品', icon: '💄', hsCode: '3304', basePrice: 500, dutyMultiplier: 1.1, insuranceRate: 0.008, weight: 0.7, perishable: false },
  automobiles: { id: 'automobiles', name: '自動車部品', icon: '🚗', hsCode: '8708', basePrice: 1200, dutyMultiplier: 1.2, insuranceRate: 0.010, weight: 2.0, perishable: false },
};

export const EVENTS = [
  { id: 'typhoon', title: '台風接近', type: 'negative', message: '台風で海上輸送が停滞。運賃20%増＋全商品20%高。',
    effect: (s) => { applyPriceMultiplier(s, 1.2); s.freightSurcharge = 1.2; } },
  { id: 'festival', title: '地域祭り', type: 'positive', message: '祭りで特産品需要急増。価格30%上昇。',
    effect: (s) => { CITIES[s.currentCity].specialties.forEach((g) => { s.prices[s.currentCity][g] = Math.round(s.prices[s.currentCity][g] * 1.3); }); } },
  { id: 'trade_deal', title: 'RCEP追加譲歩', type: 'positive', message: '関税追加減让。次のShipmentでFTA+15%。',
    effect: (s) => { applyPriceMultiplier(s, 0.9); s.ftaBonus = 0.65; } },
  { id: 'port_congestion', title: '港湾混雑', type: 'negative', message: '主要港が混雑。海上輸送+2日遅延。',
    effect: (s) => { s.portDelay = 2; } },
  { id: 'customs_crackdown', title: '通関強化', type: 'negative', message: '輸入検査強化。次のShipment検査率UP。',
    effect: (s) => { s.customsSurcharge = 1.5; s.inspectionBoost = 0.2; } },
  { id: 'fuel_surge', title: '燃料高騰', type: 'negative', message: 'バンカー油価高騰。航空・海上運賃15%増。',
    effect: (s) => { s.freightSurcharge = 1.15; } },
  { id: 'investor', title: '貿易ファンド支援', type: 'positive', message: '政府系ファンドから$2,500の支援。',
    effect: (s) => { s.money += 2500; } },
];

export function applyPriceMultiplier(state, multiplier) {
  Object.keys(state.prices).forEach((cityId) => {
    Object.keys(state.prices[cityId]).forEach((goodId) => {
      state.prices[cityId][goodId] = Math.round(state.prices[cityId][goodId] * multiplier);
    });
  });
}

export function createEmptyWarehouse() {
  return { cargo: {}, cargoMeta: {} };
}

export function initWarehouses() {
  const w = {};
  Object.keys(CITIES).forEach((id) => { w[id] = createEmptyWarehouse(); });
  return w;
}

export function generateCityPrices(cityId) {
  const city = CITIES[cityId];
  const prices = {};
  Object.keys(GOODS).forEach((goodId) => {
    let mult = 0.8 + Math.random() * 0.4;
    if (city.specialties.includes(goodId)) mult *= 0.65;
    else mult *= 1.1;
    prices[goodId] = Math.round(GOODS[goodId].basePrice * mult);
  });
  return prices;
}

export function isRailAvailable(fromId, toId) {
  return RAIL_ROUTES.has(`${fromId}|${toId}`);
}

export function getCarrier(modeId, carrierId) {
  return modeId === 'air' ? AIRLINES[carrierId] : SHIPPING_LINES[carrierId];
}

export function getAvailableCarriers(modeId, fromId) {
  if (modeId === 'air') {
    return Object.values(AIRLINES).sort((a, b) => {
      const aHub = a.hub === fromId ? -1 : 0;
      const bHub = b.hub === fromId ? -1 : 0;
      return aHub - bHub || a.costMult - b.costMult;
    });
  }
  return Object.values(SHIPPING_LINES);
}

export function getContainerYards(cityId) {
  return CONTAINER_YARDS[cityId] || [{ id: 'default', name: `${CITIES[cityId]?.port || '港'}CY`, operator: 'Local', costMult: 1, freeDays: 3, congestion: 0.15 }];
}

export function getCustomsSystem(cityId) {
  const city = CITIES[cityId];
  if (!city?.customsSystem) return CUSTOMS_SYSTEMS.manual;
  return CUSTOMS_SYSTEMS[city.customsSystem] || CUSTOMS_SYSTEMS.manual;
}

export function getDefaultBank(cityId) {
  if (cityId === 'tokyo') return BANKS.mufg;
  if (cityId === 'shanghai') return BANKS.icbc;
  if (cityId === 'singapore') return BANKS.dbs;
  return BANKS.hsbc;
}

export function resolveCustomsSystemForRoute(fromId, toId, side) {
  const cityId = side === 'export' ? fromId : toId;
  return getCustomsSystem(cityId);
}

export function getAvailableModes(fromId, toId) {
  return Object.values(TRANSPORT_MODES).filter((m) => {
    if (m.landOnly) return isRailAvailable(fromId, toId);
    return true;
  });
}
