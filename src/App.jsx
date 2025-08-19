import React, { useMemo, useState } from "react";

// Double Cross 3rd style dice roller
// Rule summary:
// - Roll N d10. If any die >= Critical, count those dice and roll that many again (chain +1), repeat.
// - When no die meets/exceeds Critical, stop. Result = max(last roll) + (chains * 10) + modifier.
// - Critical floor: 2 (cannot go below 2).

// -------------------- Utilities --------------------
function randInt1to10() {
  return Math.floor(Math.random() * 10) + 1;
}

function clampCritical(c) {
  if (Number.isNaN(c) || !Number.isFinite(c)) return 10;
  return Math.max(2, Math.min(10, Math.floor(c)));
}

function sanitizeInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function parseCommand(cmd) {
  // Accept variants like: 16dx7+2 , 8DX6-1 , spaces allowed
  // Regex groups: N, C, M (optional)
  const re = /^\s*(\d+)\s*d\s*x\s*(\d+)\s*([+-]\s*\d+)?\s*$/i;
  const m = cmd.match(re);
  if (!m) return null;
  const N = sanitizeInt(m[1], 0);
  const C = clampCritical(sanitizeInt(m[2], 10));
  const M = m[3] ? sanitizeInt(m[3].replace(/\s+/g, ""), 0) : 0;
  return { N, C, M };
}

function rollDX(N, C, M = 0) {
  // Guard rails
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
    tiers,
    chains,
    lastMax,
    total,
    note: crit <= 2 ? "크리티컬치 최소값(2) 적용" : undefined,
  };
}

function summarize(result) {
  const { chains, lastMax, total } = result;
  return `합계 ${total} (치명 ${chains}회, 최종눈 ${lastMax})`;
}

// -------------------- UI Components --------------------
export default function DXDiceRollerApp() {
  const [command, setCommand] = useState("16dx7+2");
  const parsed = useMemo(() => (command ? parseCommand(command) : null), [command]);

  const [N, setN] = useState(8);
  const [C, setC] = useState(6);
  const [M, setM] = useState(0);
  const [repeat, setRepeat] = useState(1);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  // Damage (Achievement-based) states
  const [damageAchieve, setDamageAchieve] = useState(0); // 최종 달성치
  const [damageFixed, setDamageFixed] = useState(0);     // 고정 가산치

  // -------------------- Damage Roller (Achievement-based) --------------------
  function rollDamageByAchieveOnce(achieve, fixed) {
    const A = Math.max(0, Math.floor(achieve || 0));
    const F = Math.floor(fixed || 0);
    const diceCount = Math.floor(A / 10) + 1; // (⌊달성치/10⌋ + 1) D10
    const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 10) + 1);
    const sum = rolls.reduce((a, b) => a + b, 0) + F;
    return { diceCount, rolls, total: sum, fixed: F, achieve: A };
  }

  function doDamageRollByAchieve() {
    const r = rollDamageByAchieveOnce(damageAchieve, damageFixed);
    const item = {
      id: Date.now(),
      mode: "damage-achieve",
      input: `DMG: (⌊${r.achieve}/10⌋+1)D10 + ${r.fixed} → ${r.diceCount}D10+${r.fixed}`,
      repeat: 1,
      results: [
        {
          tiers: [],
          chains: 0,
          lastMax: 0,
          total: r.total,
          note: `데미지: ${r.diceCount}D10 + ${r.fixed} (달성치 ${r.achieve})`,
          dmgDetail: { rolls: r.rolls, diceCount: r.diceCount, fixed: r.fixed },
        },
      ],
    };
    setHistory((h) => [item, ...h]);
  }

  // Summary stats for each history block
  function stats(results) {
    if (!results.length) return null;
    const totals = results.map((r) => r.total);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    return { min, max, avg: Math.round(avg * 1000) / 1000 };
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Double Cross Dice Roller</h1>
          <div className="text-sm text-slate-500">크리티컬 하한: <b>2</b></div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {/* Command panel */}
          <div className="rounded-2xl shadow-sm bg-white p-4 md:p-5 border border-slate-200">
            <h2 className="text-lg font-semibold mb-2">명령어 입력</h2>
            <p className="text-sm text-slate-600 mb-3">형식: <code className="px-1 py-0.5 rounded bg-slate-100">NdxC±M</code> (예: <b>16dx7+2</b>, <b>8dx6</b>)</p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="예: 12dx6+3"
              />
              <button
                className="rounded-xl px-4 py-2 bg-slate-900 text-white hover:bg-slate-800"
                onClick={doRollFromCommand}
              >굴리기</button>
            </div>
            {parsed ? (
              <div className="mt-2 text-sm text-slate-600">
                파싱됨: <b>{parsed.N}dx{parsed.C}{parsed.M >= 0 ? "+" : ""}{parsed.M}</b>
              </div>
            ) : (
              <div className="mt-2 text-sm text-rose-600">올바른 형식이 아닙니다.</div>
            )}
          </div>

          {/* Field panel */}
          <div className="rounded-2xl shadow-sm bg-white p-4 md:p-5 border border-slate-200">
            <h2 className="text-lg font-semibold mb-2">직접 입력</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-500">주사위 수 N</label>
                <input type="number" min={0} max={500} value={N}
                  onChange={(e) => setN(sanitizeInt(e.target.value, N))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-slate-500">크리티컬치 C</label>
                <input type="number" min={2} max={10} value={C}
                  onChange={(e) => setC(sanitizeInt(e.target.value, C))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-slate-500">보정치 M</label>
                <input type="number" value={M}
                  onChange={(e) => setM(sanitizeInt(e.target.value, M))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">반복 횟수</label>
                <input type="number" min={1} max={200} value={repeat}
                  onChange={(e) => setRepeat(sanitizeInt(e.target.value, repeat))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
              <div className="flex items-end">
                <button
                  className="w-full rounded-xl px-4 py-2 bg-slate-900 text-white hover:bg-slate-800"
                  onClick={doRollFromFields}
                >굴리기</button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">* 크리티컬치는 자동으로 최소 2로 보정됩니다.</p>
          </div>
        </section>

        {/* Damage roller (Achievement-based) */}
        <section className="rounded-2xl shadow-sm bg-white p-4 md:p-5 border border-slate-200">
          <h2 className="text-lg font-semibold mb-3">데미지 굴림 — 달성치 기반(공식식)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs text-slate-500">최종 달성치</label>
                <input type="number" value={damageAchieve} onChange={(e)=>setDamageAchieve(sanitizeInt(e.target.value,damageAchieve))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-slate-500">고정값(+M)</label>
                <input type="number" value={damageFixed} onChange={(e)=>setDamageFixed(sanitizeInt(e.target.value,damageFixed))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>
              <div className="col-span-3 flex items-end">
                <button className="w-full rounded-xl px-4 py-2 bg-slate-900 text-white hover:bg-slate-800" onClick={doDamageRollByAchieve}>
                  데미지 굴리기
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              <p className="mb-1">공식식: <code>⌊달성치 / 10⌋ + 1</code> D10 + 고정값</p>
              <p className="mb-1">예) 달성치 37 → ⌊3.7⌋=3 → <b>4D10</b> + 고정값</p>
              <p className="text-xs text-slate-500">* 이전의 "여유치 기반" 옵션은 제거했습니다.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl shadow-sm bg-white p-4 md:p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">결과 히스토리</h2>
            <div className="flex gap-2">
              <button className="rounded-xl px-3 py-2 bg-slate-200 hover:bg-slate-300" onClick={clearHistory}>초기화</button>
            </div>
          </div>

          {error && (
            <div className="mb-3 text-sm text-rose-600">{error}</div>
          )}

          {history.length === 0 ? (
            <div className="text-slate-500 text-sm">아직 굴린 결과가 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const st = stats(item.results);
                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-semibold">{item.input} {item.repeat > 1 ? `× ${item.repeat}` : ""}</div>
                        {st && (
                          <div className="text-xs text-slate-500">요약: min {st.min} / avg {st.avg} / max {st.max}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-lg px-3 py-1.5 bg-slate-900 text-white text-sm hover:bg-slate-800" onClick={() => copyResults(item)}>복사</button>
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
                            {r.tiers && r.tiers.length > 0 ? (
                              r.tiers.map((arr, i) => (
                                <div key={i} className="font-mono">{i + 1}차 ({arr.length}d10): [ {arr.join(", ")} ]</div>
                              ))
                            ) : (
                              r.dmgDetail ? (
                                <div className="font-mono">
                                  데미지 합산 주사위({r.dmgDetail.baseDice}+{r.dmgDetail.extraDice}) 눈: [ {r.dmgDetail.rolls.join(", ")} ]
                                  {r.dmgDetail.flatBonus ? <div>여유치 고정 보정: +{r.dmgDetail.flatBonus}</div> : null}
                                </div>
                              ) : null
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
          <p>규칙 확인: 마지막 굴림의 <b>최고 눈</b> + (치명 연쇄 횟수 × 10) + 보정치 = 최종값. 크리티컬치는 최소 2.</p>
          <p>데미지: 기본 Nd10 합산 + 보정. 옵션에 따라 달성치 여유치(공격−상대)를 <b>주사위 추가</b> 또는 <b>고정값</b>으로 전환 가능합니다.</p>
        </footer>
      </div>
    </div>
  );
}
