/* 컴활 1급 실기 데이터베이스 - SQL 쿼리 연습소 엔진 */
'use strict';

var PROBS = window.SQL_PROBLEMS || [];
var TABLES = window.SQL_TABLES || {};
var $ = function (id) { return document.getElementById(id); };
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

var state = { cat: '전체', queue: [], idx: 0, correct: 0, answered: false, startTime: 0 };

/* ---------- 시작 화면 ---------- */
function categories() { var set = {}; PROBS.forEach(function (p) { set[p.cat] = 1; }); return ['전체'].concat(Object.keys(set)); }
function renderStart() {
  hide('practice'); hide('result'); show('start');
  var box = $('catChips'); box.innerHTML = '';
  categories().forEach(function (c) {
    var el = document.createElement('div');
    el.className = 'chip' + (c === state.cat ? ' on' : '');
    el.textContent = c === '전체' ? ('전체 (' + PROBS.length + ')') : c;
    el.onclick = function () { state.cat = c; renderStart(); };
    box.appendChild(el);
  });
}

/* ---------- 연습 진행 ---------- */
function startPractice() {
  var pool = state.cat === '전체' ? PROBS : PROBS.filter(function (p) { return p.cat === state.cat; });
  state.queue = shuffle(pool);
  state.idx = 0; state.correct = 0; state.startTime = Date.now();
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
  setTimeout(function () { sql.focus(); }, 40);
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
  if ('error' in stu) { flash('<b>❌ 실행 오류:</b> ' + esc(stu.error), 'no'); return; }
  var model = SQLEngine.run(p.answer, tbl);
  // 액션 쿼리(INSERT/UPDATE/DELETE)는 '실행 후 테이블 상태'를, 선택 쿼리는 결과셋을 비교
  var typeMatch = (!!model.action === !!stu.action);
  var ok = !('error' in model) && typeMatch && sameResult(stu, model, model.action ? false : model.ordered);
  state.answered = true;
  $('sql').disabled = true;
  var last = state.idx === state.queue.length - 1;
  var head, cls;
  if (ok) {
    state.correct++; $('scoreLabel').textContent = state.correct + '점';
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
  $('fb').innerHTML = '<div class="feedback ok">모범답안 <span class="ansline">' + esc(p.answer) + '</span>' +
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
    '<button class="btn" onclick="startPractice()">다시 풀기</button></div></div>';
}

/* ---------- 결과 제출(collector) ---------- */
function submitEnabled() { return !!(window.ResultCollector && ResultCollector.config && ResultCollector.config.endpoint); }
function submitBtnHtml() {
  if (!submitEnabled()) return '';
  return '<div class="row" style="justify-content:center;margin:14px 0 4px">' +
    '<button class="btn green" id="sqlSubmit" onclick="submitResult()">📤 선생님께 결과 제출</button></div>';
}
function submitResult() {
  if (!submitEnabled()) return;
  var n = state.queue.length, c = state.correct;
  ResultCollector.config.tool = '컴활1급 실기-데이터베이스' + (state.cat !== '전체' ? (' · ' + state.cat) : '');
  ResultCollector.open({ score: Math.round(c / n * 100), correct: c, total: n, durationSec: state.durationSec, labels: { score: '정답률', correct: '맞힘', total: '문항수' } });
}

/* ---------- Ctrl+Enter 실행 ---------- */
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !$('practice').classList.contains('hidden')) {
    e.preventDefault(); checkAnswer();
  }
});

renderStart();
