# 컴활 1급 실기 · SQL 쿼리 연습소 (데이터베이스)

컴퓨터활용능력 **1급 실기**의 쿼리 작성을 **실제 SQL을 직접 작성**하며 연습하는 웹앱입니다.

## 핵심
- 문제의 테이블을 보고 **SELECT 문을 직접 작성** (Ctrl+Enter로 실행)
- 내장 **SQL 엔진이 테이블에 실제로 실행** → 결과셋을 정답과 비교
- 서로 다른 SQL이어도 **결과가 같으면 정답** (조건 순서, 별칭 등 무관)
- 오답 시 **내 쿼리 결과 표 + 모범답안 + 힌트** 제공

## 지원 SQL(엔진)
`SELECT [DISTINCT] * | 열/집계 [AS 별칭] FROM 테이블
 [WHERE 조건] [GROUP BY ...] [HAVING ...] [ORDER BY 열 ASC|DESC]`
- WHERE: `AND OR NOT`, `= <> < > <= >=`, `LIKE`(`*`/`%`/`?`/`_`), `BETWEEN..AND..`, `IN(...)`, `IS NULL`
- 집계: `COUNT(*) COUNT SUM AVG MAX MIN` + `GROUP BY` / `HAVING`
- 정렬: `ORDER BY` (출력 별칭·미선택 컬럼·집계 모두 지원)

## 문제 추가
`data/problems.js`에서 `SQL_TABLES`(샘플 테이블)와 `SQL_PROBLEMS`(문제)에 추가합니다.
문제는 `{ table, prompt, answer, hint }` 형태이며, **모범답안(answer)을 실제 실행한 결과**와 학생 입력을 비교하므로 정답값을 따로 적을 필요가 없습니다.

## 결과 제출 (선생님용)
`result-collector` 방식.
```
https://hongyul67-cpu.github.io/comhwal-access/?rc=<AppsScript exec URL>&cls=1,2,3&max=40
```

## 실행
`index.html`을 열면 됩니다.

## 📖 먼저 배우기 · 그림 (2026-10-01)
- 시작 화면 맨 위 「📖 먼저 배우기」 — 수업 슬라이드 원고(`lesson.js`)의 요점을 그림과 함께 보여 준다(정답을 다 보여 주는 화면).
- 그림은 `figs.js` 한 곳(30장 · 카드 28장 중 27장). 공용 도우미는 `https://hongyul67-cpu.github.io/links/fig.js` (사본 두지 않음).
- 수업 슬라이드 26장이 같은 그림을 쓴다. `slide:'q'` 그림은 퀴즈 답이 되는 이름표를 `?` 로 가린다.
- 그림을 고칠 때: `cards` 는 `lesson.js` 의 제목과 글자까지 같아야 한다. 계산 결과는 엔진으로 다시 확인.
