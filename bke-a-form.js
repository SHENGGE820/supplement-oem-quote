/*
 * BKE A 表（客戶配方需求）欄位定義 —— 詢價頁與報價頁共用。
 *
 * 選項文字與 BKE 的 static/wizard.html、static/shared-case-store.js 一字不差
 * （含選項前面的符號），所以 payload.summary 可以直接當 BKE A 表案件的 summary。
 * BKE 改了 A 表選項時，請同步更新這個檔案。
 *
 * 詢價資料格式（schema: oem-inquiry/1）
 * {
 *   schema: 'oem-inquiry/1',
 *   inquiryNo: 'RFQ-20261007-153012',
 *   submittedAt: ISO 時間字串,
 *   contact: { 公司, 聯絡人, 電話, Email, 預計上市, 銷售通路 },
 *   summary: { ...A 表欄位，鍵名與 BKE 相同... },
 *   extra:   { 預計訂購量, 外盒需求, 標籤需求, 包裝其他需求 }   // A 表沒有的欄位，也已寫進 summary 的成本備註、包材備註
 * }
 *
 * 接進 BKE 時（在 BKE 端處理，這裡不動 BKE）：
 *   BKECases.create({ type:'A', title: BKECases.suggestTitle(p.summary), customer: p.summary['客戶名稱'],
 *                     applicant: '線上詢價', summary: p.summary, tasks: BKECases.tasksA(p.summary) })
 */
(function () {
  'use strict';

  const A = {
    產品類別: ['👤 人營養補充品', '🐾 寵物補充品', '❓ 尚未確定／待客戶確認'],
    族群: ['全族群', '學童', '男性', '女性', '銀髮', '特殊族群'],
    族群年齡: {
      '全族群': ['全年齡'],
      '學童': ['3–6歲｜學齡前', '7–12歲｜國小', '13–17歲｜青少年'],
      '男性': ['青年（18–39歲）', '中壯年（40–64歲）', '老年（65歲以上）'],
      '女性': ['青年（18–39歲）', '中壯年（40–64歲）', '老年（65歲以上）'],
      '銀髮': ['55–64歲｜準銀髮', '65–74歲', '75歲以上'],
      '特殊族群': ['0–2歲', '3–6歲', '7–12歲', '13–17歲', '18–64歲', '65歲以上'],
    },
    // 調理部位 → 只列出對應的期望功能（同 BKE wizard.html 的 bodyDirectionMap）
    部位對應方向: {
      '眼睛': ['晶亮保養'],
      '大腦／專注': ['記憶／專注', '幫助入睡', '放鬆／情緒保養', '精神／體力補給'],
      '口腔': ['骨骼／牙齒保養'],
      '心血管／循環': ['循環保養', '代謝／窈窕管理'],
      '肝臟': ['代謝／窈窕管理', '精神／體力補給'],
      '腸胃道': ['排便順暢', '消化保養', '維持菌叢平衡'],
      '泌尿系統': ['調整體質', '日常防護力'],
      '骨骼／牙齒': ['骨骼／牙齒保養', '兒童成長營養', '銀髮營養支持'],
      '關節': ['靈活行動', '運動營養／恢復', '銀髮營養支持'],
      '肌肉': ['肌力／蛋白補給', '運動營養／恢復'],
      '皮膚': ['養顏美容'],
      '頭髮／指甲': ['養顏美容'],
      '女性私密／生理': ['女性調理', '孕哺營養補充'],
      '男性保養': ['男性保養'],
      '免疫系統': ['日常防護力', '調整體質'],
      '呼吸道／鼻': ['日常防護力', '調整體質'],
      '睡眠／情緒': ['幫助入睡', '放鬆／情緒保養'],
      '代謝／體重': ['代謝／窈窕管理', '調整體質'],
      '血糖': ['代謝／窈窕管理', '調整體質'],
      '血脂／膽固醇': ['循環保養', '代謝／窈窕管理'],
      '腎臟': ['調整體質', '日常防護力'],
      '內分泌／賀爾蒙': ['女性調理', '男性保養', '調整體質'],
      '耳朵／聽力': ['銀髮營養支持', '調整體質'],
      '孕產／哺乳': ['孕哺營養補充', '女性調理'],
      '兒童成長': ['兒童成長營養', '骨骼／牙齒保養'],
      '體力／精神': ['精神／體力補給', '運動營養／恢復'],
      '全身／日常保養': ['日常防護力', '調整體質', '精神／體力補給'],
    },
    期望功能: ['晶亮保養', '記憶／專注', '幫助入睡', '放鬆／情緒保養', '精神／體力補給', '排便順暢', '消化保養', '維持菌叢平衡',
      '日常防護力', '調整體質', '代謝／窈窕管理', '循環保養', '骨骼／牙齒保養', '靈活行動', '肌力／蛋白補給', '養顏美容',
      '女性調理', '男性保養', '孕哺營養補充', '兒童成長營養', '銀髮營養支持', '運動營養／恢復', '其他方向'],
    目標劑型: ['🧂 粉劑', '💊 膠囊', '🟠 軟膠囊', '⚪ 錠劑', '💧 液態', '🍮 果凍', '🍬 糖果', '🍪 餅乾', '✨ 其他特殊劑型'],
    // 劑型 → 規格欄位（同 BKE wizard.html 的 DOSAGE_SPEC_FIELDS）
    劑型規格: {
      '粉劑': [{key: '粉劑規格', type: 'number', unit: 'g／包'},
               {key: '粉劑包材', type: 'select', options: ['鋁袋（沖泡）', '鋁袋（口服）', '吸嘴袋', '瓶裝', '尚未決定／請營養師建議']}],
      '膠囊': [{key: '膠囊型式', type: 'select', options: ['硬膠囊', '液態硬膠囊']},
               {key: '膠囊材質', type: 'select', options: ['植物膠囊', '明膠膠囊', '光漾膠囊']},
               {key: '膠囊號數', type: 'select', options: ['00 號', '0 號', '1 號', '2 號']}],
      '軟膠囊': [{key: '軟膠囊膠皮材質', type: 'select', options: ['明膠（動物性）', '植物性軟膠囊']},
                 {key: '軟膠囊形狀', type: 'select', options: ['橢圓形', '長橢圓形', '圓形', '魚形', '管狀']},
                 {key: '軟膠囊容量', type: 'number', unit: 'minim（1 粒約 0.06 ml）'}],
      '錠劑': [{key: '錠劑形式', type: 'select', options: ['裸錠（無膜衣）', '膜衣錠', '口含錠', '咀嚼錠', '發泡錠']},
               {key: '錠劑形狀', type: 'select', options: ['圓形', '三角', '菱形', '橢圓', '長條']},
               {key: '錠劑重量', type: 'number', unit: 'mg／顆'}],
      '液態': [{key: '液態規格', type: 'number', unit: 'ml／份'},
               {key: '液態包材', type: 'select', options: ['玻璃瓶', '塑瓶（PE/PP）', 'Tritan耐熱瓶', '異型袋', '吸嘴袋', '滴瓶', '噴瓶', '鋁箔包', '依照需求', '尚未決定／請營養師建議']}],
      '果凍': [{key: '果凍規格', type: 'number', unit: 'g／份'},
               {key: '果凍包材', type: 'select', options: ['鋁袋（三面封）', '鋁袋（背封）', '吸嘴袋', '尚未決定／請營養師建議']}],
      '糖果': [{key: '糖果型態', type: 'select', options: ['硬糖', '軟糖']}],
      '餅乾': [],
      '其他特殊劑型': [{key: '其他劑型說明', type: 'text'}],
    },
    產品每盒單位: ['顆／盒', '錠／盒', '包／盒', '瓶／盒', '條／盒', '份／盒'],
    配方方式: ['全營養師開發', '偏好／指定原料（檢附資料）', '客供配方（檢附資料）', '仿樣（檢附資料）'],
    特殊需求: ['全素', '奶素', '蛋奶素', '無香料', '無人工甜味劑', '其他不額外添加', '申請HALAL', '申請A.A.', '申請查驗登記',
      '輸出（出口他國販售）', '商標授權', '專利原料', '需使用專利證書／號', '原廠研究資料'],
  };
  A.調理部位 = [...Object.keys(A.部位對應方向), '其他部位'];
  A.全部規格欄位 = Object.values(A.劑型規格).flat().map(f => f.key);

  // BKE 的核心欄位（缺少時營養師收案會退回補件）
  const CORE = ['客戶名稱', '產品名稱', '產品類別', '族群', '族群年齡', '調理部位', '期望功能', '客戶需求', '目標成本',
    '目標劑型', '配方方式', '產品售價', '產品每盒數量', '產品每盒單位', '特殊需求', '出口國別'];
  const UNSURE = '尚未確認';

  const clean = v => String(v ?? '').replace(/^[^\p{L}\p{N}]+/u, '').trim();      // 去掉選項前的符號
  const specFields = dosage => A.劑型規格[clean(dosage)] || [];
  const filled = v => Array.isArray(v) ? v.some(x => String(x).trim()) : String(v ?? '').trim() !== '';

  // 與 BKE shared-case-store.js 的 suggestTitle 相同規則
  function suggestTitle(d) {
    d = d || {};
    const first = v => Array.isArray(v) ? (v.find(x => String(x).trim()) || '') : String(v ?? '').trim();
    const customer = String(d['客戶名稱'] || '').trim(), product = String(d['產品名稱'] || '').trim();
    if (product) return customer ? `${customer}｜${product}` : product;
    const feature = first(d['期望功能']), part = first(d['調理部位']), dosage = clean(d['目標劑型']), category = clean(d['產品類別']);
    const core = feature || part || category || '客戶配方';
    let mid = [core, ...(part && part !== core ? [part] : [])].join('·');
    if (dosage) mid += `（${dosage}）`;
    return customer ? `${customer}｜${mid}` : `${mid}需求`;
  }

  // 「膠囊｜植物膠囊・0 號」這種一行描述
  function dosageText(s) {
    const d = clean(s['目標劑型']);
    if (!d) return '';
    const bits = specFields(s['目標劑型']).map(f => {
      const v = String(s[f.key] ?? '').trim();
      return v ? (f.unit ? `${v} ${f.unit}` : v) : '';
    }).filter(Boolean);
    return bits.length ? `${d}｜${bits.join('・')}` : d;
  }

  function missingCore(s) {
    return CORE.filter(k => {
      if (k === '出口國別' && !(s['特殊需求'] || []).includes('輸出（出口他國販售）')) return false;
      if (k === '特殊需求') return false;                      // 可不勾
      return !filled(s[k]);
    });
  }

  window.BKEAForm = {A, CORE, UNSURE, clean, specFields, filled, suggestTitle, dosageText, missingCore, schema: 'oem-inquiry/1'};
})();
