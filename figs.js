/* ══════════════════════════════════════════════════════════════
   컴활 1급 실기 · 데이터베이스 실무(액세스) — 그림 모음 (보조03 · 2026-10-01)
   공용 그리기 도우미 links/fig.js 를 쓴다. index.html(📖 먼저 배우기) · 수업 슬라이드가 함께 부른다.

   한 칸의 모양
     키: { cap:'캡션 한 줄', cards:['lesson.js 의 제목(t)'…], slide:true|'q', draw:function(){ … } }
       cards — lesson.js LESSON 의 제목과 **똑같이**. 그 배우기 카드 안에 그림이 나온다
       slide — 그 슬라이드의 그림 칸에도 이 그림을 쓴다. 'q' 면 정답 이름표(ans)를 ? 로 가린다
     순서 = 화면에 나오는 순서.

   그림 내용은 lesson.js 본문(강의 슬라이드 교재에서 옮긴 것)을 그림으로 옮겼다.
   예시 표 「설비」는 연습문제(data/*.js)의 테이블과 겹치지 않게 새로 짰고,
   SQL 결과는 이 저장소의 sqlengine.js 로 실제로 실행해 맞춰 봤다.
   폼 · 보고서 · 이벤트 그림은 액세스 화면을 본뜬 개념도다(교재 화면을 따라 그리지 않았다).
   ══════════════════════════════════════════════════════════════ */
var FIGS = (function () {
  var F = window.FIG;
  if (!F) return {};
  var C = F.C;
  var t = F.t, box = F.box, line = F.line, arrow = F.arrow;

  /* ═════ 시트 그리기 도우미 (엑셀 1급·2급 figs.js 와 같은 코드) ═════ */
  var MONO = "Consolas,'D2Coding','Malgun Gothic',monospace";
  var FILL = { y: C.yellowL, g: C.greenL, b: C.blueL, r: C.redL, o: C.orangeL, p: C.purpleL, h: C.grayL };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function rect(x, y, w, h, fill, st, sw) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill +
      '" stroke="' + (st || C.grayM) + '" stroke-width="' + (sw || 1) + '"/>';
  }
  /* 고정폭 글자 (수식) */
  function mono(x, y, s, o) { o = o || {}; o.halo = o.halo || false; return '<g font-family="' + MONO + '">' + t(x, y, s, o) + '</g>'; }
  /* 여러 색 글자 한 줄 — parts: [['=A3*'], ['$B$1', C.orange, 1]] (글자, 색, 굵게) */
  function rich(x, y, parts, o) {
    o = o || {};
    var sp = parts.map(function (p) {
      return '<tspan fill="' + (p[1] || C.ink) + '"' + (p[2] ? ' font-weight="700"' : '') + '>' + esc(p[0]) + '</tspan>';
    }).join('');
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 15) + '" text-anchor="' +
      (o.a === 'm' ? 'middle' : (o.a === 'e' ? 'end' : 'start')) + '" dominant-baseline="middle"' +
      (o.mono === false ? '' : ' font-family="' + MONO + '"') + '>' + sp + '</text>';
  }
  /* {'r,c':v} · {'r,c:r2,c2':v} → 칸마다 찾는 함수 */
  function spread(map) {
    var L = [];
    Object.keys(map || {}).forEach(function (k) {
      var m = k.split(':'), a = m[0].split(','), b = (m[1] || m[0]).split(',');
      L.push([+a[0], +a[1], +b[0], +b[1], map[k]]);
    });
    return function (r, c) {
      var v; L.forEach(function (q) { if (r >= q[0] && r <= q[2] && c >= q[1] && c <= q[3]) v = q[4]; }); return v;
    };
  }
  /* 미니 시트
     o.rows 칸 내용(2차원, null·'' = 빈칸) · o.cols 열 머리글(['A','B'…]) 없으면 머리글·행 번호 없이 표만
     o.cw 열 너비(수 또는 배열) · o.rh 행 높이 · o.r0 첫 행 번호 · o.fs 글자 크기
     o.fill {'r,c':'y'} (y 노랑 · g 초록 · b 파랑 · r 빨강 · o 주황 · p 보라 · h 회색)
     o.bold · o.tc(글자색) · o.ans(정답 이름표) — 같은 꼴 · o.head 첫 행을 필드 이름으로 · o.sel [r,c] 선택 칸 */
  function sheet(x, y, o) {
    var rows = o.rows, nc = rows[0].length, cw = o.cw || 56, rh = o.rh || 26, fs = o.fs || 14, r0 = o.r0 == null ? 1 : o.r0;
    var hh = o.cols ? 20 : 0, hw = o.cols ? (o.hw || 24) : 0, i, r, c;
    var W = [], X = [x + hw];
    for (i = 0; i < nc; i++) { W.push(typeof cw === 'number' ? cw : cw[i]); X.push(X[i] + W[i]); }
    var Y0 = y + hh, fill = spread(o.fill), bold = spread(o.bold), tc = spread(o.tc), ans = spread(o.ans), s = '';
    if (o.cols) {
      s += rect(x, y, hw, hh, C.grayL);
      for (i = 0; i < nc; i++) s += rect(X[i], y, W[i], hh, C.grayL) + t(X[i] + W[i] / 2, y + hh / 2 + 0.5, o.cols[i], { a: 'm', size: 13, c: C.sub, halo: false });
      for (r = 0; r < rows.length; r++) s += rect(x, Y0 + r * rh, hw, rh, C.grayL) + t(x + hw / 2, Y0 + r * rh + rh / 2 + 0.5, String(r0 + r), { a: 'm', size: 13, c: C.sub, halo: false });
    }
    for (r = 0; r < rows.length; r++) for (c = 0; c < nc; c++) {
      var hd = o.head && r === 0, f = fill(r, c), v = rows[r][c];
      s += rect(X[c], Y0 + r * rh, W[c], rh, f ? (FILL[f] || f) : (hd ? C.grayL : C.paper));
      if (v != null && v !== '') s += t(X[c] + W[c] / 2, Y0 + r * rh + rh / 2 + 0.5, String(v),
        { a: 'm', size: fs, b: hd || bold(r, c), c: tc(r, c) || C.ink, halo: false, ans: ans(r, c) });
    }
    if (o.sel) s += rect(X[o.sel[1]], Y0 + o.sel[0] * rh, W[o.sel[1]], rh, 'none', C.green, 2.6);
    return {
      s: s, x: function (c) { return X[c]; }, cx: function (c) { return X[c] + W[c] / 2; },
      y: function (r) { return Y0 + r * rh; }, cy: function (r) { return Y0 + r * rh + rh / 2; },
      w: function (c) { return W[c]; }, left: x, top: y, right: X[nc], bottom: Y0 + rows.length * rh, rh: rh
    };
  }
  /* 시트 위 범위 테두리 */
  function frame(sh, r1, c1, r2, c2, col, o) {
    o = o || {};
    var x = sh.x(c1) - 2, y = sh.y(r1) - 2, w = sh.x(c2) + sh.w(c2) - sh.x(c1) + 4, h = sh.y(r2) + sh.rh - sh.y(r1) + 4;
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="none" stroke="' + col +
      '" stroke-width="' + (o.w || 2.4) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
  }
  /* 수식 입력줄 — [칸 이름] fx 수식 */
  function fxbar(x, y, w, s, o) {
    o = o || {};
    var nb = o.cell ? 46 : 0, out = '';
    if (o.cell) out += box(x, y, nb - 4, 28, { fill: C.paper, c: C.line, w: 1.2, r: 4 }) + t(x + (nb - 4) / 2, y + 14.5, o.cell, { a: 'm', size: 13, c: C.sub, halo: false });
    out += box(x + nb, y, w - nb, 28, { fill: C.paper, c: C.line, w: 1.2, r: 4 }) +
      t(x + nb + 15, y + 14.5, 'fx', { a: 'm', size: 13, b: 1, c: C.sub, halo: false }) + line(x + nb + 30, y + 5, x + nb + 30, y + 23, { c: C.grayM, w: 1 });
    out += Array.isArray(s) ? rich(x + nb + 38, y + 15, s, { size: o.size || 14 }) :
      mono(x + nb + 38, y + 15, s, { size: o.size || 14, ans: o.ans, c: o.c });
    return out;
  }
  /* 둥근 알약 이름표 */
  function pill(x, y, w, s, col, o) {
    o = o || {};
    return box(x, y, w, o.h || 28, { fill: o.fill || C.paper, c: col, w: 1.6, r: (o.h || 28) / 2 }) +
      t(x + w / 2, y + (o.h || 28) / 2 + 0.5, s, { a: 'm', size: o.size || 14, b: o.b == null ? 1 : o.b, c: o.tc || col, halo: false, ans: o.ans });
  }
  function divider(x, y1, y2) { return line(x, y1, x, y2, { c: C.grayM, w: 1.4, dash: '6 5' }); }
  function hdiv(y, x1, x2) { return line(x1 || 14, y, x2 || 466, y, { c: C.grayM, w: 1.4, dash: '6 5' }); }
  function check(x, y, c) { return F.path('M' + (x - 6) + ',' + y + ' l4,5 l9,-10', { c: c || C.green, w: 2.6 }); }
  function cross(x, y, c) { return line(x - 6, y - 6, x + 6, y + 6, { c: c || C.red, w: 2.6 }) + line(x + 6, y - 6, x - 6, y + 6, { c: c || C.red, w: 2.6 }); }

  /* 예시 테이블 「설비」 */
  var EQ = [['코드', '설비명', '라인', '가동', '담당'], ['M01', '프레스', 'A', '320', '김도윤'], ['M02', '선반', 'B', '280', '이서준'], ['M03', '밀링', 'A', '410', '박하은'],
            ['M04', '용접기', 'C', '150', ''], ['M05', '연삭기', 'B', '300', '최지안'], ['M06', '드릴', 'A', '260', '정우진']];
  function tbl(x, y, rows, o) { o = o || {}; o.rows = rows; o.head = 1; return sheet(x, y, o); }
  function win(x, y, w, h, title, col) {
    return box(x, y, w, h, { fill: C.grayL, c: C.line, w: 1.4, r: 6 }) +
      box(x, y, w, 24, { fill: col || C.blueL, c: C.line, w: 1.4, r: 6 }) + t(x + 10, y + 12.5, title, { size: 13, b: 1, halo: false });
  }
  function field(x, y, w, label, val, o) {
    o = o || {};
    return t(x, y + 12, label, { size: 13, halo: false }) + box(x + (o.lw || 64), y, w, 24, { fill: o.fill || C.paper, c: o.c || C.line, w: 1.2, r: 2 }) +
      t(x + (o.lw || 64) + 8, y + 12.5, val, { size: 13, halo: false, b: o.b, c: o.tc || C.ink, ans: o.ans });
  }

  return {

  /* ─────────── Ⅰ. 액세스와 개체 ─────────── */
  objects: { cards: ['액세스를 이루는 여섯 개체'], slide: 'q',
    cap: '여섯 개체 — 자료를 실제로 담는 것은 테이블뿐, 나머지는 테이블의 자료를 쓰고 보여 준다',
    draw: function () {
      var s = '';
      s += F.path('M24,92 v76 a58,13 0 0 0 116,0 v-76', { fill: C.yellowL, c: C.orange, w: 1.8 }) +
        '<ellipse cx="82" cy="92" rx="58" ry="13" fill="' + C.yellowL + '" stroke="' + C.orange + '" stroke-width="1.8"/>';
      s += t(82, 132, '테이블', { a: 'm', size: 19, b: 1, halo: false, ans: true }) + t(82, 158, '자료를 담는 곳', { a: 'm', size: 13, halo: false });
      var R = [['쿼리', '골라내고 계산', C.blue, C.blueL], ['폼', '넣고 고치는 화면', C.green, C.greenL], ['보고서', '뽑아 내는 서식', C.purple, C.purpleL]];
      R.forEach(function (r, i) {
        var y = 34 + i * 70;
        s += box(250, y, 150, 50, { fill: r[3], c: r[2], w: 1.6 }) + t(264, y + 17, r[0], { size: 16, b: 1, halo: false, c: r[2] }) + t(264, y + 37, r[1], { size: 13, halo: false });
        s += arrow(144, 128, 246, y + 25, { c: r[2], w: 1.8 });
      });
      s += hdiv(250);
      s += box(24, 262, 200, 36, { fill: C.grayL, c: C.line, w: 1.4, label: '매크로 — 동작을 묶음', size: 14 }) + box(250, 262, 216, 36, { fill: C.grayL, c: C.line, w: 1.4, label: '모듈 — 직접 쓴 VBA 코드', size: 14 });
      return F.svg(480, 312, s);
    } },

  fieldrec: { cards: ['테이블의 짜임 — 필드와 레코드'], slide: 'q',
    cap: '테이블 — 세로 한 줄(열)이 필드, 가로 한 줄(행)이 레코드',
    draw: function () {
      var sh = tbl(14, 34, EQ.slice(0, 5), { cw: [54, 70, 46, 50, 70], fill: { '0,1:4,1': 'b', '2,0:2,4': 'o' } });
      var s = sh.s + frame(sh, 0, 1, 4, 1, C.blue) + frame(sh, 2, 0, 2, 4, C.orange);
      s += t(sh.cx(1), 22, '필드 (열)', { a: 'm', size: 15, b: 1, c: C.blue });
      s += F.callout(sh.right, sh.cy(2), sh.right + 18, sh.cy(2), '레코드 (행)', { c: C.orange, tc: C.orange, b: 1, size: 15, ans: true });
      s += t(14, sh.bottom + 24, '맨 위 줄 = 필드 이름 · 필드마다 데이터 형식과 속성을 먼저 정한다', { size: 13, c: C.sub });
      s += t(14, sh.bottom + 46, '→ 그릇(테이블 디자인)을 먼저 만들고 자료를 넣는다', { size: 13, b: 1 });
      return F.svg(480, sh.bottom + 64, s);
    } },

  /* ─────────── Ⅱ. 테이블 만들기 ─────────── */
  phonenum: { cards: ['데이터 형식과 크기'],
    cap: '계산하지 않는 번호(전화번호 · 학번)는 숫자 형식이 아니라 텍스트 — 숫자면 앞의 0 이 사라진다',
    draw: function () {
      var s = t(14, 24, '입력: 01012345678', { size: 15, b: 1 });
      s += box(14, 46, 140, 40, { fill: C.redL, c: C.red, w: 1.6, label: '숫자 형식', size: 15, lc: C.red });
      s += arrow(160, 66, 196, 66, { c: C.red }) + box(202, 50, 150, 32, { fill: C.paper, c: C.red, w: 1.4, r: 2 }) + mono(344, 66, '1012345678', { a: 'e', size: 15, b: 1 });
      s += t(362, 66, '앞 0 이 사라짐', { size: 13, b: 1, c: C.red });
      s += box(14, 104, 140, 40, { fill: C.greenL, c: C.green, w: 1.6, label: '짧은 텍스트', size: 15, lc: C.green });
      s += arrow(160, 124, 196, 124, { c: C.green }) + box(202, 108, 150, 32, { fill: C.paper, c: C.green, w: 1.4, r: 2 }) + mono(210, 124, '01012345678', { size: 15, b: 1 });
      s += t(362, 124, '그대로', { size: 13, b: 1, c: C.green });
      s += hdiv(166);
      s += t(14, 188, '교재가 크기를 적어 둔 형식', { size: 13, b: 1, c: C.sub });
      [['날짜/시간', '8바이트'], ['통화', '8바이트'], ['일련번호', '4바이트']].forEach(function (v, i) {
        var x = 14 + i * 152;
        s += box(x, 202, 140, 44, { fill: C.grayL, c: C.line, w: 1.2 }) + t(x + 70, 216, v[0], { a: 'm', size: 14, b: 1, halo: false }) + t(x + 70, 235, v[1], { a: 'm', size: 13, c: C.blue, b: 1, halo: false });
      });
      return F.svg(480, 262, s);
    } },

  props: { cards: ['필드 속성 — 자주 나오는 것들'], slide: 'q',
    cap: '필드 속성 — 새 레코드를 넣을 때 무엇이 미리 들어가고, 무엇이 막히나',
    draw: function () {
      var R = [['기본값', '1', '새 레코드에 미리 1', 'ok', C.blue],
               ['유효성 검사 규칙 >0', '-3', '0보다 큰 값만 — 거부', 'no', C.red],
               ['필수', '(빈칸)', '비워 두면 거부', 'no', C.red],
               ['인덱스 예(중복 불가)', 'M03', '이미 있는 값 — 거부', 'no', C.red, true]];
      var s = t(14, 22, '속성', { size: 13, b: 1, c: C.sub }) + t(196, 22, '넣은 값', { size: 13, b: 1, c: C.sub }) + t(284, 22, '결과', { size: 13, b: 1, c: C.sub });
      R.forEach(function (r, i) {
        var y = 52 + i * 48;
        s += box(14, y - 16, 170, 32, { fill: C.grayL, c: C.line, w: 1.2 }) + t(24, y, r[0], { size: 13, b: 1, halo: false, ans: r[5] });
        s += box(196, y - 14, 76, 28, { fill: r[3] === 'ok' ? C.blueL : C.redL, c: r[4], w: 1.4, r: 2 }) + t(234, y, r[1], { a: 'm', size: 14, b: 1, halo: false });
        s += (r[3] === 'ok' ? check(292, y, C.blue) : cross(292, y, C.red)) + t(306, y, r[2], { size: 13, c: r[4], b: 1 });
      });
      s += t(14, 250, '필수 = 비어 있는 것을 막고 · 중복 불가 = 같은 값 두 번을 막는다', { size: 13, c: C.sub });
      return F.svg(480, 268, s);
    } },

  mask: { cards: ['입력 마스크 — 모양을 강제한다'], slide: 'q',
    cap: '입력 마스크 >LL-0000 — 칸마다 받을 수 있는 글자가 정해진다 (대문자 쪽이 필수)',
    draw: function () {
      var M = [['>', '뒤는 대문자로', C.purple], ['L', '영문·한글 필수', C.blue], ['L', '영문·한글 필수', C.blue], ['-', '그대로 표시', C.sub], ['0', '숫자 필수', C.green], ['0', '', C.green], ['0', '', C.green], ['0', '', C.green]];
      var s = '', x0 = 40;
      M.forEach(function (m, i) {
        var x = x0 + i * 50;
        s += box(x, 20, 42, 42, { fill: C.paper, c: m[2], w: 1.8, r: 4 }) + mono(x + 21, 42, m[0], { a: 'm', size: 22, b: 1, c: m[2] });
      });
      s += t(x0 + 21, 80, '대문자로', { a: 'm', size: 13, c: C.purple, b: 1 });
      s += t(x0 + 50 + 46, 100, 'L = 영문·한글 필수', { a: 'm', size: 13, c: C.blue, b: 1 });
      s += t(x0 + 4 * 50 + 96, 80, '0 = 숫자 필수 (9 는 선택)', { a: 'm', size: 13, c: C.green, b: 1, ans: true });
      var T = [['ab1234', 'AB-1234', true, '소문자도 대문자로'], ['AB12', '—', false, '숫자 네 자리를 다 채워야'], ['7B1234', '—', false, '첫 자리는 문자만']];
      s += hdiv(118);
      s += t(14, 138, '입력', { size: 13, b: 1, c: C.sub }) + t(120, 138, '저장', { size: 13, b: 1, c: C.sub });
      T.forEach(function (r, i) {
        var y = 166 + i * 34;
        s += mono(14, y, r[0], { size: 15, b: 1 }) + mono(120, y, r[1], { size: 15, b: 1, c: r[2] ? C.green : C.sub });
        s += (r[2] ? check(226, y, C.green) : cross(226, y, C.red)) + t(242, y, r[3], { size: 13, c: r[2] ? C.green : C.red });
      });
      s += t(14, 274, '< 소문자로 · > 대문자로 · Password → 입력한 글자를 * 로', { size: 13, c: C.sub });
      return F.svg(480, 292, s);
    } },

  lookup: { cards: ['조회 — 목록에서 고르게 하기'], slide: 'q',
    cap: '조회(콤보 상자) — 지점명이 보이지만 저장되는 것은 바운드 열의 지점코드',
    draw: function () {
      var s = t(14, 20, '제품 테이블 — 지점코드 필드', { size: 13, b: 1, c: C.sub });
      s += box(14, 32, 130, 26, { fill: C.paper, c: C.blue, w: 1.8, r: 2 }) + t(22, 45, '부산', { size: 14, b: 1, halo: false }) +
        box(124, 34, 18, 22, { fill: C.grayL, c: C.line, w: 1, r: 2 }) + F.poly([[128, 42], [138, 42], [133, 48]], { close: 1, fill: C.ink, c: C.ink, w: 1 });
      var L = [['S01', '서울'], ['S02', '부산'], ['S03', '대구']];
      s += box(14, 58, 170, 84, { fill: C.paper, c: C.blue, w: 1.6, r: 2 });
      L.forEach(function (r, i) {
        var y = 72 + i * 26;
        if (i === 1) s += rect(16, y - 12, 166, 26, C.blueL, 'none', 0);
        s += t(24, y, r[0], { size: 13, c: C.sub, halo: false }) + t(80, y, r[1], { size: 14, b: 1, halo: false });
      });
      s += line(66, 60, 66, 140, { c: C.grayM, w: 1, dash: '4 3' });
      s += t(14, 160, '↑ 1열(코드)을 숨기면 이름만 보인다', { size: 13, c: C.sub });
      s += arrow(186, 98, 232, 98, { c: C.green });
      s += box(236, 78, 110, 40, { fill: C.greenL, c: C.green, w: 1.6 }) + t(291, 90, '저장되는 값', { a: 'm', size: 13, halo: false, c: C.green, b: 1 }) + mono(291, 108, 'S02', { a: 'm', size: 15, b: 1 });
      s += win(236, 128, 230, 128, '조회 탭', C.orangeL);
      s += t(246, 166, '컨트롤 표시: 콤보 상자', { size: 13, halo: false }) + t(246, 188, '행 원본: 지점 테이블', { size: 13, halo: false }) +
        t(246, 210, '바운드 열: 1 (코드)', { size: 13, halo: false, b: 1, c: C.green }) + t(246, 232, '목록 값만 허용: 예', { size: 13, halo: false, b: 1, c: C.red, ans: true });
      s += t(14, 196, '열 개수 2', { size: 13, c: C.sub }) + t(14, 216, '열 너비 0cm;2cm', { size: 13, c: C.sub });
      return F.svg(480, 270, s);
    } },

  pk: { cards: ['기본키 — 레코드를 가리키는 이름표'], slide: 'q',
    cap: '기본키 — 같은 값이 두 번 들어올 수 없고, 비어 있을 수도 없다',
    draw: function () {
      var sh = tbl(14, 30, EQ.slice(0, 4).map(function (r) { return r.slice(0, 3); }), { cw: [70, 80, 50], fill: { '0,0': 'y', '1,0:3,0': 'y' } });
      var s = sh.s + t(sh.cx(0) - 26, 20, '🔑', { a: 'm', size: 14 }) + t(sh.cx(0) - 12, 20, '기본키', { size: 13, b: 1, c: C.orange });
      var x = 250, A = [['M03', '밀링2', '이미 있는 M03 — 중복', false], ['', '드릴2', '코드가 비었다', false], ['M07', '연삭기2', '새 값 — 들어간다', true]];
      s += t(x, 20, '새 레코드를 넣어 보면', { size: 13, b: 1, c: C.sub });
      A.forEach(function (a, i) {
        var y = 52 + i * 42;
        s += box(x, y - 14, 50, 28, { fill: a[3] ? C.greenL : C.redL, c: a[3] ? C.green : C.red, w: 1.4, r: 2 }) + mono(x + 25, y, a[0] || ' ', { a: 'm', size: 14, b: 1 });
        s += (a[3] ? check(x + 66, y, C.green) : cross(x + 66, y, C.red)) + t(x + 80, y, a[2], { size: 13, b: 1, c: a[3] ? C.green : C.red, ans: i === 1 });
      });
      s += t(14, sh.bottom + 26, '기본키가 있어야 다른 테이블이 참조할 수 있다 — 관계의 출발점', { size: 13, c: C.sub });
      s += t(14, sh.bottom + 48, '이름은 기본키로 곤란하다 — 같은 이름이 생길 수 있다', { size: 13, c: C.sub });
      return F.svg(480, sh.bottom + 66, s);
    } },

  /* ─────────── Ⅲ. 관계와 외부 데이터 ─────────── */
  relation: { cards: ['관계 — 두 테이블을 잇는다'], slide: 'q',
    cap: '관계 — 지점의 기본키를 제품이 외래키로 받는다. 참조 무결성이면 없는 지점코드는 못 들어간다',
    draw: function () {
      var s = win(14, 20, 150, 110, '지점', C.yellowL) + win(300, 20, 166, 132, '제품', C.blueL);
      s += t(24, 60, '🔑 지점코드', { size: 14, b: 1, halo: false }) + t(24, 84, '지점명', { size: 14, halo: false }) + t(24, 108, '전화', { size: 14, halo: false });
      s += t(312, 60, '🔑 제품코드', { size: 14, halo: false }) + t(312, 84, '제품명', { size: 14, halo: false }) + t(312, 108, '지점코드', { size: 14, b: 1, halo: false, c: C.blue }) + t(312, 132, '단가', { size: 14, halo: false });
      s += line(130, 60, 300, 108, { c: C.ink, w: 2.2 });
      s += t(142, 52, '1', { size: 17, b: 1 }) + t(282, 124, '∞', { size: 20, b: 1 });
      s += t(214, 72, '기본키', { size: 13, c: C.orange, b: 1 }) + t(214, 104, '외래키', { size: 13, c: C.blue, b: 1, ans: true });
      s += t(14, 160, '형식과 크기가 같아야 이을 수 있다', { size: 13, c: C.sub });
      s += hdiv(178);
      s += t(14, 200, '참조 무결성 — 제품에 지점코드 S09 를 넣으면', { size: 14, b: 1 });
      s += cross(34, 226, C.red) + t(48, 226, '지점 테이블에 S09 가 없다 → 거부', { size: 14, b: 1, c: C.red });
      s += t(14, 254, '관련 필드 모두 업데이트 — 지점코드가 바뀌면 제품 쪽도 따라 바뀐다', { size: 13, c: C.sub });
      s += t(14, 276, '관련 레코드 모두 삭제 — 지점을 지우면 그 지점 제품도 지워진다', { size: 13, c: C.sub });
      return F.svg(480, 294, s);
    } },

  import: { cards: ['가져오기 — 엑셀 자료를 테이블로'], slide: 'q',
    cap: '가져오기 — 첫 행을 필드 이름으로, 필요 없는 필드는 «필드 포함 안 함» 으로 가져올 때 뺀다',
    draw: function () {
      var a = sheet(14, 30, { cols: ['A', 'B', 'C', 'D'], cw: [50, 60, 44, 54], fs: 13, rh: 24, rows: [['코드', '설비명', '라인', '비고'], ['M01', '프레스', 'A', '점검'], ['M02', '선반', 'B', ''], ['M03', '밀링', 'A', '교체']],
        fill: { '0,0:0,3': 'o', '0,3:3,3': 'r' }, bold: { '0,0:0,3': 1 } });
      var s = t(14, 18, '엑셀 시트', { size: 13, b: 1, c: C.green }) + a.s;
      s += line(a.x(3) + 4, a.y(0) + 4, a.right - 4, a.bottom - 4, { c: C.red, w: 2 }) + line(a.right - 4, a.y(0) + 4, a.x(3) + 4, a.bottom - 4, { c: C.red, w: 2 });
      s += arrow(a.right + 8, 90, 270, 90, { c: C.ink });
      var b = tbl(276, 30, [['코드', '설비명', '라인'], ['M01', '프레스', 'A'], ['M02', '선반', 'B'], ['M03', '밀링', 'A']], { cw: [50, 70, 44], fs: 13, rh: 24 });
      s += t(276, 18, '액세스 테이블', { size: 13, b: 1, c: C.blue }) + b.s;
      s += hdiv(162);
      s += check(24, 186, C.green) + t(40, 186, '첫 행에 열 머리글이 있음 — 1행이 필드 이름이 된다', { size: 13, b: 1 });
      s += cross(24, 212, C.red) + t(40, 212, '«비고» — 필드 포함 안 함 (가져온 뒤 지우는 것이 아니다)', { size: 13, b: 1, c: C.red, ans: true });
      s += t(40, 238, '«기본 키 없음» 이라고 하면 ID 필드를 만들지 않는다', { size: 13, c: C.sub });
      return F.svg(480, 256, s);
    } },

  actionq: { cards: ['실행 쿼리로 자료를 바꾼다'], slide: 'q',
    cap: '실행 쿼리 넷 — 추가 · 업데이트 · 삭제 · 테이블 만들기는 테이블의 자료 자체를 바꾼다',
    draw: function () {
      var s = '';
      function mini(x, y, rows, fill) { return tbl(x, y, rows, { cw: [44, 48], rh: 20, fs: 13, fill: fill }).s; }
      var P = [['추가', 'INSERT INTO', C.green, [['코드', '가동'], ['M01', '320'], ['M02', '280'], ['M07', '200']], { '3,0:3,1': 'g' }],
               ['업데이트', 'UPDATE … SET', C.blue, [['코드', '가동'], ['M01', '320'], ['M02', '350'], ['M03', '410']], { '2,1': 'b' }],
               ['삭제', 'DELETE FROM', C.red, [['코드', '가동'], ['M01', '320'], ['M02', '280'], ['', '']], { '3,0:3,1': 'r' }],
               ['테이블 만들기', 'SELECT … INTO', C.purple, [['코드', '가동'], ['M01', '320'], ['M03', '410']], { '1,0:2,1': 'p' }]];
      P.forEach(function (p, i) {
        var x = 14 + (i % 2) * 234, y = 14 + Math.floor(i / 2) * 132;
        s += box(x, y, 220, 120, { fill: C.paper, c: p[2], w: 1.6 });
        s += t(x + 10, y + 18, p[0], { size: 15, b: 1, c: p[2] }) + mono(x + 10, y + 40, p[1], { size: 12, b: 1, c: C.sub });
        s += mini(x + 118, y + 12, p[3], p[4]);
      });
      s += t(24 + 234, 14 + 132 + 64, '→ 새 테이블', { size: 13, b: 1, c: C.purple });
      s += t(24, 14 + 132 + 64, '→ 행이 사라짐', { size: 13, b: 1, c: C.red });
      s += t(24, 14 + 64, '→ 끝에 덧붙음', { size: 13, b: 1, c: C.green });
      s += t(24 + 234, 14 + 64, '→ 값이 바뀜', { size: 13, b: 1, c: C.blue });
      s += t(14, 290, '선택 쿼리 · 요약 쿼리는 결과만 보여 주고 자료는 그대로', { size: 13, c: C.sub, ans: true });
      return F.svg(480, 308, s);
    } },

  /* ─────────── Ⅳ. 쿼리 ─────────── */
  wherehaving: { cards: ['SELECT 문의 여섯 자리'], slide: 'q',
    cap: 'WHERE 는 묶기 전에 행을 거르고, HAVING 은 GROUP BY 로 묶은 뒤의 결과를 거른다',
    draw: function () {
      var s = mono(14, 20, 'SELECT 라인, COUNT(*) FROM 설비', { size: 13, b: 1 });
      s += mono(14, 40, 'WHERE 가동>=300', { size: 13, b: 1, c: C.blue }) + mono(160, 40, 'GROUP BY 라인', { size: 13, b: 1, c: C.purple }) + mono(290, 40, 'HAVING COUNT(*)>=2', { size: 13, b: 1, c: C.orange, ans: true });
      var a = tbl(14, 58, EQ.map(function (r) { return [r[0], r[2], r[3]]; }), { cw: [44, 38, 44], rh: 22, fs: 13, fill: { '1,0:1,2': 'b', '3,0:3,2': 'b', '5,0:5,2': 'b' }, tc: { '2,0:2,2': C.line, '4,0:4,2': C.line, '6,0:6,2': C.line } });
      s += a.s + t(14, a.bottom + 16, '6행', { size: 13, c: C.sub });
      s += arrow(a.right + 4, 120, a.right + 30, 120, { c: C.blue });
      var b = tbl(176, 70, [['코드', '라인'], ['M01', 'A'], ['M03', 'A'], ['M05', 'B']], { cw: [44, 38], rh: 22, fs: 13, fill: { '1,1:2,1': 'p', '3,1': 'b' } });
      s += b.s + t(176, b.bottom + 16, '3행 남음', { size: 13, c: C.blue, b: 1 });
      s += arrow(b.right + 4, 120, b.right + 30, 120, { c: C.purple });
      var c = tbl(292, 76, [['라인', '개수'], ['A', '2'], ['B', '1']], { cw: [40, 40], rh: 22, fs: 13 });
      s += c.s + t(292, c.bottom + 16, '묶음 2개', { size: 13, c: C.purple, b: 1 });
      s += arrow(c.right + 4, 110, c.right + 22, 110, { c: C.orange });
      var d = tbl(398, 88, [['라인', '개수'], ['A', '2']], { cw: [34, 34], rh: 22, fs: 13, fill: { '1,0:1,1': 'o' } });
      s += d.s + t(398, d.bottom + 16, 'HAVING', { size: 12, b: 1, c: C.orange });
      s += hdiv(a.bottom + 34);
      var y = a.bottom + 56;
      s += t(14, y, '쓰는 차례: SELECT › FROM › WHERE › GROUP BY › HAVING › ORDER BY', { size: 13, b: 1 });
      s += t(14, y + 24, '«개수가 2 이상» 은 묶어야 알 수 있다 → WHERE 가 아니라 HAVING', { size: 13, c: C.sub });
      return F.svg(480, y + 42, s);
    } },

  between: { cards: ['WHERE — 조건을 쓰는 법'], slide: 'q',
    cap: 'BETWEEN a AND b 는 양 끝을 포함한다 · 빈 값은 = NULL 이 아니라 IS NULL',
    draw: function () {
      var sh = tbl(14, 44, EQ, { cw: [48, 66, 40, 48, 64], rh: 24, fs: 13, fill: { '1,3': 'g', '2,3': 'g', '5,3': 'g', '4,4': 'o' }, bold: { '1,3': 1, '2,3': 1, '5,3': 1 } });
      var s = mono(14, 18, 'WHERE 가동 BETWEEN 280 AND 320', { size: 14, b: 1, c: C.green }) + sh.s;
      s += t(sh.cx(4), sh.cy(4), 'NULL', { a: 'm', size: 12, c: C.orange, b: 1 });
      var x = sh.right + 12;
      s += t(x, 70, '→ M01 · M02 · M05', { size: 14, b: 1, c: C.green });
      s += t(x, 94, '280 과 320 도', { size: 13, c: C.green }) + t(x, 112, '들어간다 (양 끝 포함)', { size: 13, c: C.green });
      s += hdiv(128, x - 4, 466);
      s += mono(x, 148, '담당 IS NULL', { size: 14, b: 1, c: C.orange, ans: true }) + t(x, 168, '→ M04', { size: 14, b: 1, c: C.orange });
      s += mono(x, 192, '담당 = NULL', { size: 14, b: 1, c: C.sub }) + t(x, 210, '→ 하나도 안 나온다', { size: 13, c: C.red });
      s += t(14, sh.bottom + 24, "문자는 작은따옴표 — WHERE 라인='A' · IN('A','C') — 목록 중 하나", { size: 13, c: C.sub });
      return F.svg(480, sh.bottom + 42, s);
    } },

  like: { cards: ['WHERE — 조건을 쓰는 법', 'RecordSource 와 부분 일치'],
    cap: "LIKE — 액세스에서 * 는 여러 글자, ? 는 한 글자. '연*' 은 «연으로 시작», '*기*' 는 «기가 들어간»",
    draw: function () {
      var names = ['프레스', '선반', '밀링', '용접기', '연삭기', '드릴'], s = '';
      var P = [["LIKE '연*'", '연 으로 시작', [4], C.blue], ["LIKE '*기*'", '기 가 어디든', [3, 4], C.green], ["LIKE '?반'", '한 글자 + 반', [1], C.purple]];
      P.forEach(function (p, k) {
        var y = 30 + k * 76;
        s += mono(14, y, p[0], { size: 15, b: 1, c: p[3] }) + t(150, y, p[1], { size: 13, c: C.sub });
        names.forEach(function (nm, i) {
          var on = p[2].indexOf(i) >= 0, x = 14 + i * 76;
          s += box(x, y + 14, 68, 30, { fill: on ? (k === 0 ? C.blueL : k === 1 ? C.greenL : C.purpleL) : C.paper, c: on ? p[3] : C.grayM, w: on ? 1.8 : 1, r: 4, label: nm, size: 14, b: on ? 1 : 0, lc: on ? C.ink : C.sub });
        });
      });
      s += t(14, 256, "앞뒤에 * → «포함» · 뒤에만 * → «그것으로 시작» · 검색 칸이 비면 '**' → 전부", { size: 13, c: C.sub });
      return F.svg(480, 274, s);
    } },

  groupby: { cards: ['집계와 그룹 — 묶어서 세기'], slide: true,
    cap: 'GROUP BY 라인 — 같은 라인끼리 묶어, 묶음마다 한 줄씩 COUNT · AVG 를 낸다',
    draw: function () {
      var rows = [EQ[0].slice(0, 4), EQ[1].slice(0, 4), EQ[3].slice(0, 4), EQ[6].slice(0, 4), EQ[2].slice(0, 4), EQ[5].slice(0, 4), EQ[4].slice(0, 4)];
      var sh = tbl(14, 44, rows, { cw: [46, 64, 40, 46], rh: 24, fs: 13, fill: { '1,0:3,3': 'b', '4,0:5,3': 'p', '6,0:6,3': 'o' } });
      var s = mono(14, 18, 'SELECT 라인, COUNT(*) AS 대수, AVG(가동) FROM 설비 GROUP BY 라인', { size: 12, b: 1 }) + sh.s;
      var r = tbl(300, 80, [['라인', '대수', '평균'], ['A', '3', '330'], ['B', '2', '290'], ['C', '1', '150']], { cw: [50, 50, 60], rh: 28, fill: { '1,0:1,2': 'b', '2,0:2,2': 'p', '3,0:3,2': 'o' }, bold: { '1,1:3,2': 1 } });
      s += r.s;
      s += F.route([[sh.right + 4, sh.cy(2)], [276, sh.cy(2)], [276, r.cy(1)], [296, r.cy(1)]], { c: C.blue, w: 1.6, head: 8 });
      s += F.route([[sh.right + 4, sh.cy(4) + 12], [284, sh.cy(4) + 12], [284, r.cy(2)], [296, r.cy(2)]], { c: C.purple, w: 1.6, head: 8 });
      s += F.route([[sh.right + 4, sh.cy(6)], [290, sh.cy(6)], [290, r.cy(3)], [296, r.cy(3)]], { c: C.orange, w: 1.6, head: 8 });
      s += t(300, 64, '묶음마다 한 줄', { size: 13, b: 1, c: C.sub });
      s += t(14, sh.bottom + 22, 'SELECT 에는 묶은 필드와 집계 결과만 쓸 수 있다', { size: 13, c: C.sub });
      return F.svg(480, sh.bottom + 40, s);
    } },

  countnull: { cards: ['집계와 그룹 — 묶어서 세기'], slide: 'q',
    cap: 'COUNT(*) 는 행의 수, COUNT(필드) 는 그 필드가 비어 있지 않은 행의 수',
    draw: function () {
      var sh = tbl(14, 20, EQ.map(function (r) { return [r[0], r[4]]; }), { cw: [50, 76], rh: 26, fill: { '4,1': 'r' } });
      var s = sh.s + t(sh.cx(1), sh.cy(4), '(비어 있음)', { a: 'm', size: 12, c: C.red, b: 1 });
      var x = 190;
      s += box(x, 40, 276, 60, { fill: C.blueL, c: C.blue, w: 1.6 }) + mono(x + 12, 60, 'COUNT(*)', { size: 15, b: 1, c: C.blue }) + t(x + 12, 84, '행을 센다 → 6', { size: 15, b: 1, halo: false });
      s += box(x, 116, 276, 60, { fill: C.greenL, c: C.green, w: 1.6 }) + mono(x + 12, 136, 'COUNT(담당)', { size: 15, b: 1, c: C.green }) + t(x + 12, 160, '담당이 있는 행만 → 5', { size: 15, b: 1, halo: false });
      s += t(x, 200, '비어 있는 M04 가 빠진다', { size: 14, b: 1, c: C.red, ans: true });
      s += t(x, 226, 'AS 로 이름 붙이기 — COUNT(*) AS 대수', { size: 13, c: C.sub });
      return F.svg(480, 250, s);
    } },

  crosstab: { cards: ['특별한 쿼리 넷'], slide: 'q',
    cap: '크로스탭 쿼리 — 한 필드는 행, 한 필드는 열로 놓고 교차하는 칸에 합계를 낸다 (엑셀 피벗처럼)',
    draw: function () {
      var a = tbl(14, 40, [['제품', '지점', '수량'], ['볼트', '서울', '50'], ['볼트', '부산', '30'], ['기어', '서울', '80'], ['기어', '부산', '20'], ['볼트', '서울', '10']], { cw: [50, 50, 46], rh: 24, fs: 13 });
      var s = t(14, 24, '판매 (긴 표)', { size: 13, b: 1, c: C.sub }) + a.s;
      s += arrow(a.right + 8, 110, a.right + 44, 110, { c: C.ink });
      var b = sheet(220, 56, { cw: [70, 60, 60], rh: 30, rows: [['', '서울', '부산'], ['볼트', '60', '30'], ['기어', '80', '20']], fill: { '0,1:0,2': 'p', '1,0:2,0': 'b', '1,1:2,2': 'g', '0,0': 'h' }, bold: { '0,1:0,2': 1, '1,0:2,0': 1, '1,1:2,2': 1 } });
      s += t(220, 40, '크로스탭', { size: 14, b: 1, c: C.purple, ans: true }) + b.s;
      s += t(b.right, 40, '열 머리글 ↓', { a: 'e', size: 13, c: C.purple, b: 1 });
      s += t(220, b.bottom + 18, '↑ 행 머리글', { size: 13, c: C.blue, b: 1 }) + t(330, b.bottom + 18, '값: 수량의 합계', { size: 13, c: C.green, b: 1 });
      s += t(14, 222, '볼트·서울 = 50 + 10 = 60', { size: 13, c: C.sub });
      return F.svg(480, 240, s);
    } },

  unmatched: { cards: ['특별한 쿼리 넷'], slide: 'q',
    cap: '불일치 검색 쿼리 — 두 테이블을 견주어 한쪽에만 있는 레코드(판매가 없는 제품)를 찾는다',
    draw: function () {
      var a = tbl(14, 40, [['제품코드', '제품명'], ['P01', '볼트'], ['P02', '너트'], ['P03', '기어'], ['P04', '핀']], { cw: [64, 56], fill: { '2,0:2,1': 'o', '4,0:4,1': 'o' } });
      var b = tbl(200, 40, [['판매번호', '제품코드'], ['1', 'P01'], ['2', 'P03'], ['3', 'P01']], { cw: [60, 64] });
      var s = t(14, 24, '제품', { size: 14, b: 1 }) + a.s + t(200, 24, '판매', { size: 14, b: 1 }) + b.s;
      s += t(340, 70, '판매에 없는', { size: 13, c: C.sub }) + t(340, 90, '제품만 →', { size: 13, c: C.sub });
      s += tbl(340, 104, [['제품코드', '제품명'], ['P02', '너트'], ['P04', '핀']], { cw: [64, 56], fill: { '1,0:2,1': 'o' } }).s;
      s += t(14, 200, '불일치 검색', { size: 15, b: 1, c: C.orange, ans: true }) + t(120, 200, '— 한쪽에만 없는 것', { size: 14, c: C.sub });
      s += t(14, 226, '중복 데이터 검색 — 같은 값이 두 번 이상 (판매의 P01 처럼)', { size: 13, c: C.sub });
      return F.svg(480, 244, s);
    } },

  datediff: { cards: ['날짜와 문자를 다루는 함수'], slide: 'q',
    cap: 'DATEDIFF 는 두 날짜의 차이, DATEADD 는 더한 날짜, DATEPART 는 일부만 꺼낸다',
    draw: function () {
      var s = '', y = 70;
      s += arrow(20, y, 466, y, { c: C.ink, w: 1.6 });
      s += F.circle(60, y, 6, { fill: C.blue, c: C.blue }) + t(60, y - 22, '2015-03-02', { a: 'm', size: 13, b: 1 }) + t(60, y + 22, '창립일', { a: 'm', size: 13, c: C.sub });
      s += F.circle(300, y, 6, { fill: C.ink, c: C.ink }) + t(300, y - 22, '2026-09-30', { a: 'm', size: 13, b: 1 }) + t(300, y + 22, '기준일', { a: 'm', size: 13, c: C.sub });
      s += F.circle(420, y, 6, { fill: C.green, c: C.green }) + t(420, y - 22, '2026-12-30', { a: 'm', size: 13, b: 1, c: C.green }) + t(420, y + 22, '3개월 뒤', { a: 'm', size: 13, c: C.green });
      s += arrow(66, y + 46, 294, y + 46, { c: C.blue, both: true, w: 1.6 }) + t(180, y + 62, '차이 — 11년', { a: 'm', size: 13, b: 1, c: C.blue });
      s += F.path('M306,' + (y + 36) + ' Q360,' + (y + 64) + ' 414,' + (y + 36), { c: C.green, w: 1.6 }) + arrow(411, y + 39, 414, y + 34, { c: C.green, head: 8 }) + t(360, y + 64, '+3개월', { a: 'm', size: 13, b: 1, c: C.green });
      s += hdiv(160);
      var R = [['DATEDIFF("yyyy", 창립일, 기준일)', '→ 11', C.blue], ['DATEADD("m", 3, 기준일)', '→ 2026-12-30', C.green], ['DATEPART("m", 기준일)', '→ 9', C.purple]];
      R.forEach(function (r, i) { var yy = 184 + i * 28; s += mono(14, yy, r[0], { size: 13, b: 1, c: r[2], ans: i < 2 }) + t(320, yy, r[1], { size: 14, b: 1, ans: i === 0 }); });
      s += t(14, 272, '문자: LEFT · MID · RIGHT · TRIM · LEN · UCASE · LCASE · REPLACE', { size: 13, c: C.sub });
      return F.svg(480, 290, s);
    } },

  dsum: { cards: ['도메인 계산 함수 — 다른 곳의 값을 끌어온다'], slide: 'q',
    cap: '교재 보기 DSUM("납부금","현황","성별=\'남\'") — 인수 · 도메인(테이블·쿼리) · 조건',
    draw: function () {
      var s = rich(14, 22, [['DSUM('], ['"납부금"', C.green, 1], [', '], ['"현황"', C.blue, 1], [', '], ['"성별=\'남\'"', C.red, 1], [')']], { size: 16 });
      var sh = tbl(14, 44, [['이름', '성별', '납부금'], ['김도윤', '남', '30000'], ['이서연', '여', '25000'], ['박준호', '남', '40000'], ['최하늘', '여', '30000']], { cw: [70, 50, 76], fill: { '1,1': 'r', '3,1': 'r', '1,2': 'g', '3,2': 'g' }, bold: { '1,2': 1, '3,2': 1 } });
      s += sh.s + frame(sh, 0, 0, 4, 2, C.blue) + t(sh.left, sh.bottom + 16, '↑ 도메인 «현황» 테이블', { size: 13, b: 1, c: C.blue, ans: true });
      var x = 250;
      s += F.num(x, 70, '1', { c: C.green }) + t(x + 18, 70, '인수 — 계산할 필드', { size: 13, b: 1, c: C.green });
      s += F.num(x, 100, '2', { c: C.blue }) + t(x + 18, 100, '도메인 — 테이블 · 쿼리', { size: 13, b: 1, c: C.blue });
      s += F.num(x, 130, '3', { c: C.red }) + t(x + 18, 130, '조건 — 문자는 작은따옴표', { size: 13, b: 1, c: C.red });
      s += box(x, 150, 206, 38, { fill: C.greenL, c: C.green, w: 1.6 }) + t(x + 103, 169, '30000 + 40000 = 70000', { a: 'm', size: 14, b: 1, halo: false });
      s += t(14, sh.bottom + 42, 'DAVG · DCOUNT · DMIN · DMAX · DLOOKUP 도 같은 꼴', { size: 13, c: C.sub });
      return F.svg(480, sh.bottom + 60, s);
    } },

  /* ─────────── Ⅴ. 폼 ─────────── */
  formtypes: { cards: ['폼의 원본과 모양'], slide: 'q',
    cap: '단일 폼은 한 번에 레코드 하나, 연속 폼은 레코드를 여러 줄 늘어놓는다',
    draw: function () {
      var s = win(14, 24, 206, 170, '단일 폼', C.blueL);
      s += field(24, 62, 110, '코드', 'M03') + field(24, 94, 110, '설비명', '밀링') + field(24, 126, 110, '가동', '410');
      s += t(24, 176, '◀ 3 / 6 ▶', { size: 13, c: C.sub, halo: false });
      s += win(240, 24, 226, 170, '연속 폼', C.greenL);
      s += t(252, 64, '코드', { size: 12, b: 1, c: C.sub, halo: false }) + t(312, 64, '설비명', { size: 12, b: 1, c: C.sub, halo: false }) + t(392, 64, '가동', { size: 12, b: 1, c: C.sub, halo: false });
      EQ.slice(1, 5).forEach(function (r, i) {
        var y = 76 + i * 28;
        s += box(250, y, 54, 22, { fill: C.paper, c: C.line, w: 1, r: 2 }) + t(256, y + 11.5, r[0], { size: 13, halo: false }) +
          box(310, y, 74, 22, { fill: C.paper, c: C.line, w: 1, r: 2 }) + t(316, y + 11.5, r[1], { size: 13, halo: false }) +
          box(390, y, 60, 22, { fill: C.paper, c: C.line, w: 1, r: 2 }) + t(396, y + 11.5, r[3], { size: 13, halo: false });
      });
      s += t(14, 216, '한 번에 하나', { size: 14, b: 1, c: C.blue }) + t(240, 216, '여러 줄 — 하위 폼도 대개 이 모양', { size: 14, b: 1, c: C.green, ans: true });
      s += t(14, 244, '팝업 = 늘 위에 · 모달 = 닫기 전에는 다른 작업을 못 한다', { size: 13, c: C.sub });
      return F.svg(480, 262, s);
    } },

  ctlsrc: { cards: ['컨트롤과 컨트롤 원본'], slide: 'q',
    cap: '컨트롤 원본 — 필드 이름을 쓰면 그 값이, = 로 시작하는 식을 쓰면 계산 결과가 보인다',
    draw: function () {
      var s = win(14, 20, 220, 200, '입고 현황 (폼)', C.blueL);
      s += field(24, 56, 120, '품목', '볼트') + field(24, 88, 120, '단가', '120') + field(24, 120, 120, '수량', '50');
      s += field(24, 152, 120, '금액', '6,000', { fill: C.greenL, c: C.green, b: 1 });
      s += line(20, 186, 228, 186, { c: C.line, w: 1 }) + field(24, 192, 120, '건수', '4', { fill: C.orangeL, c: C.orange, b: 1 });
      var x = 250;
      s += t(x, 30, '컨트롤 원본', { size: 13, b: 1, c: C.sub });
      s += mono(x, 68, '품목', { size: 14, b: 1 }) + t(x + 64, 68, '← 필드 이름 그대로', { size: 13, c: C.sub });
      s += line(212, 68, x - 4, 68, { c: C.grayM, w: 1 });
      s += mono(x, 164, '=[단가]*[수량]', { size: 14, b: 1, c: C.green }) + line(212, 164, x - 4, 164, { c: C.green, w: 1 });
      s += mono(x, 204, '=COUNT(*)', { size: 14, b: 1, c: C.orange }) + line(212, 204, x - 4, 204, { c: C.orange, w: 1 });
      s += t(x, 100, '식은 = 로 시작한다', { size: 14, b: 1, c: C.green, ans: true });
      s += t(x, 124, '(형식 · 소수 자릿수 속성으로', { size: 13, c: C.sub }) + t(x, 142, ' 천 단위 콤마)', { size: 13, c: C.sub });
      s += t(14, 244, '표시: 아니요 — 값은 살아 있고 화면에만 안 보인다 (지우는 것과 다르다)', { size: 13, c: C.sub });
      return F.svg(480, 262, s);
    } },

  taborder: { cards: ['탭 순서 · 조건부 서식 · 맞춤'], slide: 'q',
    cap: '탭 순서 — 컨트롤을 옮겨도 Tab 차례는 따라오지 않는다. [탭 순서] 에서 따로 고친다',
    draw: function () {
      var s = win(14, 20, 250, 170, '설비 등록 (폼)', C.blueL);
      var P = [[24, 56, '코드', '1'], [24, 92, '설비명', '2'], [24, 128, '가동', '4'], [24, 158, '라인', '3']];
      P.forEach(function (p) {
        s += field(p[0], p[1], 110, p[2], '', { c: p[3] === '3' ? C.red : C.line }) + F.num(p[0] + 194, p[1] + 12, p[3], { c: p[3] === '3' ? C.red : C.blue, r: 10, size: 12 });
      });
      s += F.route([[228, 104], [246, 104], [246, 170], [228, 170]], { c: C.red, w: 1.6, head: 8 });
      s += t(14, 208, '«라인» 을 옮겼지만 차례는 3번 그대로 → 엉뚱하게 건너뛴다', { size: 13, c: C.red, b: 1 });
      var x = 284;
      s += win(x, 20, 182, 170, '탭 순서', C.orangeL);
      ['코드', '설비명', '가동', '라인'].forEach(function (v, i) { s += box(x + 12, 54 + i * 30, 158, 24, { fill: C.paper, c: C.line, w: 1, r: 2 }) + t(x + 22, 66 + i * 30, (i + 1) + '. ' + v, { size: 13, halo: false }); });
      s += t(x + 10, 178, '끌어서 차례를 다시', { size: 13, c: C.orange, b: 1, halo: false, ans: true });
      s += t(14, 234, '조건부 서식 · 맞춤 · 특수 효과도 컨트롤마다 속성으로 정한다', { size: 13, c: C.sub });
      return F.svg(480, 252, s);
    } },

  subform: { cards: ['하위 폼 — 폼 안의 폼'], slide: 'q',
    cap: '하위 폼 — 기본 폼과 하위 폼을 연결 필드(코드)로 이어, 지금 레코드에 딸린 자료만 보인다',
    draw: function () {
      var s = win(14, 20, 452, 214, '설비 (기본 폼)', C.blueL);
      s += field(28, 54, 90, '코드', 'M03', { fill: C.yellowL, c: C.orange, b: 1 }) + field(210, 54, 110, '설비명', '밀링', { lw: 52 });
      s += box(28, 92, 424, 128, { fill: C.paper, c: C.green, w: 1.8, r: 4 }) + t(38, 106, '점검 기록 (하위 폼)', { size: 13, b: 1, c: C.green, halo: false });
      var sh = tbl(40, 118, [['코드', '점검일', '결과'], ['M03', '09-02', '정상'], ['M03', '09-16', '교체'], ['M03', '09-30', '정상']], { cw: [60, 80, 60], rh: 22, fs: 13, fill: { '1,0:3,0': 'y' } });
      s += sh.s;
      s += F.route([[70, 80], [70, 90], [18, 90], [18, 140], [36, 140]], { c: C.orange, w: 1.6, head: 7 });
      s += t(270, 150, '연결 필드', { size: 14, b: 1, c: C.orange, ans: true }) + t(270, 172, '기본: 코드 = 하위: 코드', { size: 13, c: C.sub }) + t(270, 194, '→ M03 의 기록만', { size: 13, c: C.sub });
      s += t(14, 256, '기본 폼에서 다음 레코드(M04)로 가면 하위 폼도 M04 의 기록으로 바뀐다', { size: 13, c: C.sub });
      return F.svg(480, 274, s);
    } },

  /* ─────────── Ⅵ. 보고서 ─────────── */
  report: { cards: ['보고서의 일곱 구역'], slide: 'q',
    cap: '보고서 구역 — 보고서 머리글·바닥글은 한 번, 페이지는 쪽마다, 그룹은 그룹마다, 본문은 레코드마다',
    draw: function () {
      var B = [['보고서 머리글', C.purple, C.purpleL], ['페이지 머리글', C.blue, C.blueL], ['그룹 머리글', C.green, C.greenL], ['본문', C.orange, C.orangeL],
               ['그룹 바닥글', C.green, C.greenL], ['페이지 바닥글', C.blue, C.blueL], ['보고서 바닥글', C.purple, C.purpleL]];
      var s = '';
      function band(x, y, w, k, txt) { return box(x, y, w, 18, { fill: B[k][2], c: B[k][1], w: 1, r: 2 }) + t(x + 6, y + 9.5, txt, { size: 12, halo: false }); }
      function page(x, first) {
        var o = box(x, 14, 150, 268, { fill: C.paper, c: C.line, w: 1.4, r: 3 }), y = 22;
        if (first) { o += band(x + 8, y, 134, 0, '설비 가동 보고서'); y += 22; }
        o += band(x + 8, y, 134, 1, '코드 · 설비명 · 가동'); y += 24;
        o += band(x + 8, y, 134, 2, first ? '라인 A' : '라인 B'); y += 22;
        for (var i = 0; i < 3; i++) { o += band(x + 8, y, 134, 3, first ? ['M01 프레스 320', 'M03 밀링 410', 'M06 드릴 260'][i] : ['M02 선반 280', 'M05 연삭기 300', ''][i]); y += 20; }
        if (!first) y -= 20;
        o += band(x + 8, y, 134, 4, first ? '라인 A 소계 990' : '라인 B 소계 580'); y += 26;
        if (!first) { o += band(x + 8, y, 134, 6, '총계 1570'); }
        o += band(x + 8, 256, 134, 5, first ? '1 / 2 쪽' : '2 / 2 쪽');
        return o;
      }
      s += page(14, true) + page(176, false);
      var x = 340;
      B.forEach(function (b, i) {
        var y = 26 + i * 36;
        s += box(x, y - 9, 14, 14, { fill: b[2], c: b[1], w: 1, r: 2 }) + t(x + 20, y - 2, b[0], { size: 13, b: 1, c: b[1] });
        s += t(x + 20, y + 14, ['맨 앞 한 번', '쪽마다 위', '그룹이 바뀔 때', '레코드마다', '그룹이 끝날 때', '쪽마다 아래', '맨 끝 한 번'][i], { size: 12, c: C.sub, ans: i === 3 });
      });
      return F.svg(480, 296, s);
    } },

  repeatgrp: { cards: ['그룹 · 정렬 · 반복'], slide: 'q',
    cap: '반복 실행 «예» — 그룹이 다음 쪽으로 넘어가도 그 쪽 맨 위에 그룹 머리글을 다시 찍는다',
    draw: function () {
      var s = '';
      function pg(x, rows, head, rep) {
        var o = box(x, 30, 180, 190, { fill: C.paper, c: C.line, w: 1.4, r: 3 }), y = 42;
        if (head) { o += box(x + 8, y, 164, 20, { fill: C.greenL, c: rep ? C.orange : C.green, w: rep ? 2 : 1, r: 2 }) + t(x + 14, y + 10.5, head, { size: 13, b: 1, halo: false }); y += 26; }
        rows.forEach(function (r) { o += box(x + 8, y, 164, 20, { fill: C.orangeL, c: C.orangeL, w: 1, r: 2 }) + t(x + 14, y + 10.5, r, { size: 13, halo: false }); y += 24; });
        return o;
      }
      s += t(14, 18, '1쪽', { size: 13, b: 1, c: C.sub }) + pg(14, ['M02 선반', 'M05 연삭기', 'M08 보링', 'M09 호닝', 'M11 래핑', 'M12 셰이퍼'], '라인 B');
      s += t(214, 18, '2쪽', { size: 13, b: 1, c: C.sub }) + pg(214, ['M13 슬로터', 'M14 기어 호빙'], '라인 B (계속)', true);
      s += F.callout(394, 52, 404, 100, '반복\n실행:\n예', { c: C.orange, tc: C.orange, b: 1, size: 13, ans: true });
      s += t(14, 242, '그룹 필드로 먼저 정렬 → 그 안에서 다시 정렬 (예: 라인 오름 → 가동 오름)', { size: 13, c: C.sub });
      s += t(14, 264, '그룹 바닥글을 표시해야 =COUNT(*) · 소계를 넣을 자리가 생긴다', { size: 13, c: C.sub });
      return F.svg(480, 282, s);
    } },

  hidedup: { cards: ['중복 숨기기와 페이지 번호'], slide: 'q',
    cap: '중복 내용 숨기기 «예» — 앞 레코드와 값이 같으면 찍지 않는다 (값은 그대로, 인쇄만 생략)',
    draw: function () {
      var R = [['택배', '볼트', '3kg'], ['택배', '너트', '1kg'], ['택배', '기어', '5kg'], ['화물', '축', '20kg'], ['화물', '베어링', '8kg']];
      var a = tbl(14, 40, [['운송방법', '제품', '중량']].concat(R), { cw: [64, 60, 50], rh: 24, fs: 13, tc: { '2,0:3,0': C.red, '5,0': C.red } });
      var b = tbl(270, 40, [['운송방법', '제품', '중량']].concat(R.map(function (r, i) { return [(i === 0 || i === 3) ? r[0] : '', r[1], r[2]]; })), { cw: [64, 60, 50], rh: 24, fs: 13, fill: { '2,0:3,0': 'h', '5,0': 'h' } });
      var s = t(14, 24, '숨기기 전', { size: 14, b: 1 }) + a.s + arrow(a.right + 12, 110, 262, 110, { c: C.ink });
      s += t(270, 24, '중복 내용 숨기기: 예', { size: 14, b: 1, c: C.green, ans: true }) + b.s;
      s += t(14, 232, '빈 자리를 ▶ 같은 기호로 채우려면 «채울 문자»', { size: 13, c: C.sub });
      s += mono(14, 256, '="총 " & [Pages] & "쪽 중 " & [Page] & "쪽"', { size: 13, b: 1 }) + t(360, 256, '페이지 번호', { size: 13, c: C.sub });
      return F.svg(480, 274, s);
    } },

  /* ─────────── Ⅶ. 이벤트 프로시저 ─────────── */
  events: { cards: ['이벤트 — 언제 실행되는가'], slide: 'q',
    cap: '이벤트 차례 — 칸을 옮기면 앞 칸 Exit → LostFocus, 새 칸 Enter → GotFocus, 단추는 Click',
    draw: function () {
      var s = win(14, 20, 190, 150, '폼', C.blueL);
      s += field(24, 56, 100, '코드', 'M03', { lw: 50, c: C.blue }) + field(24, 94, 100, '설비명', '', { lw: 50, c: C.green });
      s += box(74, 132, 80, 28, { fill: C.paper, c: C.ink, w: 1.4, r: 4, label: '조회', size: 13 });
      s += F.route([[178, 68], [192, 68], [192, 106], [178, 106]], { c: C.ink, w: 1.6, head: 8 }) + t(150, 88, 'Tab', { size: 12, b: 1, c: C.sub });
      var E = [['코드', 'Exit', C.blue], ['코드', 'LostFocus', C.blue], ['설비명', 'Enter', C.green], ['설비명', 'GotFocus', C.green]];
      E.forEach(function (e, i) {
        var y = 40 + i * 32;
        s += F.num(230, y, String(i + 1), { c: e[2], r: 10, size: 12 }) + t(248, y, e[0], { size: 13, c: C.sub }) + mono(310, y, e[1], { size: 14, b: 1, c: e[2] });
      });
      s += F.num(230, 176, '★', { c: C.orange, r: 10, size: 11 }) + t(248, 176, '단추를 누르면', { size: 13, c: C.sub }) + mono(350, 176, 'Click', { size: 14, b: 1, c: C.orange, ans: true });
      s += t(14, 214, 'Enter 이벤트는 Enter 키가 아니라 «포커스가 들어올 때»', { size: 13, b: 1, c: C.red });
      s += t(14, 238, 'Activate · Deactivate — 폼·보고서 창이 활성화될 때 · 다른 창으로 바뀔 때', { size: 13, c: C.sub });
      return F.svg(480, 256, s);
    } },

  find3: { cards: ['찾는 세 가지 방법'], slide: 'q',
    cap: 'Filter 는 맞는 것만 남기고, RecordSource 는 원본을 바꿔 끼우고, RecordsetClone + Bookmark 는 그 레코드로 옮겨 간다',
    draw: function () {
      var s = '', names = ['M01 프레스', 'M02 선반', 'M03 밀링', 'M04 용접기', 'M05 연삭기'];
      function panel(x, title, col, rows, cur, code1, code2, ansC) {
        var o = t(x, 20, title, { size: 14, b: 1, c: col });
        o += box(x, 32, 144, 150, { fill: C.grayL, c: C.line, w: 1.4, r: 4 });
        rows.forEach(function (r, i) {
          var y = 42 + i * 26, on = cur === i;
          o += box(x + 8, y, 128, 22, { fill: on ? C.yellowL : C.paper, c: on ? C.orange : C.line, w: on ? 1.8 : 1, r: 2 }) + t(x + 16, y + 11.5, (on ? '▶ ' : '') + r, { size: 13, halo: false, b: on });
        });
        o += mono(x, 200, code1, { size: 12, b: 1, c: col, ans: ansC }) + mono(x, 218, code2, { size: 12, c: C.sub });
        return o;
      }
      s += panel(14, 'Filter', C.blue, ['M03 밀링'], 0, 'Me.FilterOn = True', 'Me.Filter = "…"', true);
      s += panel(168, 'RecordSource', C.green, ['M03 밀링'], 0, 'Me.RecordSource', '= "SELECT …"');
      s += panel(322, 'RecordsetClone', C.purple, names, 2, 'FindFirst', '→ Bookmark 옮김');
      s += t(24, 100, '남긴 것만', { size: 13, c: C.sub }) + t(178, 100, '원본 자체가 바뀜', { size: 13, c: C.sub });
      s += t(14, 248, '셋 다 M03 을 보여 준다 — 다른 레코드가 남아 있는지가 다르다', { size: 13, c: C.sub });
      return F.svg(480, 266, s);
    } },

  quote: { cards: ['RecordSource 와 부분 일치'], slide: 'q',
    cap: '조건 문자열 잇기 — 문자는 작은따옴표, 숫자는 따옴표 없이, 날짜는 # 로 감싼다',
    draw: function () {
      var s = t(14, 22, '입력 칸 txt조회 = M03 일 때', { size: 14, b: 1 });
      s += rich(14, 56, [['"… WHERE 코드=\'"'], [' & ', C.sub], ['txt조회', C.blue, 1], [' & ', C.sub], ['"\'"']], { size: 15 });
      s += arrow(60, 72, 60, 96, { c: C.ink, head: 8 });
      s += box(14, 100, 452, 34, { fill: C.greenL, c: C.green, w: 1.6, r: 6 }) + rich(26, 117.5, [['… WHERE 코드='], ["'M03'", C.green, 1]], { size: 15 });
      s += t(14, 154, '완성된 문장을 먼저 쓰고 → 값 자리만 잘라 & 로 잇는다', { size: 13, c: C.sub });
      s += hdiv(172);
      var R = [['문자', "코드='M03'", "\"코드='\" & txt & \"'\""], ['숫자', '가동=300', '"가동=" & txt'], ['날짜', '점검일=#2026-09-30#', '"점검일=#" & txt & "#"'], ['포함', "설비명 LIKE '*기*'", "\"설비명 LIKE '*\" & txt & \"*'\""]];
      R.forEach(function (r, i) {
        var y = 194 + i * 46;
        s += t(14, y, r[0], { size: 13, b: 1, c: C.blue }) + mono(62, y, r[1], { size: 14, b: 1, ans: i === 3 }) + mono(62, y + 20, r[2], { size: 13, c: C.sub, ans: i === 3 });
      });
      return F.svg(480, 382, s);
    } },

  ado: { cards: ['DoCmd 와 ADO'], slide: 'q',
    cap: 'ADO — 레코드셋을 열고(Open), rs!필드로 값을 읽고, 다 쓰면 닫는다(Close)',
    draw: function () {
      var s = mono(14, 22, 'Set rs = New ADODB.Recordset', { size: 13, b: 1 });
      s += mono(14, 44, 'rs.Open "SELECT * FROM 설비 WHERE 라인=\'A\'"', { size: 13, b: 1, c: C.blue });
      var sh = tbl(14, 62, [['코드', '설비명', '가동'], ['M01', '프레스', '320'], ['M03', '밀링', '410'], ['M06', '드릴', '260']], { cw: [60, 76, 56], fill: { '1,0:1,2': 'y' } });
      s += sh.s + t(sh.right + 8, sh.cy(1), '◀ 지금 레코드', { size: 13, b: 1, c: C.orange });
      s += mono(260, sh.cy(2) + 4, 'rs!설비명', { size: 15, b: 1, c: C.green, ans: true }) + t(372, sh.cy(2) + 4, '→ 프레스', { size: 14, b: 1 });
      s += t(260, sh.cy(3) + 8, '! = 필드 · . = rs 자신의 속성', { size: 13, c: C.sub });
      s += mono(14, sh.bottom + 22, 'rs.Close', { size: 14, b: 1, c: C.red }) + t(100, sh.bottom + 22, '— 다 쓰면 닫는다', { size: 13, c: C.red });
      s += hdiv(sh.bottom + 40);
      s += mono(14, sh.bottom + 62, 'DoCmd.OpenForm "사원자료", , , "[주소]=\'…\'"', { size: 13, b: 1 });
      s += t(14, sh.bottom + 86, '가운데 쉼표로 비운 자리 = 기본값 그대로', { size: 13, c: C.sub });
      return F.svg(480, sh.bottom + 104, s);
    } }

  };
})();
