import React, { useMemo, useState } from "react";

// ---------- 유틸 ----------
function randInt1to10() { return Math.floor(Math.random() * 10) + 1; }
function clampCritical(c) {
  if (!Number.isFinite(c)) return 10;
  return Math.max(2, Math.min(10, Math.floor(c)));
}
function sanitizeInt(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fb;
}
function rollDX(N, C, M = 0) {
  const n0 = Math.max(0, Math.floor(N));
  const crit = clampCritical(C);
  const mod = Math.floor(M || 0);

  const tiers = [];
  let chains = 0;
  let n = n0;
  if (n === 0) {
    return {
      command: `${n0}dx${crit}${mod >= 0 ? "+" : ""}${mod}`,
      tiers: [],
      chains: 0,
      lastMax: 0,
      total: mod,
      note: "N=0: 결과는 보정치만 적용됩니다.",
    };
  }
  while (true) {
    const roll = Array.from({ length: n }, randInt1to10);
    tiers.push(roll);
    const next = roll.filter((x) => x >= crit).length;
    if (next === 0) break;
    chains += 1;
    n = next;
  }
  const last = tiers[tiers.length - 1] || [0];
  const lastMax = Math.max(...last);
  const total = lastMax + chains * 10 + mod;
  return {
    command: `${n0}dx${crit}${mod >= 0 ? "+" : ""}${mod}`,
    tiers, chains, lastMax, total,
    note: crit <= 2 ? "크리티컬치 최소값(2) 적용" : undefined,
  };
}
function summarize(result) {
  const { chains, lastMax, total } = result;
  return `합계 ${total} (치명 ${chains}회, 최종눈 ${lastMax})`;
}
// 공식식 데미지: (⌊A/10⌋ + 1)D10  (고정값 제외)
function rollDamageByAchieveOnce(achieve) {
  const A = Math.max(0, Math.floor(achieve || 0));
  const diceCount = Math.floor(A / 10) + 1;
  const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 10) + 1);
  const sum = rolls.reduce((a, b) => a + b, 0);
  return { diceCount, rolls, total: sum, achieve: A };
}

// ---------- 컴포넌트 ----------
export default function App() {
  // “직접 입력” 방식만 사용
  const [N, setN] = useState(8);
  const [C, setC] = useState(6);
  const [M, setM] = useState(0);
  const [repeat, setRepeat] = useState(1);

  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  function doRollFromFields() {
    setError("");
    const n = Math.max(0, sanitizeInt(N, 0));
    const c = clampCritical(C);
    const m = sanitizeInt(M, 0);
    const times = Math.max(1, Math.min(200, sanitizeInt(repeat, 1)));

    const results = [];
    for (let i = 0; i < times; i++) {
      const r = rollDX(n, c, m);
      // 자동 데미지: 달성치(=판정 최종값)를 이용
      r.autoDmg = rollDamageByAchieveOnce(r.total);
      results.push(r);
    }
    setHistory((h) => [{
      id: Date.now(), mode: "fields",
      input: `${n}dx${c}${m >= 0 ? "+" : ""}${m}`, repeat: times, results
    }, ...h]);
  }

  function stats(results) {
    if (!results.length) return null;
    const totals = results.map((r) => r.total);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const avg = Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 1000) / 1000;
    return { min, max, avg };
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-indigo-50 text-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 (이모지/“크리티컬 하한: 2” 제거됨) */}
        <header className="rounded-2xl p-4 md:p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold">Double Cross Dice Roller</h1>
        </header>

        {/* 직접 입력 패널 */}
        <section className="rounded-2xl shadow-lg bg-white p-4 md:p-5 border border-transparent hover:shadow-xl transition-shadow">
          <h2 className="text-lg font-semibold mb-2">직접 입력</h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500">주사위 수 N</label>
              <input
                type="number" min={0} max={500} value={N}
                onChange={(e) => setN(sanitizeInt(e.target.value, N))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">크리티컬치 C</label>
              <input
                type="number" min={2} max={10} value={C}
                onChange={(e) => setC(sanitizeInt(e.target.value, C))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">보정치 M</label>
              <input
                type="number" value={M}
                onChange={(e) => setM(sanitizeInt(e.target.value, M))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">반복 횟수</label>
              <input
                type="number" min={1} max={200} value={repeat}
                onChange={(e) => setRepeat(sanitizeInt(e.target.value, repeat))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex items-end">
              <button
                className="w-full rounded-xl px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 active:opacity-90 shadow"
                onClick={doRollFromFields}
              >굴리기</button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            * 판정 후 결과(달성치)로 자동 데미지를 굴려 같은 카드에 표시합니다. 데미지 공식: <b>⌊달성치/10⌋ + 1</b> D10
          </p>
        </section>

        {/* 히스토리 */}
        <section className="rounded-2xl shadow-lg bg-white p-4 md:p-5 border border-transparent hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">결과 히스토리</h2>
            <div className="flex gap-2">
              <button className="rounded-xl px-3 py-2 bg-slate-200 hover:bg-slate-300" onClick={() => setHistory([])}>
                초기화
              </button>
            </div>
          </div>

          {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}

          {history.length === 0 ? (
            <div className="text-slate-500 text-sm">아직 굴린 결과가 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const st = (function (results) {
                  if (!results.length) return null;
                  const totals = results.map((r) => r.total);
                  const min = Math.min(...totals);
                  const max = Math.max(...totals);
                  const avg = Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 1000) / 1000;
                  return { min, max, avg };
                })(item.results);

                return (
                  <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-semibold">
                          {item.input} {item.repeat > 1 ? `× ${item.repeat}` : ""}
                        </div>
                        {st && (
                          <div className="text-xs text-slate-500">
                            요약: min {st.min} / avg {st.avg} / max {st.max}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 grid gap-2">
                      {item.results.map((r, idx) => (
                        <details key={idx} className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                          <summary className="cursor-pointer select-none">
                            <span className="font-medium">Roll {idx + 1}</span>
                            <span className="ml-2 text-slate-600 text-sm">{summarize(r)}</span>
                            {r.note && <span className="ml-2 text-xs text-slate-500">({r.note})</span>}
                          </summary>
                          <div className="mt-2 text-sm text-slate-700">
                            {r.tiers && r.tiers.length > 0 && r.tiers.map((arr, i) => (
                              <div key={i} className="font-mono">
                                {i + 1}차 ({arr.length}d10): [ {arr.join(", ")} ]
                              </div>
                            ))}

                            {/* 자동 데미지 표시 */}
                            {r.autoDmg && (
                              <div className="mt-2 font-mono text-indigo-700">
                                자동 데미지 (⌊{r.autoDmg.achieve}/10⌋+1 = {r.autoDmg.diceCount}D10): [ {r.autoDmg.rolls.join(", ")} ] → 합계 {r.autoDmg.total}
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="text-xs text-slate-500">
          <p>판정: 마지막 굴림의 <b>최고 눈</b> + (치명 연쇄 횟수 × 10) + 보정치 = 최종값. 크리티컬치는 최소 2.</p>
          <p>자동 데미지: <b>⌊달성치/10⌋ + 1</b> D10 (고정값 제외).</p>
        </footer>
      </div>
    </div>
  );
}
