import React, { useMemo, useState } from 'react'
function randInt1to10(){ return Math.floor(Math.random()*10)+1 }
function clampCritical(c){ if(!Number.isFinite(c)) return 10; return Math.max(2, Math.min(10, Math.floor(c))) }
function sanitizeInt(v, fb=0){ const n = Number(v); return Number.isFinite(n) ? Math.floor(n) : fb }
function parseCommand(cmd){
  const re = /^\s*(\d+)\s*d\s*x\s*(\d+)\s*([+-]\s*\d+)?\s*$/i
  const m = cmd.match(re); if(!m) return null
  const N = sanitizeInt(m[1],0); const C = clampCritical(sanitizeInt(m[2],10))
  const M = m[3] ? sanitizeInt(m[3].replace(/\s+/g,''),0) : 0
  return {N, C, M}
}
function rollDX(N, C, M=0){
  const n0 = Math.max(0, Math.floor(N)); const crit = clampCritical(C); const mod = Math.floor(M||0)
  const tiers=[]; let chains=0; let n=n0
  if(n===0){ return {command:`${n0}dx${crit}${mod>=0?'+':''}${mod}`, tiers:[], chains:0, lastMax:0, total:mod, note:'N=0: 보정치만 적용'} }
  while(true){
    const roll = Array.from({length:n}, randInt1to10); tiers.push(roll)
    const next = roll.filter(x=>x>=crit).length; if(next===0) break; chains+=1; n=next
  }
  const last = tiers[tiers.length-1] || [0]; const lastMax = Math.max(...last)
  const total = lastMax + chains*10 + mod
  return { command:`${n0}dx${crit}${mod>=0?'+':''}{mod}`, tiers, chains, lastMax, total, note: crit<=2 ? '크리티컬치 최소값(2) 적용' : undefined }
}
function summarize(r){ return `합계 ${r.total} (치명 ${r.chains}회, 최종눈 ${r.lastMax})` }
export default function App(){
  const [command, setCommand] = useState('16dx7+2')
  const parsed = useMemo(()=> command ? parseCommand(command) : null, [command])
  const [N, setN] = useState(8); const [C, setC] = useState(6); const [M, setM] = useState(0)
  const [repeat, setRepeat] = useState(1); const [history, setHistory] = useState([]); const [error, setError] = useState('')
  function doRollFromCommand(){
    setError(''); const p = parseCommand(command); if(!p){ setError('명령을 인식하지 못했습니다. 예: 16dx7+2'); return }
    const times = Math.max(1, Math.min(200, sanitizeInt(repeat,1)))
    const results = Array.from({length:times}, ()=> rollDX(p.N, p.C, p.M))
    setHistory(h=> [{ id:Date.now(), mode:'command', input:`${p.N}dx${p.C}${p.M>=0?'+':''}${p.M}`, repeat:times, results }, ...h])
  }
  function doRollFromFields(){
    setError(''); const n = Math.max(0, sanitizeInt(N,0)); const c = clampCritical(C); const m = sanitizeInt(M,0)
    const times = Math.max(1, Math.min(200, sanitizeInt(repeat,1)))
    const results = Array.from({length:times}, ()=> rollDX(n, c, m))
    setHistory(h=> [{ id:Date.now(), mode:'fields', input:`${n}dx${c}${m>=0?'+':''}${m}`, repeat:times, results }, ...h])
  }
  function clearHistory(){ setHistory([]) }
  function copyResults(item){
    const lines = item.results.map((r,i)=>{
      const tiers = r.tiers.map((arr, idx)=> `  ${idx+1}차(${arr.length}d10): [${arr.join(', ')}]`).join('\n')
      const note = r.note ? `\n  * ${r.note}` : ''
      return [`# ${item.input} — Roll ${i+1}`, tiers, `=> ${summarize(r)}`, note].join('\n')
    })
    navigator.clipboard.writeText(lines.join('\n\n')); alert('결과를 클립보드에 복사했습니다.')
  }
  function stats(results){
    if(!results.length) return null; const totals = results.map(r=> r.total)
    const min = Math.min(...totals); const max = Math.max(...totals); const avg = Math.round(totals.reduce((a,b)=>a+b,0)/totals.length*1000)/1000
    return {min,max,avg}
  }
  return (<div style={{minHeight:'100vh', background:'#f8fafc', color:'#0f172a', padding:'16px'}}>
    <div style={{maxWidth:980, margin:'0 auto'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontSize:24, fontWeight:800}}>Double Cross Dice Roller</h1>
        <div style={{fontSize:12, color:'#475569'}}>크리티컬 하한: <b>2</b></div>
      </header>
      <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', marginTop:12}}>
        <div style={{background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}>
          <h2 style={{fontSize:16, fontWeight:700, marginBottom:8}}>명령어 입력</h2>
          <p style={{fontSize:13, color:'#475569'}}>형식: <code>NdxC±M</code> (예: <b>16dx7+2</b>, <b>8dx6</b>)</p>
          <div style={{display:'flex', gap:8}}>
            <input value={command} onChange={e=>setCommand(e.target.value)} placeholder="예: 12dx6+3"
                   style={{flex:1, border:'1px solid #cbd5e1', borderRadius:12, padding:'8px 10px'}}/>
            <button onClick={doRollFromCommand} style={{borderRadius:12, padding:'8px 12px', background:'#0f172a', color:'#fff'}}>굴리기</button>
          </div>
          {parsed ? <div style={{marginTop:8, fontSize:12, color:'#475569'}}>파싱됨: <b>{parsed.N}dx{parsed.C}{parsed.M>=0?'+':''}{parsed.M}</b></div>
                  : <div style={{marginTop:8, fontSize:12, color:'#dc2626'}}>올바른 형식이 아닙니다.</div>}
        </div>
        <div style={{background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:16}}>
          <h2 style={{fontSize:16, fontWeight:700, marginBottom:8}}>직접 입력</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
            <div><label style={{fontSize:11, color:'#64748b'}}>주사위 수 N</label>
              <input type="number" min={0} max={500} value={N} onChange={e=>setN(sanitizeInt(e.target.value,N))}
                     style={{width:'100%', border:'1px solid #cbd5e1', borderRadius:12, padding:'8px 10px'}}/></div>
            <div><label style={{fontSize:11, color:'#64748b'}}>크리티컬치 C</label>
              <input type="number" min={2} max={10} value={C} onChange={e=>setC(sanitizeInt(e.target.value,C))}
                     style={{width:'100%', border:'1px solid #cbd5e1', borderRadius:12, padding:'8px 10px'}}/></div>
            <div><label style={{fontSize:11, color:'#64748b'}}>보정치 M</label>
              <input type="number" value={M} onChange={e=>setM(sanitizeInt(e.target.value,M))}
                     style={{width:'100%', border:'1px solid #cbd5e1', borderRadius:12, padding:'8px 10px'}}/></div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginTop:12}}>
            <div><label style={{fontSize:11, color:'#64748b'}}>반복 횟수</label>
              <input type="number" min={1} max={200} value={repeat} onChange={e=>setRepeat(sanitizeInt(e.target.value,repeat))}
                     style={{width:'100%', border:'1px solid #cbd5e1', borderRadius:12, padding:'8px 10px'}}/></div>
            <div style={{display:'flex', alignItems:'end'}}>
              <button onClick={doRollFromFields} style={{width:'100%', borderRadius:12, padding:'8px 12px', background:'#0f172a', color:'#fff'}}>굴리기</button>
            </div>
          </div>
          <p style={{marginTop:8, fontSize:11, color:'#64748b'}}>* 크리티컬치는 자동으로 최소 2로 보정됩니다.</p>
        </div>
      </div>
      <div style={{background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:16, marginTop:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <h2 style={{fontSize:16, fontWeight:700}}>결과 히스토리</h2>
          <div style={{display:'flex', gap:8}}>
            <button onClick={clearHistory} style={{borderRadius:10, padding:'6px 10px', background:'#e2e8f0'}}>초기화</button>
          </div>
        </div>
        {error && <div style={{marginBottom:8, fontSize:12, color:'#dc2626'}}>{error}</div>}
        {history.length===0 ? <div style={{color:'#64748b', fontSize:13}}>아직 굴린 결과가 없습니다.</div> :
          <div style={{display:'grid', gap:8}}>
            {history.map(item=>{
              const st = (function(results){
                if(!results.length) return null
                const totals = results.map(r=> r.total)
                const min = Math.min(...totals); const max = Math.max(...totals); const avg = Math.round(totals.reduce((a,b)=>a+b,0)/totals.length*1000)/1000
                return {min,max,avg}
              })(item.results)
              return (
                <div key={item.id} style={{border:'1px solid #e2e8f0', borderRadius:12, padding:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8}}>
                    <div>
                      <div style={{fontWeight:700}}>{item.input}{item.repeat>1?` × ${item.repeat}`:''}</div>
                      {st && <div style={{fontSize:12, color:'#64748b'}}>요약: min {st.min} / avg {st.avg} / max {st.max}</div>}
                    </div>
                  </div>
                  <div style={{marginTop:8, display:'grid', gap:6}}>
                    {item.results.map((r,i)=>(
                      <details key={i} style={{background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:8}}>
                        <summary style={{cursor:'pointer'}}>
                          <span style={{fontWeight:600}}>Roll {i+1}</span>
                          <span style={{marginLeft:8, color:'#475569', fontSize:13}}>{summarize(r)}</span>
                          {r.note && <span style={{marginLeft:8, color:'#64748b', fontSize:12}}>({r.note})</span>}
                        </summary>
                        <div style={{marginTop:6, fontSize:13}}>
                          {r.tiers.map((arr, idx)=>(
                            <div key={idx} style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace'}}>{idx+1}차 ({arr.length}d10): [ {arr.join(', ')} ]</div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>}
      </div>
      <footer style={{fontSize:12, color:'#64748b', marginTop:12}}>
        규칙: 마지막 굴림의 <b>최고 눈</b> + (치명 연쇄 횟수 × 10) + 보정치 = 최종값. 크리티컬치 최소 2.
      </footer>
    </div>
  </div>)
}
