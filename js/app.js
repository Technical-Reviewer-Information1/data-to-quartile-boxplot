(function () {
  'use strict';
  const C = window.Chart, $ = id => document.getElementById(id);

  const SETS = {
    odd:     { raw: [58, 72, 45, 90, 66, 51, 78, 63, 84], label: '9個（奇数）' },
    even:    { raw: [58, 72, 45, 90, 66, 51, 78, 63, 84, 69], label: '10個（偶数）' },
    outlier: { raw: [58, 62, 45, 60, 66, 51, 57, 63, 59, 118], label: '外れ値あり' }
  };
  let setKey = 'odd', raw = SETS.odd.raw.slice(), stage = 0;

  /* --- 四分位数の計算（中央値法／教科書式） --- */
  function median(a) {
    const n = a.length;
    if (!n) return NaN;
    return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
  }
  function quartiles(arr) {
    const s = arr.slice().sort((a, b) => a - b), n = s.length;
    const half = Math.floor(n / 2);
    const lower = s.slice(0, half);
    const upper = n % 2 ? s.slice(half + 1) : s.slice(half);
    const q1 = median(lower), q2 = median(s), q3 = median(upper);
    const iqr = q3 - q1;
    const loF = q1 - 1.5 * iqr, hiF = q3 + 1.5 * iqr;
    const out = s.filter(v => v < loF || v > hiF);
    const inner = s.filter(v => v >= loF && v <= hiF);
    return { s, q1, q2, q3, iqr, min: s[0], max: s[n - 1],
             whiskLo: Math.min(...inner), whiskHi: Math.max(...inner), out, lower, upper };
  }

  const STAGES = [
    '① 小さい順に並べる',
    '② まん中（中央値 Q2）を見つける',
    '③ 下半分のまん中が Q1',
    '④ 上半分のまん中が Q3',
    'できあがり'
  ];

  function renderChips() {
    $('rawChips').innerHTML = raw.map(v => '<span class="chip">' + v + '</span>').join('');
    const q = quartiles(raw), n = q.s.length, half = Math.floor(n / 2);
    const box = $('sortedChips');
    if (stage === 0) { box.innerHTML = '<span style="color:var(--ink-3);font-size:.86rem">ボタンを押して手順を進めてください</span>'; }
    else {
      box.innerHTML = q.s.map((v, i) => {
        let cls = 'chip';
        const isLower = i < half, isUpper = n % 2 ? i > half : i >= half;
        if (stage >= 2 && n % 2 && i === half) cls += ' q2';
        if (stage >= 2 && n % 2 === 0 && (i === half - 1 || i === half)) cls += ' q2';
        if (stage >= 3 && isLower) cls += ' half';
        if (stage >= 4 && isUpper) cls += ' half';
        if (stage >= 5 && q.out.includes(v)) cls += ' out';
        return '<span class="' + cls + '">' + v + '</span>';
      }).join('');
    }
    $('stepLabel').textContent = '手順 ' + Math.min(stage, 4) + ' / 4';
    $('stepBtn').textContent = stage >= 5 ? 'すべて表示済み' : STAGES[Math.min(stage, 4)];
    $('stepBtn').disabled = stage >= 5;

    const nt = $('stepNote');
    nt.className = 'note info';
    if (stage === 0) nt.innerHTML = 'まずは並べ替えから。ここを飛ばすと四分位数は求められません。';
    else if (stage === 1) nt.innerHTML = '小さい順に並びました。データは <strong>' + n + '</strong> 個です。';
    else if (stage === 2) nt.innerHTML = n % 2
      ? '個数が奇数なので、まん中の <strong>' + q.q2 + '</strong> がそのまま中央値 Q2 です。'
      : '個数が偶数なので、まん中の2つ <strong>' + q.s[half - 1] + '</strong> と <strong>' + q.s[half] +
        '</strong> の平均をとって Q2＝<strong>' + q.q2 + '</strong> です。';
    else if (stage === 3) nt.innerHTML = '下半分（' + q.lower.join('・') + '）のまん中が Q1＝<strong>' + q.q1 + '</strong>。' +
      (n % 2 ? '奇数個のときは<strong>中央値そのものを下半分に含めません</strong>。' : '');
    else if (stage === 4) nt.innerHTML = '上半分（' + q.upper.join('・') + '）のまん中が Q3＝<strong>' + q.q3 + '</strong>。';
    else {
      let msg = '5つの数がそろいました。';
      if (q.out.length) {
        const loF = q.q1 - 1.5 * q.iqr, hiF = q.q3 + 1.5 * q.iqr;
        const low = q.out.filter(v => v < loF), high = q.out.filter(v => v > hiF);
        msg += '外れ値の目安は <span class="mono">Q1−1.5×IQR＝' + loF.toFixed(1) + '</span> より小さい値と、' +
               '<span class="mono">Q3＋1.5×IQR＝' + hiF.toFixed(1) + '</span> より大きい値です。';
        if (low.length) msg += '赤い枠の <strong>' + low.join('・') + '</strong> は小さいほうの外れ値。';
        if (high.length) msg += '赤い枠の <strong>' + high.join('・') + '</strong> は大きいほうの外れ値。';
      }
      nt.innerHTML = msg;
    }

    const show = stage >= 5;
    $('vMin').textContent = stage >= 1 ? q.min : '—';
    $('vMax').textContent = stage >= 1 ? q.max : '—';
    $('vQ2').textContent = stage >= 2 ? q.q2 : '—';
    $('vQ1').textContent = stage >= 3 ? q.q1 : '—';
    $('vQ3').textContent = stage >= 4 ? q.q3 : '—';
    $('vIQR').textContent = show ? q.iqr : '—';

    C.box5($('boxChart'), { W: 620, H: 130, labelW: 60, rows: [{
      name: 'データ', min: q.whiskLo, q1: q.q1, med: q.q2, q3: q.q3, max: q.whiskHi, outliers: q.out
    }] });
  }

  function setData(k) {
    setKey = k; raw = SETS[k].raw.slice(); stage = 0;
    document.querySelectorAll('[data-set]').forEach(b => b.setAttribute('aria-pressed', b.dataset.set === k));
    renderChips();
  }

  /* ---------- STEP3 ライブ ---------- */
  const LIVE_BASE = [45, 51, 55, 58, 60, 63, 66, 70, 74];
  function drawLive() {
    const m = +$('maxSlider').value;
    $('maxVal').textContent = m;
    const data = LIVE_BASE.concat([m]);
    const q = quartiles(data);
    C.box5($('liveBox'), { W: 620, H: 130, labelW: 60, xMin: 0, xMax: 125,
      rows: [{ name: 'データ', min: q.whiskLo, q1: q.q1, med: q.q2, q3: q.q3, max: q.whiskHi, outliers: q.out }] });
    const n = $('liveNote');
    if (q.out.length) {
      n.className = 'note ng';
      n.innerHTML = '<strong>' + m + ' は外れ値と判定されました。</strong>Q3＋1.5×IQR＝' + (q.q3 + 1.5 * q.iqr).toFixed(1) +
        ' を超えています。外れ値はひげの外に○で描き、ひげは外れ値でない範囲の最大値 ' + q.whiskHi + ' までにします。' +
        '　Q1＝' + q.q1 + '・中央値＝' + q.q2 + '・Q3＝' + q.q3 + ' は<strong>ほとんど動きません</strong>。';
    } else {
      n.className = 'note info';
      n.innerHTML = '最大値を動かしても、Q1＝' + q.q1 + '・中央値＝' + q.q2 + '・Q3＝' + q.q3 +
        ' は<strong>変わりません</strong>。四分位数は「順番」で決まるので、いちばん端の値がどれだけ大きくても影響を受けにくいのです。' +
        '（平均値ならすぐに引きずられます。）';
    }
  }

  /* ---------- STEP4 比較 ---------- */
  const CMP = [42,48,51,53,55,55,57,58,58,60,60,61,62,63,64,65,65,66,67,68,68,69,70,70,71,72,73,74,75,76,77,78,79,81,83,85,88,90,93,97];
  function drawCompare() {
    const edges = [40,50,60,70,80,90,100];
    const counts = new Array(6).fill(0);
    CMP.forEach(v => counts[Math.min(5, Math.floor((v - 40) / 10))]++);
    C.hist($('cmpHist'), { W: 440, H: 260, counts, edges });
    const q = quartiles(CMP);
    C.box5($('cmpBox'), { W: 440, H: 150, labelW: 52, xMin: 40, xMax: 100,
      rows: [{ name: '点数', min: q.whiskLo, q1: q.q1, med: q.q2, q3: q.q3, max: q.whiskHi, outliers: q.out,
               mean: CMP.reduce((a,b)=>a+b,0)/CMP.length }] });
  }

  function init() {
    document.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => setData(b.dataset.set)));
    $('shuffleBtn').addEventListener('click', () => { raw = raw.slice().sort(() => Math.random() - .5); stage = 0; renderChips(); });
    $('stepBtn').addEventListener('click', () => { stage++; renderChips(); });
    $('stepReset').addEventListener('click', () => { stage = 0; renderChips(); });
    $('maxSlider').addEventListener('input', drawLive);
    setData('odd'); drawLive(); drawCompare();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
