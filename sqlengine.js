/* SQLEngine - 간이 SQL 엔진 (컴활 실기 쿼리 연습용, 단일 테이블 SELECT)
 * window.SQLEngine.run(sql, table) -> { columns:[], rows:[[]] } 또는 { error }
 *   table: { columns:[名...], rows:[ [v,...], ... ] }
 * 지원: SELECT [DISTINCT] * | 컬럼/집계 [AS 별칭] , ...
 *       FROM t [WHERE ...] [GROUP BY ...] [HAVING ...] [ORDER BY col [ASC|DESC], ...]
 *       SELECT: 열, 집계함수, 계산 필드(중간+기말 AS 총점)
 *       WHERE: AND OR NOT, = <> < > <= >=, LIKE, BETWEEN..AND.., IN(...), NOT IN/LIKE/BETWEEN,
 *              산술식(중간+기말, 단가*2), 문자'..' 숫자
 *       집계: COUNT(*) COUNT(col) SUM AVG MAX MIN
 */
(function () {
  'use strict';

  var KW = ['SELECT', 'DISTINCT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC',
    'AND', 'OR', 'NOT', 'LIKE', 'BETWEEN', 'IN', 'AS', 'IS', 'NULL', 'TRUE', 'FALSE'];

  /* 산술 — 숫자로 바꿔 계산한다. 숫자가 아니면 null(조건에서 걸러짐) */
  function arith(op, a, b) {
    var x = Number(a), y = Number(b);
    if (a === null || b === null || isNaN(x) || isNaN(y)) return null;
    switch (op) {
      case '+': return x + y;
      case '-': return x - y;
      case '*': return x * y;
      case '/': return y === 0 ? null : x / y;
    }
    return null;
  }

  function tokenize(s) {
    var t = [], i = 0, n = s.length;
    function isD(c) { return c >= '0' && c <= '9'; }
    function isA(c) { return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c === '_' || c === '가'; }
    function isKor(c) { return c >= '가' && c <= '힣'; }
    function isAlpha(c) { return isA(c) || isKor(c); }
    while (i < n) {
      var c = s[i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
      if (isD(c) || (c === '.' && isD(s[i + 1]))) { var num = ''; while (i < n && (isD(s[i]) || s[i] === '.')) num += s[i++]; t.push({ t: 'num', v: parseFloat(num) }); continue; }
      if (c === "'" || c === '"') { var q = c; i++; var str = ''; while (i < n) { if (s[i] === q) { if (s[i + 1] === q) { str += q; i += 2; continue; } i++; break; } str += s[i++]; } t.push({ t: 'str', v: str }); continue; }
      if (isAlpha(c)) { var id = ''; while (i < n && (isAlpha(s[i]) || isD(s[i]) || s[i] === '.')) id += s[i++]; var up = id.toUpperCase(); t.push({ t: KW.indexOf(up) >= 0 ? 'kw' : 'id', v: KW.indexOf(up) >= 0 ? up : id }); continue; }
      var two = s.substr(i, 2);
      if (two === '<>' || two === '<=' || two === '>=' || two === '!=') { t.push({ t: 'op', v: two === '!=' ? '<>' : two }); i += 2; continue; }
      if ('=<>'.indexOf(c) >= 0) { t.push({ t: 'op', v: c }); i++; continue; }
      if (c === '*') { t.push({ t: 'star' }); i++; continue; }
      if (c === '(') { t.push({ t: 'lp' }); i++; continue; }
      if (c === ')') { t.push({ t: 'rp' }); i++; continue; }
      if (c === ',') { t.push({ t: 'comma' }); i++; continue; }
      if ('+-/'.indexOf(c) >= 0) { t.push({ t: 'op', v: c }); i++; continue; }
      throw 'SQL 구문 오류: 알 수 없는 문자 "' + c + '"';
    }
    return t;
  }

  function parse(sql) {
    var toks = tokenize(sql), p = 0;
    function peek() { return toks[p]; }
    function next() { return toks[p++]; }
    function isKw(v) { var tk = peek(); return tk && tk.t === 'kw' && tk.v === v; }
    function eatKw(v) { if (!isKw(v)) throw 'SQL 구문 오류: ' + v + ' 필요'; return next(); }

    if (!isKw('SELECT')) throw 'SELECT로 시작해야 합니다';
    next();
    var distinct = false; if (isKw('DISTINCT')) { next(); distinct = true; }

    // select list
    var items = [];
    if (peek() && peek().t === 'star') { next(); items.push({ kind: 'star' }); }
    else { items.push(parseSelItem()); while (peek() && peek().t === 'comma') { next(); items.push(parseSelItem()); } }

    eatKw('FROM');
    var tk = next(); if (!tk || (tk.t !== 'id' && tk.t !== 'kw')) throw 'FROM 뒤에 테이블 이름이 필요';
    var from = tk.v;

    var where = null, groupBy = null, having = null, orderBy = null;
    if (isKw('WHERE')) { next(); where = parseExpr(); }
    if (isKw('GROUP')) { next(); eatKw('BY'); groupBy = [colName()]; while (peek() && peek().t === 'comma') { next(); groupBy.push(colName()); } }
    if (isKw('HAVING')) { next(); having = parseExpr(); }
    if (isKw('ORDER')) { next(); eatKw('BY'); orderBy = [parseOrd()]; while (peek() && peek().t === 'comma') { next(); orderBy.push(parseOrd()); } }
    if (p < toks.length) throw 'SQL 구문 오류: 예상치 못한 토큰';
    return { distinct: distinct, items: items, from: from, where: where, groupBy: groupBy, having: having, orderBy: orderBy };

    function colName() { var t2 = next(); if (!t2 || (t2.t !== 'id' && t2.t !== 'kw')) throw '컬럼 이름이 필요'; return t2.v; }
    function parseOrd() {
      var name = colName();
      if (peek() && peek().t === 'lp') { next(); var arg = (peek() && peek().t === 'star') ? (next(), '*') : colName(); if (!peek() || peek().t !== 'rp') throw ') 필요'; next(); name = name.toUpperCase() + '(' + arg + ')'; }
      var dir = 'ASC'; if (isKw('ASC')) next(); else if (isKw('DESC')) { next(); dir = 'DESC'; } return { col: name, dir: dir };
    }
    function parseSelItem() {
      // 집계함수 or 컬럼
      var tk2 = peek();
      if (tk2 && tk2.t === 'id' && peek() && toks[p + 1] && toks[p + 1].t === 'lp') {
        var fn = next().v.toUpperCase(); next(); // (
        var arg;
        if (peek() && peek().t === 'star') { next(); arg = '*'; } else { arg = colName(); }
        if (!peek() || peek().t !== 'rp') throw ') 필요'; next();
        var alias = fn + '(' + arg + ')';
        if (isKw('AS')) { next(); alias = colName(); }
        else if (peek() && peek().t === 'id') { alias = next().v; }
        return { kind: 'agg', fn: fn, arg: arg, alias: alias };
      }
      // 계산 필드인지 미리 살펴본다 — 이름 뒤에 + - * / 가 오면 식으로 다룬다
      var save = p;
      var name2 = colName();
      var nx = peek();
      var isExpr = nx && ((nx.t === 'op' && '+-/'.indexOf(nx.v) >= 0) || nx.t === 'star');
      if (isExpr) {
        p = save;
        var node = parseArith();
        var ea = exprLabel(node);
        if (isKw('AS')) { next(); ea = colName(); }
        else if (peek() && peek().t === 'id') { ea = next().v; }
        return { kind: 'expr', node: node, alias: ea };
      }
      var al = name2;
      if (isKw('AS')) { next(); al = colName(); }
      else if (peek() && peek().t === 'id') { al = next().v; }
      return { kind: 'col', col: name2, alias: al };
    }
    /* 계산 필드에 이름(AS)을 안 붙였을 때 보여 줄 머리글 — 식을 그대로 되살린다 */
    function exprLabel(n) {
      if (!n) return '식';
      if (n.v === 'arith') return exprLabel(n.l) + n.op + exprLabel(n.r);
      if (n.v === 'col') return n.name;
      if (n.v === 'num' || n.v === 'str') return String(n.val);
      return '식';
    }

    /* WHERE/HAVING 식 파서 */
    function parseExpr() { return parseOr(); }
    function parseOr() { var l = parseAnd(); while (isKw('OR')) { next(); l = { op: 'OR', l: l, r: parseAnd() }; } return l; }
    function parseAnd() { var l = parseNot(); while (isKw('AND')) { next(); l = { op: 'AND', l: l, r: parseNot() }; } return l; }
    function parseNot() { if (isKw('NOT')) { next(); return { op: 'NOT', x: parseNot() }; } return parseCond(); }
    function parseCond() {
      if (peek() && peek().t === 'lp') { next(); var e = parseExpr(); if (!peek() || peek().t !== 'rp') throw ') 필요'; next(); return e; }
      var left = parseArith();
      // 열 이름 뒤에 오는 NOT — 부서 NOT IN (...), 이름 NOT LIKE '김*', 급여 NOT BETWEEN a AND b
      var negated = false;
      if (isKw('NOT') && toks[p + 1] && toks[p + 1].t === 'kw' &&
          ['IN', 'LIKE', 'BETWEEN'].indexOf(toks[p + 1].v) >= 0) { next(); negated = true; }
      function maybeNot(node) { return negated ? { op: 'NOT', x: node } : node; }
      var tk3 = peek();
      if (isKw('BETWEEN')) { next(); var lo = parseArith(); eatKw('AND'); var hi = parseArith(); return maybeNot({ op: 'BETWEEN', x: left, lo: lo, hi: hi }); }
      if (isKw('IN')) { next(); if (!peek() || peek().t !== 'lp') throw '( 필요'; next(); var list = [parseArith()]; while (peek() && peek().t === 'comma') { next(); list.push(parseArith()); } if (!peek() || peek().t !== 'rp') throw ') 필요'; next(); return maybeNot({ op: 'IN', x: left, list: list }); }
      if (isKw('LIKE')) { next(); var pat = parseArith(); return maybeNot({ op: 'LIKE', x: left, pat: pat }); }
      if (isKw('IS')) { next(); var neg = false; if (isKw('NOT')) { next(); neg = true; } eatKw('NULL'); return { op: neg ? 'ISNOTNULL' : 'ISNULL', x: left }; }
      if (tk3 && tk3.t === 'op' && '= < > <= >= <>'.split(' ').indexOf(tk3.v) >= 0) { var o = next().v; return { op: o, l: left, r: parseArith() }; }
      return left; // 단일 값(불린 컬럼 등)
    }
    /* 산술식 — 곱셈·나눗셈이 덧셈·뺄셈보다 먼저.
       주의: '*'는 op가 아니라 'star' 토큰이라 따로 봐야 한다. */
    function parseArith() {
      var l = parseMulDiv();
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
        var o = next().v; l = { v: 'arith', op: o, l: l, r: parseMulDiv() };
      }
      return l;
    }
    function parseMulDiv() {
      var l = parseVal();
      while (peek() && ((peek().t === 'op' && peek().v === '/') || peek().t === 'star')) {
        var o = peek().t === 'star' ? '*' : peek().v; next();
        l = { v: 'arith', op: o, l: l, r: parseVal() };
      }
      return l;
    }
    function parseVal() {
      var tk4 = peek();
      if (!tk4) throw '값이 필요';
      // 집계함수 호출 (HAVING 등): COUNT(*), SUM(col)
      if (tk4.t === 'id' && toks[p + 1] && toks[p + 1].t === 'lp') {
        var fn = next().v.toUpperCase(); next();
        var arg; if (peek() && peek().t === 'star') { next(); arg = '*'; } else { arg = colName(); }
        if (!peek() || peek().t !== 'rp') throw ') 필요'; next();
        return { v: 'agg', fn: fn, arg: arg };
      }
      next();
      if (tk4.t === 'num') return { v: 'num', val: tk4.v };
      if (tk4.t === 'str') return { v: 'str', val: tk4.v };
      if (tk4.t === 'kw' && tk4.v === 'NULL') return { v: 'null' };
      if (tk4.t === 'id' || tk4.t === 'kw') return { v: 'col', name: tk4.v };
      throw 'SQL 구문 오류: 값이 필요';
    }
  }

  /* ---------- 실행 ---------- */
  /* ── 액션 쿼리 (INSERT / UPDATE / DELETE) : 새 테이블 상태를 반환 ── */
  function runAction(sql, table) {
    var toks;
    try { toks = tokenize(sql); } catch (e) { return { error: String(e) }; }
    var p = 0;
    function peek() { return toks[p]; }
    function next() { return toks[p++]; }
    function isVal(v) { var t = peek(); return t && (t.t === 'id' || t.t === 'kw') && t.v.toUpperCase() === v; }
    function eat(v) { if (!isVal(v)) throw v + ' 필요'; return next(); }
    function ident() { var t = next(); if (!t || (t.t !== 'id' && t.t !== 'kw')) throw '이름이 필요'; return t.v; }

    var cols = table.columns;
    var idx = {}; cols.forEach(function (c, i) { idx[c.toUpperCase()] = i; });
    function ci(name) { var k = name.toUpperCase(); if (!(k in idx)) throw '없는 컬럼: ' + name; return idx[k]; }
    var rows = table.rows.map(function (r) { return r.slice(); });   // 깊은 복사

    function cmp(op, a, b) {
      if (a === null || b === null) return op === '<>' ? (a !== b) : (op === '=' ? (a === b) : false);
      var na = Number(a), nb = Number(b), num = (typeof a === 'number' || (!isNaN(na) && a !== '')) && (typeof b === 'number' || (!isNaN(nb) && b !== ''));
      var av = num ? na : String(a), bv = num ? nb : String(b);
      switch (op) { case '=': return av === bv; case '<>': return av !== bv; case '<': return av < bv; case '>': return av > bv; case '<=': return av <= bv; case '>=': return av >= bv; }
    }
    function valNode() {
      var t = next(); if (!t) throw '값이 필요';
      return function (row) {
        // ※ 토크나이저는 값을 t.v 에 담는다 (SELECT용 AST 노드의 .val 과 다름)
        if (t.t === 'num') return t.v;
        if (t.t === 'str') return t.v;
        if (t.t === 'kw' && t.v === 'NULL') return null;
        if (row && ((t.v + '').toUpperCase() in idx)) return row[ci(t.v)];
        return t.v;
      };
    }
    function setExpr() {
      var a = valNode();
      var nt = peek();
      // ※ '*' 는 SELECT * 때문에 'star' 토큰으로 나온다 → 곱셈으로도 인정
      if (nt && (nt.t === 'star' || (nt.t === 'op' && '+-/'.indexOf(nt.v) >= 0))) {
        var op = (nt.t === 'star') ? '*' : nt.v;
        next();
        var b = valNode();
        return function (row) { var x = Number(a(row)), y = Number(b(row)); return op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y; };
      }
      return a;
    }
    function parseWhere() {
      function orE() { var l = andE(); while (isVal('OR')) { next(); var r = andE(), a = l; l = function (row) { return a(row) || r(row); }; } return l; }
      function andE() { var l = cmpE(); while (isVal('AND')) { next(); var r = cmpE(), a = l; l = function (row) { return a(row) && r(row); }; } return l; }
      function cmpE() {
        if (peek() && peek().t === 'lp') { next(); var e = orE(); if (!peek() || peek().t !== 'rp') throw ') 필요'; next(); return e; }
        var lt = valNode(); var op = (peek() && peek().t === 'op') ? next().v : '='; var rt = valNode();
        return function (row) { return cmp(op, lt(row), rt(row)); };
      }
      return orE();
    }

    var cmd = next().v.toUpperCase();
    if (cmd === 'INSERT') {
      eat('INTO'); ident();
      var names = null;
      if (peek() && peek().t === 'lp') { next(); names = [ident()]; while (peek() && peek().t === 'comma') { next(); names.push(ident()); } if (!peek() || peek().t !== 'rp') throw ') 필요'; next(); }
      eat('VALUES'); if (!peek() || peek().t !== 'lp') throw '( 필요'; next();
      var vs = [valNode()(null)]; while (peek() && peek().t === 'comma') { next(); vs.push(valNode()(null)); }
      if (!peek() || peek().t !== 'rp') throw ') 필요'; next();
      var nm = names || cols;
      if (nm.length !== vs.length) throw '열 수와 값 수가 다릅니다';
      var nr = cols.map(function () { return null; });
      nm.forEach(function (c, i) { nr[ci(c)] = vs[i]; });
      rows.push(nr);
    } else if (cmd === 'DELETE') {
      if (peek() && peek().t === 'star') next();
      eat('FROM'); ident();
      var pred = null; if (isVal('WHERE')) { next(); pred = parseWhere(); }
      rows = rows.filter(function (r) { return pred ? !pred(r) : false; });
    } else if (cmd === 'UPDATE') {
      ident(); eat('SET');
      var sets = []; (function one() { var c = ident(); var e = next(); if (!e || e.v !== '=') throw '= 필요'; sets.push({ c: c, f: setExpr() }); if (peek() && peek().t === 'comma') { next(); one(); } })();
      var pred2 = null; if (isVal('WHERE')) { next(); pred2 = parseWhere(); }
      rows.forEach(function (r) { if (!pred2 || pred2(r)) sets.forEach(function (s) { r[ci(s.c)] = s.f(r); }); });
    } else return { error: '지원하지 않는 명령: ' + cmd };
    return { columns: cols.slice(), rows: rows, action: true };
  }

  function run(sql, table) {
    var clean = String(sql).replace(/;\s*$/, '').trim();
    var head = (clean.split(/\s+/)[0] || '').toUpperCase();
    if (head === 'INSERT' || head === 'UPDATE' || head === 'DELETE') {
      try { return runAction(clean, table); } catch (e) { return { error: String(e) }; }
    }
    var ast;
    try { ast = parse(clean); }
    catch (e) { return { error: String(e) }; }
    try {
      var cols = table.columns;
      var idx = {}; cols.forEach(function (c, i) { idx[c.toUpperCase()] = i; });
      function cellByName(row, name) { var k = name.toUpperCase(); if (!(k in idx)) throw '없는 컬럼: ' + name; return row[idx[k]]; }

      function evalVal(node, row) {
        if (node.v === 'num') return node.val;
        if (node.v === 'str') return node.val;
        if (node.v === 'null') return null;
        if (node.v === 'arith') return arith(node.op, evalVal(node.l, row), evalVal(node.r, row));
        if (node.v === 'col') return cellByName(row, node.name);
        return null;
      }
      function cmp(op, a, b) {
        if (a === null || b === null) return false;
        var na = Number(a), nb = Number(b), bothNum = (typeof a === 'number' || (!isNaN(na) && a !== '')) && (typeof b === 'number' || (!isNaN(nb) && b !== ''));
        var av, bv; if (bothNum) { av = na; bv = nb; } else { av = String(a); bv = String(b); }
        switch (op) { case '=': return av === bv; case '<>': return av !== bv; case '<': return av < bv; case '>': return av > bv; case '<=': return av <= bv; case '>=': return av >= bv; }
      }
      function like(val, pat) {
        var re = '^' + String(pat).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
        return new RegExp(re, 'i').test(String(val === null ? '' : val));
      }
      function evalCond(node, row) {
        if (!node) return true;
        switch (node.op) {
          case 'AND': return evalCond(node.l, row) && evalCond(node.r, row);
          case 'OR': return evalCond(node.l, row) || evalCond(node.r, row);
          case 'NOT': return !evalCond(node.x, row);
          case 'BETWEEN': { var x = evalVal(node.x, row); return cmp('>=', x, evalVal(node.lo, row)) && cmp('<=', x, evalVal(node.hi, row)); }
          case 'IN': { var xv = evalVal(node.x, row); return node.list.some(function (v) { return cmp('=', xv, evalVal(v, row)); }); }
          case 'LIKE': return like(evalVal(node.x, row), evalVal(node.pat, row));
          case 'ISNULL': return evalVal(node.x, row) === null;
          case 'ISNOTNULL': return evalVal(node.x, row) !== null;
          case '=': case '<>': case '<': case '>': case '<=': case '>=':
            return cmp(node.op, evalVal(node.l, row), evalVal(node.r, row));
          default: return !!evalVal(node, row);
        }
      }

      // 1) WHERE
      var rows = table.rows.filter(function (r) { return evalCond(ast.where, r); });

      // 컬럼 확장(*)
      var items = ast.items;
      if (items.length === 1 && items[0].kind === 'star') items = cols.map(function (c) { return { kind: 'col', col: c, alias: c }; });

      var hasAgg = items.some(function (it) { return it.kind === 'agg'; });
      var out = [];
      var outCols = items.map(function (it) { return it.alias; });

      function aggVal(fn, arg, groupRows) {
        if (fn === 'COUNT') { if (arg === '*') return groupRows.length; return groupRows.filter(function (r) { return cellByName(r, arg) !== null && cellByName(r, arg) !== ''; }).length; }
        var vals = groupRows.map(function (r) { return Number(cellByName(r, arg)); }).filter(function (x) { return !isNaN(x); });
        if (fn === 'SUM') return vals.reduce(function (a, b) { return a + b; }, 0);
        if (fn === 'AVG') return vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null;
        if (fn === 'MAX') return vals.length ? Math.max.apply(null, vals) : null;
        if (fn === 'MIN') return vals.length ? Math.min.apply(null, vals) : null;
        throw '지원하지 않는 함수: ' + fn;
      }
      function rowFor(items, groupRows, keyRow) {
        return items.map(function (it) {
          if (it.kind === 'agg') return aggVal(it.fn, it.arg, groupRows);
          if (it.kind === 'expr') return evalVal(it.node, keyRow);
          return cellByName(keyRow, it.col);
        });
      }

      if (ast.groupBy || hasAgg) {
        var groups = [];
        if (ast.groupBy) {
          var map = {};
          rows.forEach(function (r) {
            var key = ast.groupBy.map(function (c) { return String(cellByName(r, c)); }).join('');
            if (!map[key]) { map[key] = { key: r, rows: [] }; groups.push(map[key]); }
            map[key].rows.push(r);
          });
        } else { groups.push({ key: rows[0] || cols.map(function () { return null; }), rows: rows }); }
        groups.forEach(function (g) {
          if (ast.having && !evalCondAgg(ast.having, g.rows)) return;
          out.push({ vals: rowFor(items, g.rows, g.key), src: g.key });
        });
      } else {
        rows.forEach(function (r) { out.push({ vals: rowFor(items, [r], r), src: r }); });
      }

      function evalCondAgg(node, groupRows) {
        // HAVING: 집계 비교 지원 (예: COUNT(*)>2)
        function v(n) {
          if (n.v === 'num') return n.val; if (n.v === 'str') return n.val; if (n.v === 'null') return null;
          if (n.agg) return aggVal(n.fn, n.arg, groupRows);
          if (n.v === 'col') return groupRows.length ? cellByName(groupRows[0], n.name) : null;
          return null;
        }
        // having 파서는 일반 식이라 집계가 col처럼 파싱됨 → 재작성: 여기선 단순 비교만
        switch (node.op) {
          case 'AND': return evalCondAgg(node.l, groupRows) && evalCondAgg(node.r, groupRows);
          case 'OR': return evalCondAgg(node.l, groupRows) || evalCondAgg(node.r, groupRows);
          case 'NOT': return !evalCondAgg(node.x, groupRows);
          case '=': case '<>': case '<': case '>': case '<=': case '>=':
            return cmp(node.op, havingVal(node.l, groupRows), havingVal(node.r, groupRows));
          default: return true;
        }
      }
      function havingVal(node, groupRows) {
        if (node.v === 'num') return node.val; if (node.v === 'str') return node.val;
        if (node.v === 'arith') return arith(node.op, havingVal(node.l, groupRows), havingVal(node.r, groupRows));
        if (node.v === 'agg') return aggVal(node.fn, node.arg, groupRows);
        if (node.v === 'col') {
          // 집계 별칭 또는 컬럼
          var it = items.filter(function (x) { return x.alias.toUpperCase() === node.name.toUpperCase(); })[0];
          if (it && it.kind === 'agg') return aggVal(it.fn, it.arg, groupRows);
          return groupRows.length ? cellByName(groupRows[0], node.name) : null;
        }
        return null;
      }

      // DISTINCT
      if (ast.distinct) {
        var seen = {}, uniq = [];
        out.forEach(function (r) { var k = r.vals.map(String).join(''); if (!seen[k]) { seen[k] = 1; uniq.push(r); } });
        out = uniq;
      }
      // ORDER BY
      if (ast.orderBy) {
        var ocols = ast.orderBy.map(function (o) { var i = outCols.map(function (c) { return c.toUpperCase(); }).indexOf(o.col.toUpperCase()); if (i < 0 && idx[o.col.toUpperCase()] !== undefined) i = -2 - idx[o.col.toUpperCase()]; return { i: i, dir: o.dir, name: o.col }; });
        out.sort(function (a, b) {
          for (var k = 0; k < ocols.length; k++) {
            var oi = ocols[k].i, av, bv;
            if (oi >= 0) { av = a.vals[oi]; bv = b.vals[oi]; }
            else if (oi <= -2) { var si = -oi - 2; av = a.src[si]; bv = b.src[si]; }
            else { continue; }
            var na = Number(av), nb = Number(bv), num = !isNaN(na) && !isNaN(nb) && av !== '' && bv !== '';
            var x = num ? (na - nb) : (String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0);
            if (x !== 0) return ocols[k].dir === 'DESC' ? -x : x;
          }
          return 0;
        });
      }
      return { columns: outCols, rows: out.map(function (o) { return o.vals; }), ordered: !!ast.orderBy };
    } catch (e) { return { error: String(e) }; }
  }

  window.SQLEngine = { run: run };
})();
