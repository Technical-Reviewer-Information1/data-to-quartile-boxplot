(function () {
  'use strict';
  const C = window.Chart, T = window.Tools, $ = id => document.getElementById(id);

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


  /* ---------- STEP5 本文形式の読み取り演習 ---------- */
  const FIGS = {
    exam: { title: '図1　1学年200名の英語と数学のテストの結果（単位：点）',
      rows: [
        { name: '英語', min: 42, q1: 66, med: 76, q3: 90, max: 100 },
        { name: '数学', min: 20, q1: 50, med: 68, q3: 84, max: 100 }
      ], xMin: 0, xMax: 105, n: 200 },
    city: { title: '図2　3つの都市の2025年8月における日別最高気温（外れ値は○）',
      rows: [
        { name: 'A市', min: 29.0, q1: 31.5, med: 33.0, q3: 35.0, max: 36.5, outliers: [27.0] },
        { name: 'B市', min: 30.5, q1: 33.0, med: 34.5, q3: 36.0, max: 39.5, outliers: [] },
        { name: 'C市', min: 32.0, q1: 35.0, med: 37.0, q3: 38.5, max: 39.0, outliers: [] }
      ], xMin: 25, xMax: 41, n: 31 }
  };
  const READQ = [
    { fig: 'exam', t: '数学の中央値は英語の第1四分位数よりも大きい。この記述は図から読み取れるか。',
      choices: ['読み取れる', '読み取れない'], a: '読み取れる',
      why: '数学の中央値は68点、英語の第1四分位数は66点。68 > 66 なので読み取れます。値そのものを比べるだけで判断できます。' },
    { fig: 'exam', t: '英語の点数の散らばりは数学と比べると小さい。この記述は図から読み取れるか。',
      choices: ['読み取れる', '読み取れない'], a: '読み取れる',
      why: '英語の箱（Q1〜Q3）は66〜90で幅24点、数学は50〜84で幅34点。四分位範囲も全体の幅も英語のほうが小さいので、散らばりは小さいと言えます。' },
    { fig: 'exam', t: '英語のテストでは上位25％の生徒は90点以上である。この記述は図から読み取れるか。',
      choices: ['読み取れる', '読み取れない'], a: '読み取れる',
      why: '第3四分位数が90点なので、90点以上がちょうど上位25％にあたります。200人なら約50人です。' },
    { fig: 'exam', t: '数学のテストが50点以下であった生徒は少なくとも50人はいる。この記述は図から読み取れるか。',
      choices: ['読み取れる', '読み取れない'], a: '読み取れる',
      why: '数学の第1四分位数が50点。下位25％、つまり200×0.25＝50人が50点以下の側にいます。「少なくとも50人」と言えます。' },
    { fig: 'exam', t: '英語で80点をとった生徒は何人いるかがわかる。この記述は図から読み取れるか。',
      choices: ['読み取れる', '読み取れない'], a: '読み取れない',
      why: '箱ひげ図は5つの目印だけを示す図です。<strong>特定の点数の人数は読み取れません。</strong>そこはヒストグラムの役割です。' },
    { fig: 'city', t: '3つの都市のうち、最小値が最も大きい都市はC市である。',
      choices: ['正しい', '正しくない'], a: '正しい',
      why: 'ひげの左端はA市29.0℃（外れ値27.0を除く）、B市30.5℃、C市32.0℃。C市がもっとも大きくなっています。' },
    { fig: 'city', t: 'B市の最大値が最も大きいので、B市は8月中で最も暑かった日が多いといえる。',
      choices: ['正しい', '正しくない'], a: '正しくない',
      why: '最大値が大きいのは「その1日が暑かった」ことしか意味しません。全体としてはC市のほうが中央値もQ3も高く、暑い日が多いといえます。' },
    { fig: 'city', t: 'A市の最大値よりC市の中央値のほうが大きいので、C市がA市の最大値を上回った日は31日のうち16日以上ある。',
      choices: ['正しい', '正しくない'], a: '正しい',
      why: 'C市の中央値は37.0℃で、A市の最大値36.5℃より大きい。中央値以上の日は全体の半分（31日なら16日）以上あるので、その16日以上はすべて A市の最大値36.5℃を上回っていたことになります。<strong>中央値と他都市の最大値を比べると、日数まで言える</strong>のがこの図の強みです。' },
    { fig: 'city', t: 'C市のほうが第3四分位数が大きいので、38.0℃以上だった日数もC市のほうが多いといえる。',
      choices: ['正しい', '正しくない'], a: '正しくない',
      why: '第3四分位数の大小からは「上位25％の境目」しかわかりません。<strong>特定の温度以上の日数は箱ひげ図からは数えられません。</strong>' }
  ];
  let rList = [], ri = 0, rScore = 0;
  function startRead() { rList = shuffle(READQ); ri = 0; rScore = 0; renderRead(); }
  function renderRead() {
    if (ri >= rList.length) {
      $('qText').textContent = rScore + ' / ' + rList.length + ' 問正解';
      $('qChoices').innerHTML = ''; $('qFb').hidden = true; $('qNext').disabled = true;
      $('qProgress').textContent = rList.length + ' / ' + rList.length; return;
    }
    const it = rList[ri], f = FIGS[it.fig];
    $('figTitle').textContent = f.title;
    C.box5($('qFigure'), { W: 620, H: 60 + f.rows.length * 52, labelW: 62,
      xMin: f.xMin, xMax: f.xMax, rows: f.rows });
    $('qProgress').textContent = (ri + 1) + ' / ' + rList.length;
    $('qScore').textContent = rScore;
    $('qText').textContent = it.t;
    const box = $('qChoices'); box.className = 'choice4'; box.innerHTML = '';
    it.choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn'; b.textContent = c; b.dataset.c = c;
      b.addEventListener('click', () => answerRead(c));
      box.appendChild(b);
    });
    $('qFb').hidden = true; $('qNext').disabled = true;
    $('qNext').textContent = (ri === rList.length - 1) ? '結果を見る' : '次の問題';
  }
  function answerRead(c) {
    const it = rList[ri], ok = c === it.a, box = $('qChoices');
    box.classList.add('locked');
    [...box.children].forEach(b => {
      if (b.dataset.c === it.a) b.classList.add('correct');
      else if (b.dataset.c === c) b.classList.add('wrong');
    });
    if (ok) rScore++;
    const fb = $('qFb');
    fb.className = 'note ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = (ok ? '正解。' : '正解は「<strong>' + it.a + '</strong>」。') + it.why;
    fb.hidden = false;
    $('qScore').textContent = rScore; $('qNext').disabled = false;
  }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- STEP6 自分のデータ ---------- */
  let grid = null, gh = [];
  function refreshCols(rows, hdr) {
    gh = hdr;
    const nums = grid.numericColumns();
    const g = $('gCol'), v = $('vCol');
    const pg = g.value, pv = v.value;
    g.innerHTML = '<option value="-1">（グループ分けしない）</option>' +
      hdr.map((h, j) => '<option value="' + j + '">' + h + '</option>').join('');
    v.innerHTML = hdr.map((h, j) => '<option value="' + j + '"' + (nums.indexOf(j) < 0 ? ' disabled' : '') +
      '>' + h + (nums.indexOf(j) < 0 ? '（数値でない列）' : '') + '</option>').join('');
    if (pg !== '' && +pg < hdr.length) g.value = pg;
    else { const t = hdr.map((_, j) => j).find(j => nums.indexOf(j) < 0); g.value = (t != null ? t : -1); }
    if (pv !== '' && v.querySelector('option[value="' + pv + '"]:not([disabled])')) v.value = pv;
    else if (nums.length) v.value = nums[0];
    calcMine();
  }
  function calcMine() {
    if (!grid) return;
    const G = window.DataGrid;
    const gj = +$('gCol').value, vj = +$('vCol').value;
    const rows = grid.getData();
    const map = new Map();
    rows.forEach(r => {
      const val = G.strNum(r[vj]);
      if (val == null) return;
      const key = gj < 0 ? 'すべて' : (String(r[gj] || '').trim() || '（未分類）');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(val);
    });
    const groups = [...map.entries()].filter(([, v]) => v.length >= 4);
    const n = $('myNote');
    if (!groups.length) {
      n.hidden = false; n.className = 'note ng';
      n.textContent = '1グループにつき4つ以上の数値が必要です。値の列に数値の列をえらんでください。';
      ['myChart', 'myTable', 'myTools'].forEach(i => $(i).innerHTML = '');
      return;
    }
    const rowsOut = groups.map(([name, vals]) => {
      const q = quartiles(vals);
      return { name, min: q.whiskLo, q1: q.q1, med: q.q2, q3: q.q3, max: q.whiskHi, outliers: q.out,
               mean: vals.reduce((a, b) => a + b, 0) / vals.length, _q: q, _n: vals.length };
    });
    const all = groups.flatMap(([, v]) => v);
    const pad = (Math.max(...all) - Math.min(...all)) * .08 || 1;
    C.box5($('myChart'), { W: 660, H: 60 + rowsOut.length * 54, labelW: 92,
      xMin: Math.min(...all) - pad, xMax: Math.max(...all) + pad, rows: rowsOut });
    $('myTable').innerHTML = '<thead><tr><th>グループ</th><th>個数</th><th>最小</th><th>Q1</th><th>中央値</th><th>Q3</th><th>最大</th><th>IQR</th><th>平均</th><th>外れ値</th></tr></thead><tbody>' +
      rowsOut.map(r => '<tr><td>' + r.name + '</td><td>' + r._n + '</td><td>' + r._q.min + '</td><td>' + r._q.q1 +
        '</td><td>' + r._q.q2 + '</td><td>' + r._q.q3 + '</td><td>' + r._q.max + '</td><td>' + r._q.iqr +
        '</td><td>' + r.mean.toFixed(2) + '</td><td>' + (r.outliers.length ? r.outliers.join(', ') : 'なし') + '</td></tr>').join('') +
      '</tbody>';
    const withOut = rowsOut.filter(r => r.outliers.length);
    n.hidden = false;
    n.className = withOut.length ? 'note warn' : 'note info';
    n.innerHTML = groups.length + ' グループを比べました（緑の◆は平均値）。' +
      (withOut.length ? '<strong>' + withOut.map(r => r.name).join('・') + '</strong> に外れ値があります（○印）。記録ミスか、本当に特別な値かを確かめましょう。'
                      : '外れ値と判定された値はありません。箱の長さ（IQR）を比べると、ばらつきの大きいグループがわかります。');
    $('myTools').innerHTML = '';
    $('myTools').appendChild(T.saveButton(() => $('myChart').querySelector('svg'), '箱ひげ図'));
    const sh = document.createElement('button');
    sh.className = 'btn sm ghost'; sh.textContent = 'このデータのURLを作る';
    sh.addEventListener('click', () => T.share({ d: grid.getRaw(), h: grid.getHeader(), g: gj, v: vj }, sh));
    $('myTools').appendChild(sh);
    const pr = document.createElement('button');
    pr.className = 'btn sm ghost'; pr.textContent = '印刷する';
    pr.addEventListener('click', T.printPage);
    $('myTools').appendChild(pr);
  }

  function init() {
    document.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => setData(b.dataset.set)));
    $('shuffleBtn').addEventListener('click', () => { raw = raw.slice().sort(() => Math.random() - .5); stage = 0; renderChips(); });
    $('stepBtn').addEventListener('click', () => { stage++; renderChips(); });
    $('stepReset').addEventListener('click', () => { stage = 0; renderChips(); });
    $('maxSlider').addEventListener('input', drawLive);
    $('qNext').addEventListener('click', () => { ri++; renderRead(); });
    $('qReset').addEventListener('click', startRead);
    $('calcMine').addEventListener('click', calcMine);
    ['gCol', 'vCol'].forEach(i => $(i).addEventListener('change', calcMine));
    const shared = T.readShared();
    const initData = (shared && shared.d) ? shared.d : [
      ['A組','58'],['A組','60'],['A組','61'],['A組','62'],['A組','62'],['A組','63'],['A組','64'],['A組','65'],['A組','66'],['A組','69'],
      ['B組','35'],['B組','42'],['B組','48'],['B組','55'],['B組','62'],['B組','68'],['B組','74'],['B組','80'],['B組','88'],['B組','78'],
      ['C組','50'],['C組','52'],['C組','55'],['C組','58'],['C組','60'],['C組','62'],['C組','64'],['C組','66'],['C組','70'],['C組','95']
    ];
    const initHeader = (shared && shared.h) ? shared.h : ['クラス', '点数'];
    grid = window.DataInput.create($('dataInput'), {
      header: initHeader, data: initData, minRows: 4, onChange: refreshCols
    });
    window.Terms.glossary($('glossBox'), ['四分位数', '四分位範囲', '外れ値', '箱ひげ図', '中央値', '平均値', 'ヒストグラム']);
    setData('odd'); drawLive(); drawCompare(); startRead();
    refreshCols(grid.getData(), grid.getHeader());
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
