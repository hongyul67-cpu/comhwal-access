/* 컴활 1급 실기 데이터베이스 - SQL 쿼리 연습소 엔진 */
'use strict';

var PROBS = window.SQL_PROBLEMS || [];
var TABLES = window.SQL_TABLES || {};
var $ = function (id) { return document.getElementById(id); };
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

/* fixed=true  → 수업용 '함께 풀기'. 문제 순서를 절대 섞지 않아 모든 PC에서 N번 문제가 같다.
   fixed=false → 학생 개인 연습. 매번 섞어서 출제. */
var state = { cat: '전체', queue: [], idx: 0, correct: 0, answered: false, startTime: 0,
              fixed: false, marked: {}, uiMode: 'class' };

/* ---------- 시작 화면 ---------- */
function categories() { var set = {}; PROBS.forEach(function (p) { set[p.cat] = 1; }); return ['전체'].concat(Object.keys(set)); }
function renderStart() {
  hide('practice'); hide('result'); show('start');
  ['catChipsC', 'catChips'].forEach(function (boxId) {
    var box = $(boxId); if (!box) return;
    box.innerHTML = '';
    categories().forEach(function (c) {
      var n = c === '전체' ? PROBS.length : PROBS.filter(function (p) { return p.cat === c; }).length;
      var el = document.createElement('div');
      el.className = 'chip' + (c === state.cat ? ' on' : '');
      el.textContent = c + ' (' + n + ')';
      el.onclick = function () { state.cat = c; renderStart(); };
      box.appendChild(el);
    });
  });
}
function pickMode(m) {
  state.uiMode = m;
  [['mcClass', 'class'], ['mcPractice', 'practice']].forEach(function (x) {
    var el = $(x[0]); if (el) el.classList.toggle('on', m === x[1]);
  });
  [['classPanel', 'class'], ['practicePanel', 'practice']].forEach(function (x) {
    if ($(x[0])) (m === x[1] ? show : hide)(x[0]);
  });
}

/* ---------- 연습 진행 ---------- */
/* 수업용: 교재(데이터) 순서 그대로 — 섞지 않는다 */
function startClass() { startPractice(true); }
function startPractice(fixed) {
  state.fixed = (fixed === true);
  var pool = state.cat === '전체' ? PROBS : PROBS.filter(function (p) { return p.cat === state.cat; });
  state.queue = state.fixed ? pool.slice() : shuffle(pool);
  state.idx = 0; state.correct = 0; state.marked = {}; state.startTime = Date.now();
  if (!state.queue.length) return;
  hide('start'); hide('result'); show('practice');
  renderProblem();
}
function quitPractice() { renderStart(); }

function renderProblem() {
  var p = state.queue[state.idx];
  state.answered = false;
  $('progLabel').textContent = (state.idx + 1) + ' / ' + state.queue.length;
  $('pgFill').style.width = (state.idx / state.queue.length * 100) + '%';
  $('scoreLabel').textContent = state.correct + '점';
  $('catTag').textContent = p.cat;
  $('pTitle').textContent = p.title;
  $('pPrompt').innerHTML = p.prompt;
  $('tblName').textContent = '📋 ' + p.table + ' 테이블';
  $('fb').innerHTML = '';
  renderTable(TABLES[p.table]);
  var sql = $('sql'); sql.value = ''; sql.disabled = false;
  clearLiveTimer();
  $('toolBtns').innerHTML =
    (state.fixed ? '<button class="btn ghost" onclick="prevProblem()"' + (state.idx === 0 ? ' disabled' : '') + '>← 이전</button>' : '') +
    '<button class="btn green" onclick="checkAnswer()">▶ 실행 · 채점</button>' +
    '<button class="btn sec" onclick="showHint()">💡 힌트</button>' +
    '<button class="btn ghost" onclick="showModel()">모범답안</button>' +
    '<button class="btn ghost" onclick="skipProblem()">' + (state.fixed ? '다음 →' : '건너뛰기 →') + '</button>' +
    (state.fixed ? jumpSelectHtml() : '');
  updateLive();
  setTimeout(function () { sql.focus(); }, 40);
}

/* 수업용 — 원하는 문제 번호로 바로 이동 (선생님이 "12번 볼게요" 할 때) */
function jumpSelectHtml() {
  var opts = state.queue.map(function (p, i) {
    return '<option value="' + i + '"' + (i === state.idx ? ' selected' : '') + '>' +
      (i + 1) + '. ' + esc(p.title) + '</option>';
  }).join('');
  return '<div class="spacer"></div><select class="jump" onchange="jumpTo(this.value)">' + opts + '</select>';
}
function jumpTo(i) {
  i = parseInt(i, 10);
  if (isNaN(i) || i < 0 || i >= state.queue.length) return;
  state.idx = i; renderProblem();
}
function prevProblem() { if (state.idx > 0) { state.idx--; renderProblem(); } }

/* ---------- 쓰는 동안 결과 미리보기 ----------
 * 엑셀 연습소의 '노란 칸 실시간 결과'에 해당한다.
 * 채점(정답 여부)은 절대 알려주지 않고, 내 쿼리가 실제로 무엇을 뽑아오는지만 보여 준다.
 * 아직 문장을 다 안 썼으면 빨간 오류 대신 조용히 안내만 한다. */
function sqlLooksIncomplete(q) {
  var u = q.toUpperCase().trim();
  if (u.length < 8) return true;
  if ((q.match(/'/g) || []).length % 2 === 1) return true;
  var depth = 0;
  for (var i = 0; i < q.length; i++) { if (q[i] === '(') depth++; else if (q[i] === ')') depth--; }
  if (depth > 0) return true;
  if (/[,(=<>!+*\/.-]$/.test(u)) return true;
  // 키워드로 끝나면 아직 쓰는 중
  if (/\b(SELECT|FROM|WHERE|AND|OR|NOT|BY|GROUP|ORDER|HAVING|SET|INTO|VALUES|LIKE|IN|BETWEEN|AS|ASC|DESC|UPDATE|DELETE|INSERT|DISTINCT)\s*$/.test(u)) return true;
  // SELECT 인데 FROM이 아직 없으면 쓰는 중
  if (/^SELECT\b/.test(u) && !/\bFROM\b/.test(u)) return true;
  return false;
}
function liveBox(cls, head, body) {
  var el = $('live');
  if (!el) return;
  el.className = 'livebox' + (cls ? ' ' + cls : '');
  el.innerHTML = '<div class="livehead">' + head + '</div>' + (body || '');
}
var liveTimer = null;
function clearLiveTimer() { if (liveTimer) { clearTimeout(liveTimer); liveTimer = null; } }
function typing(msg) { liveBox('', '▶ 미리 실행', '<div class="livemsg">' + msg + '</div>'); }
/* settled=true 면 "손을 멈춘 뒤"라는 뜻 — 그때만 빨간 오류를 보여 준다.
   SQL은 단어를 치는 도중(WHER…, 부…)이 전부 오류라, 바로 띄우면 빨간 글씨가 계속 번쩍인다. */
function updateLive(settled) {
  if (state.answered) return;                  // 채점 뒤에는 그대로 둔다
  var p = state.queue[state.idx];
  if (!p || !$('live')) return;
  if (!settled) clearLiveTimer();
  var raw = ($('sql').value || '').trim();
  if (!raw) { typing('쿼리를 쓰기 시작하면 여기에 <b>실제 실행 결과</b>가 바로 나타납니다.'); return; }
  if (sqlLooksIncomplete(raw)) { typing('…쿼리를 마저 쓰는 중'); return; }
  var res = SQLEngine.run(raw, TABLES[p.table]);
  if (!('error' in res)) {
    liveBox('ok', '▶ 미리 실행 · ' + (res.action ? '실행 후 테이블' : '결과') + ' ' + res.rows.length + '행',
      resultTable(res));
    return;
  }
  if (settled) { liveBox('err', '⚠ 실행 오류', '<div class="livemsg">' + esc(res.error) + '</div>'); return; }
  typing('…쿼리를 마저 쓰는 중');
  liveTimer = setTimeout(function () { liveTimer = null; updateLive(true); }, 700);
}

function renderTable(tbl) {
  var html = '<tr>';
  tbl.columns.forEach(function (c) { html += '<th>' + esc(c) + '</th>'; });
  html += '</tr>';
  tbl.rows.forEach(function (r) {
    html += '<tr>';
    r.forEach(function (v) {
      var isNum = (typeof v === 'number');
      html += '<td class="' + (isNum ? 'num' : '') + '">' + (v === null ? '' : esc(v)) + '</td>';
    });
    html += '</tr>';
  });
  $('sheet').innerHTML = html;
}

/* ---------- 결과셋 비교 ---------- */
function normRows(rows) {
  return rows.map(function (r) { return r.map(function (v) { return v === null ? '∅' : (typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : String(v)); }).join(''); });
}
function sameResult(a, b, ordered) {
  if (a.rows.length !== b.rows.length) return false;
  if (a.rows.length && a.rows[0].length !== b.rows[0].length) return false;
  var ra = normRows(a.rows), rb = normRows(b.rows);
  if (!ordered) { ra = ra.slice().sort(); rb = rb.slice().sort(); }
  return ra.join('') === rb.join('');
}
function fmtNum(v) { return (typeof v === 'number' && v % 1 !== 0) ? (Math.round(v * 100) / 100) : v; }
function resultTable(res) {
  if (!res.rows.length) return '<div style="color:var(--tx2);font-size:13px">(결과 0행)</div>';
  var h = '<div class="gridwrap" style="margin:8px 0 0"><table class="sheet"><tr>';
  res.columns.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
  h += '</tr>';
  res.rows.slice(0, 20).forEach(function (r) {
    h += '<tr>';
    r.forEach(function (v) { h += '<td class="' + (typeof v === 'number' ? 'num' : '') + '">' + (v === null ? '' : esc(fmtNum(v))) + '</td>'; });
    h += '</tr>';
  });
  h += '</table></div>';
  return h;
}

/* ---------- 채점 ---------- */
function checkAnswer() {
  if (state.answered) { nextProblem(); return; }
  var p = state.queue[state.idx];
  var raw = $('sql').value.trim();
  if (!raw) { flash('SQL을 입력하세요. (예: SELECT ... FROM ...)', 'no'); return; }
  var tbl = TABLES[p.table];
  var stu = SQLEngine.run(raw, tbl);
  if ('error' in stu) {
    liveBox('err', '⚠ 실행 오류', '<div class="livemsg">' + esc(stu.error) + '</div>');
    flash('<b>❌ 실행 오류:</b> ' + esc(stu.error) + '<br>위 미리 실행 칸에도 같은 오류가 나옵니다.', 'no');
    return;
  }
  var model = SQLEngine.run(p.answer, tbl);
  // 액션 쿼리(INSERT/UPDATE/DELETE)는 '실행 후 테이블 상태'를, 선택 쿼리는 결과셋을 비교
  var typeMatch = (!!model.action === !!stu.action);
  var ok = !('error' in model) && typeMatch && sameResult(stu, model, model.action ? false : model.ordered);
  state.answered = true;
  clearLiveTimer();
  $('sql').disabled = true;
  liveBox(ok ? 'ok' : 'err', (ok ? '✅ ' : '❌ ') + (stu.action ? '실행 후 테이블' : '내 쿼리 결과') + ' ' + stu.rows.length + '행', resultTable(stu));
  var last = state.idx === state.queue.length - 1;
  var head, cls;
  if (ok) {
    /* 수업용은 앞뒤로 오갈 수 있어 같은 문제를 두 번 맞혀도 점수가 중복되지 않게 한다 */
    if (!state.marked[state.idx]) { state.marked[state.idx] = 1; state.correct++; }
    $('scoreLabel').textContent = state.correct + '점';
    head = '<b>✅ 정답!</b> ' + (stu.action ? ('실행 후 ' + stu.rows.length + '행') : ('실행 결과 ' + stu.rows.length + '행'));
    cls = 'ok';
  } else if (!typeMatch) {
    head = '<b>❌ 오답</b> · 쿼리 종류가 다릅니다. ' + (model.action ? '데이터를 바꾸는 <b>실행 쿼리</b>가 필요해요.' : '조회하는 <b>SELECT</b>가 필요해요.');
    cls = 'no';
  } else { head = '<b>❌ 오답</b> · 결과가 정답과 다릅니다.'; cls = 'no'; }
  $('fb').innerHTML = '<div class="feedback ' + cls + '">' + head +
    '<div style="margin-top:6px;color:var(--tx2);font-size:13px">' + (stu.action ? '실행 후 테이블' : '내 쿼리 결과') + '</div>' + resultTable(stu) +
    '<div style="margin-top:10px">모범답안 <span class="ansline">' + esc(p.answer) + '</span></div>' +
    (p.hint ? '<div style="margin-top:6px;color:var(--tx2)">💡 ' + esc(p.hint) + '</div>' : '') +
    '<div class="row" style="margin-top:12px"><button class="btn" onclick="nextProblem()">' +
    (last ? '결과 보기 →' : '다음 문제 →') + '</button></div></div>';
}
function flash(msg, cls) { $('fb').innerHTML = '<div class="feedback ' + cls + '">' + msg + '</div>'; }
function nextProblem() { if (state.idx < state.queue.length - 1) { state.idx++; renderProblem(); } else showResult(); }
function skipProblem() { if (state.answered) { nextProblem(); return; } nextProblem(); }
function showHint() { flash('💡 ' + esc(state.queue[state.idx].hint || '힌트가 없습니다.'), 'ok'); }
function showModel() {
  var p = state.queue[state.idx];
  var m = SQLEngine.run(p.answer, TABLES[p.table]);
  var mv = ('error' in m) ? '-' : (m.rows.length + '행');
  $('fb').innerHTML = '<div class="feedback ok">모범답안 <span class="ansline">' + esc(p.answer) + '</span>' +
    '<div style="margin-top:6px">이 쿼리를 실행하면 <b>' + mv + '</b>이 나옵니다.</div>' +
    (p.hint ? '<div style="margin-top:6px;color:var(--tx2)">💡 ' + esc(p.hint) + '</div>' : '') +
    '<div style="margin-top:6px;color:var(--tx2);font-size:13px">직접 따라 써보고 [실행]을 눌러 보세요.</div></div>';
}

/* ---------- 결과 ---------- */
function showResult() {
  hide('practice'); show('result');
  var n = state.queue.length, c = state.correct, pct = Math.round(c / n * 100);
  /* 랭킹전 — 채점 후 RP 정산 */
  if (window.RankKit) RankKit.award(pct, '컴활 1급 실기 SQL');
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';
  var msg = pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요!' : pct >= 40 ? '조금만 더!' : '연습이 필요해요';
  state.durationSec = Math.round((Date.now() - state.startTime) / 1000);
  $('result').innerHTML = '<div class="result pcard"><div class="big">' + emoji + '</div>' +
    '<div class="score">' + c + ' / ' + n + '</div>' +
    '<div style="color:var(--tx2);margin-top:4px">정답률 ' + pct + '% · ' + msg + '</div>' +
    submitBtnHtml() +
    '<div class="rbtns"><button class="btn sec" onclick="renderStart()">범위 다시 선택</button>' +
    '<button class="btn" onclick="startPractice(' + (state.fixed ? 'true' : 'false') + ')">다시 풀기</button></div></div>';
}

/* ---------- 결과 제출(collector) ---------- */
function submitEnabled() { return !!(window.ResultCollector && ResultCollector.config && ResultCollector.config.endpoint); }
function submitBtnHtml() {
  
  return '<div class="row" style="justify-content:center;margin:14px 0 4px">' +
    '<button class="btn green" id="sqlSubmit" onclick="submitResult()">📤 선생님께 결과 제출</button></div>';
}
function submitGuide() {
  alert(['이 링크로는 제출이 되지 않아요.', '',
    '선생님이 나눠 준 제출용 링크(주소 뒤에 ?rc=... 가 붙은 링크)로',
    '들어와야 반·번호를 입력하고 결과를 보낼 수 있습니다.', '',
    '연습은 지금 이대로 계속 하셔도 됩니다.'].join(String.fromCharCode(10)));
}
function submitResult() {
  if (!submitEnabled()) { submitGuide(); return; }
  var n = state.queue.length, c = state.correct;
  // 시트 탭은 하나로 — 분류는 mode 로 (규약 §1 ①)
  ResultCollector.config.tool = '컴활 1급 실기-데이터베이스';
  ResultCollector.open({
    score: Math.round(c / n * 100), correct: c, total: n,
    durationSec: state.durationSec,
    labels: { score: '정답률', correct: '맞힘', total: '문항수' },
    mode: '데이터베이스 실기 — ' + (state.fixed ? '함께 풀기(수업)' : '랜덤 연습') + ' · ' + (state.cat || '전체'),
    extra: ['SQL 작성'],
  });
}

/* ---------- 입력할 때마다 미리 실행 ---------- */
function bindLive() {
  var el = $('sql');
  if (el && !el.__live) { el.__live = 1; el.addEventListener('input', updateLive); }
}
document.addEventListener('DOMContentLoaded', bindLive);
bindLive();

/* ---------- Ctrl+Enter 실행 ---------- */
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !$('practice').classList.contains('hidden')) {
    e.preventDefault(); checkAnswer();
  }
});

renderStart();
