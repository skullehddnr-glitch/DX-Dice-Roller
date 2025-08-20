import React, { useState } from "react";

// 주사위 굴림 함수
function rollDX(numDice, critical, modifier = 0) {
  let dice = Array.from({ length: numDice }, () =>
    Math.floor(Math.random() * 10) + 1
  );
  let total = 0;
  let results = [];
  let round = 1;

  while (dice.length > 0) {
    const max = Math.max(...dice);
    results.push(`라운드 ${round}: 🎲 [${dice.join(", ")}] → 최고값 ${max}`);
    total += max;
    if (max >= critical && critical > 1) {
      dice = dice.filter((d) => d >= critical).map(() => Math.floor(Math.random() * 10) + 1);
      round++;
    } else {
      break;
    }
  }

  total += modifier;
  return { total, log: results, modifier };
}

// 데미지 굴림 함수
function rollDamage(achievement) {
  const diceCount = Math.floor(achievement / 10) + 1;
  const diceResults = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 10) + 1);
  const sum = diceResults.reduce((a, b) => a + b, 0);
  return { diceCount, diceResults, sum };
}

export default function App() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const match = command.match(/(\d+)dx(\d+)([+-]\d+)?/i);
    if (!match) {
      setResult({ error: "명령어 형식이 올바르지 않습니다. 예: 7dx7+2" });
      return;
    }

    const numDice = parseInt(match[1], 10);
    const critical = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    const roll = rollDX(numDice, critical, modifier);
    const damage = rollDamage(roll.total);

    setResult({ ...roll, damage });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-indigo-50 text-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 (이모지 및 크리티컬 하한 제거됨) */}
        <header className="rounded-2xl p-4 md:p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold">
            Double Cross Dice Roller
          </h1>
        </header>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <label className="block text-lg font-medium text-slate-700">
            주사위 명령어 입력
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="예: 7dx7+2"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition"
          >
            굴리기
          </button>
        </form>

        {/* 결과 */}
        {result && (
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            {result.error ? (
              <p className="text-red-500 font-semibold">{result.error}</p>
            ) : (
              <>
                <h2 className="text-xl font-bold text-indigo-700">명중 굴림 결과</h2>
                <ul className="space-y-1 text-slate-800">
                  {result.log.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                <p className="font-bold mt-2">
                  최종 달성치: {result.total}
                  {result.modifier !== 0 && (
                    <span className="text-slate-500"> (보정 포함)</span>
                  )}
                </p>

                <h2 className="text-xl font-bold text-violet-700 mt-4">데미지 굴림 결과</h2>
                <p>
                  {result.damage.diceCount}D10 → [ {result.damage.diceResults.join(", ")} ] → 합계 {result.damage.sum}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
