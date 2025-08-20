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
  const [achievementInput, setAchievementInput] = useState("");
  const [result, setResult] = useState(null);

  // 명령어 입력 처리
  const handleCommandSubmit = (e) => {
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

  // 직접 달성치 입력 처리
  const handleAchievementSubmit = (e) => {
    e.preventDefault();
    const value = parseInt(achievementInput, 10);
    if (isNaN(value)) {
      setResult({ error: "달성치는 숫자로 입력해야 합니다." });
      return;
    }
    const damage = rollDamage(value);
    setResult({ total: value, log: [`직접 입력 달성치: ${value}`], damage });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-indigo-50 text-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="rounded-2xl p-4 md:p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold">
            Double Cross Dice Roller
          </h1>
        </header>

        {/* 명령어 입력 */}
        <form onSubmit={handleCommandSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
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
            명령어로 굴리기
          </button>
        </form>

        {/* 직접 달성치 입력 */}
        <form onSubmit={handleAchievementSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <label className="block text-lg font-medium text-slate-700">
            직접 달성치 입력
          </label>
          <input
            type="number"
            value={achievementInput}
            onChange={(e) => setAchievementInput(e.target.value)}
            placeholder="예: 37"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-md transition"
          >
            달성치로 데미지 굴리기
          </button>
        </form>

        {/* 결과 */}
        {result && (
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            {result.error ? (
              <p className="text-red-500 font-semibold">{result.error}</p>
            ) : (
              <>
                <h2 className="text-xl font-bold text-indigo-700">명중 / 입력 결과</h2>
                <ul className="space-y-1 text-slate-800">
                  {result.log.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                <p className="font-bold mt-2">최종 달성치: {result.total}</p>

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
