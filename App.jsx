import { useState, useMemo, useCallback } from "react";

/* ── constants ── */
const C = { bg:"#f8f9fc",card:"#fff",brd:"#e2e8f0",acc:"#0891b2",red:"#dc2626",warn:"#d97706",grn:"#059669",txt:"#1e293b",mut:"#64748b",dim:"#94a3b8",inp:"#f1f5f9",ib:"#cbd5e1",off:"#cbd5e1" };
const editBg = "#f0f4ff";
const editBrd = "1.5px dashed #c7d2fe";
const editHover = "#dbeafe";
const nameStyle = { background: editBg, borderBottom: editBrd, borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: "3px 3px 0 0", outline: "none", padding: "2px 4px", fontFamily: "monospace", transition: "all .15s" };
const selStyle = { padding: "2px 4px", fontSize: 10, fontFamily: "monospace", border: `1px solid ${editBrd.split(" ")[2]}`, borderRadius: 3, background: editBg, outline: "none", cursor: "pointer", fontWeight: 700 };
const RC = ["#0891b2","#7c3aed","#ea580c","#059669","#e11d48","#ca8a04"];
const SC = ["#1e40af","#166534","#1e3a5f","#1e40af","#166534","#1e3a5f"];
const SBG = ["#dbeafe","#d1fae5","#e0f2fe","#dbeafe","#d1fae5","#e0f2fe"];
const NW = 27;
const WL = ["2-Mar","9-Mar","16-Mar","23-Mar","30-Mar","6-Apr","13-Apr","20-Apr","27-Apr","4-May","11-May","18-May","25-May","1-Jun","8-Jun","15-Jun","22-Jun","29-Jun","6-Jul","13-Jul","20-Jul","27-Jul","3-Aug","10-Aug","17-Aug","24-Aug","31-Aug"];
const WP = ["—","—","—","—","—","—","—","40%","50%","60%","70%","70%","80%","90%","100%","100%","100%","100%","100%","100%","100%","100%","100%","100%","100%","100%","100%"];

/* ── initial data ── */
const mkSKUs = () => [
  { id:"s1",name:"BA-S35NC",pv:560000,on:true,vol:[0,0,0,0,0,0,0,3136,3920,4704,5488,5488,6272,7056,7840,7840,7840,7840,7840,7840,7840,7840,7840,7840,7840,7840] },
  { id:"s2",name:"BP-S35NC",pv:980000,on:true,vol:[0,0,0,0,0,0,0,5488,6860,8232,9604,9604,10976,12348,13720,13720,13720,13720,13720,13720,13720,13720,13720,13720,13720,13720] },
  { id:"s3",name:"PNM-S35NC",pv:12460000,on:true,vol:[0,0,0,0,0,0,50000,69776,87220,104664,122108,122108,139552,156936,174440,174440,174440,174440,174440,174440,174440,174440,174440,174440,174440,174440] },
  { id:"s4",name:"BA-S60NC",pv:630000,on:true,vol:[0,0,0,0,0,0,0,3528,4410,5292,6174,6174,7056,7938,8820,8820,8820,8820,8820,8820,8820,8820,8820,8820,8820,8820] },
  { id:"s5",name:"BP-S60NC",pv:1050000,on:true,vol:[0,0,0,0,0,0,0,5880,7350,8820,10290,10290,11760,13230,14700,14700,14700,14700,14700,14700,14700,14700,14700,14700,14700,14700] },
  { id:"s6",name:"PNM-S60NC",pv:13320000,on:true,vol:[0,0,0,50000,0,0,0,108192,135240,162288,189336,189336,216384,243432,270480,270480,270480,270480,270480,270480,270480,270480,270480,270480,270480,270480] },
];
const mkRMs = () => [
  { id:"rm1",name:"Top web 60ml (50002390)",u:"CM",stock:0,lt:4,sf:1.5,scrap:20 },
  { id:"rm2",name:"Top web 35ml (50002372)",u:"CM",stock:0,lt:4,sf:1.5,scrap:20 },
  { id:"rm3",name:"Bottom Web (50002370)",u:"CM",stock:0,lt:4,sf:1.5,scrap:20 },
];
const mkBOM = () => ({
  s1:{},s2:{},s3:{rm2:2.54,rm3:2.54},
  s4:{},s5:{},s6:{rm1:3.65,rm3:3.65},
});
const mkPOs = () => ({
  rm1:[{q:1540000,w:2,lt:2,on:true},{q:9500000,w:1,lt:8,on:true},{q:10000000,w:8,lt:8,on:true}],
  rm2:[{q:831200,w:2,lt:2,on:true},{q:4500000,w:2,lt:8,on:true},{q:4800000,w:10,lt:8,on:true}],
  rm3:[{q:1950800,w:2,lt:2,on:true},{q:10000000,w:1,lt:8,on:true},{q:10000000,w:5,lt:8,on:true}],
});

/* ── simulation ── */
function sim(rms, skus, bom, pos) {
  return rms.map(rm => {
    const wcs = Array.from({ length: NW }, (_, w) => {
      let c = 0;
      skus.forEach(s => {
        if (!s.on) return;
        c += (s.vol[w] || 0) * (bom[s.id]?.[rm.id] || 0) * (1 + (rm.scrap || 0) / 100);
      });
      return c;
    });
    const avg = wcs.reduce((a, b) => a + b, 0) / NW;
    const plist = pos[rm.id] || [];
    let inv = rm.stock, so = 0, soWk = -1;
    const data = [];
    for (let w = 0; w < NW; w++) {
      let poAdded = 0;
      plist.forEach(p => { if (p.on !== false && (p.w + (p.lt || 0)) === w + 1) { inv += p.q; poAdded += p.q; } });
      const invPre = inv;
      const wc = wcs[w];
      const rop = wc * rm.lt * rm.sf;
      inv -= wc;
      if (inv < 0) { so++; if (soWk === -1) soWk = w; }
      data.push({ wk: w + 1, inv: Math.round(inv), invPre: Math.round(invPre), poAdded: Math.round(poAdded), rop: Math.round(rop), wc: Math.round(wc) });
    }
    return { data, so, soWk, avg, wcs };
  });
}

/* ── helpers ── */
function fN(n) { return Number(n || 0).toLocaleString("en-US"); }
function fS(n) { n = n || 0; if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k"; return n.toLocaleString("en-US"); }

function Toggle({ on, fn, color, sm }) {
  const w = sm ? 30 : 36, h = sm ? 17 : 20, d = sm ? 12 : 14;
  return (
    <div onClick={fn} style={{ width: w, height: h, borderRadius: h / 2, background: on ? color : C.off, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ width: d, height: d, borderRadius: "50%", background: "#fff", position: "absolute", top: (h - d) / 2, left: on ? w - d - (h - d) / 2 : (h - d) / 2, transition: "left .2s", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
    </div>
  );
}

function Cell({ val, onSave, fmt, color, w: wd }) {
  const [ed, setEd] = useState(false);
  const [dr, setDr] = useState("");
  const display = fmt ? fmt(val) : String(val);
  if (ed) return (
    <input type="text" autoFocus value={dr}
      onChange={e => setDr(e.target.value)}
      onBlur={() => { setEd(false); onSave(dr); }}
      onKeyDown={e => e.key === "Enter" && e.target.blur()}
      style={{ width: wd || 70, padding: "2px 5px", fontSize: 11, fontFamily: "monospace", border: `2px solid ${color || C.acc}`, borderRadius: 3, textAlign: "right", outline: "none", background: "#fff" }}
    />
  );
  return (
    <div onClick={() => { setDr(String(val)); setEd(true); }}
      style={{ padding: "2px 5px", borderRadius: 3, cursor: "pointer", fontWeight: 600, color: color || C.txt, minHeight: 20, display: "flex", alignItems: "center", justifyContent: "flex-end", background: "#f0f4ff", borderBottom: "1.5px dashed #c7d2fe", transition: "all .15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderBottomColor = "#818cf8"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.borderBottomColor = "#c7d2fe"; }}>
      {display}
    </div>
  );
}

function KPI({ label, value, unit, bad }) {
  const c = bad === 2 ? C.red : bad === 1 ? C.warn : C.grn;
  return (
    <div style={{ padding: "10px 12px", background: `${c}08`, borderRadius: 8, borderLeft: `3px solid ${c}` }}>
      <div style={{ fontSize: 9, color: C.mut, textTransform: "uppercase", letterSpacing: 1, fontFamily: "monospace" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: c, fontFamily: "monospace" }}>{value}<span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>{unit}</span></div>
    </div>
  );
}

/* ── Ramp-Up Grid ── */
function RampGrid({ skus, set, mob }) {
  const [pqOpen, setPqOpen] = useState(true);
  const tots = useMemo(() => { const t = Array(NW).fill(0); skus.forEach(s => { if (s.on) s.vol.forEach((v, i) => { t[i] += v; }); }); return t; }, [skus]);
  const visCols = pqOpen ? WL.map((_, i) => i) : WL.map((_, i) => i).filter(i => i >= 7);
  return (
    <div style={{ overflowX: "auto", maxHeight: 400, border: `1px solid ${C.brd}`, borderRadius: 8 }}>
      <table style={{ borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace", minWidth: "100%" }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
          <tr style={{ background: "#0f172a" }}>
            <th colSpan={2} style={{ position: "sticky", left: 0, zIndex: 3, background: "#0f172a" }}></th>
            <th colSpan={pqOpen ? 7 : 1} onClick={() => setPqOpen(p => !p)}
              style={{ padding: "4px 6px", textAlign: "center", fontSize: 9, fontWeight: 700, color: "#a78bfa", letterSpacing: 2, borderBottom: "2px solid #7c3aed", borderRight: "2px solid #334155", cursor: "pointer", userSelect: "none", transition: "all .2s", minWidth: pqOpen ? undefined : 30 }}>
              {pqOpen ? <>▼ 🔬 PQ VALIDATION</> : "▶"}
            </th>
            <th colSpan={19} style={{ padding: "4px 6px", textAlign: "center", fontSize: 9, fontWeight: 700, color: "#22d3ee", letterSpacing: 2, borderBottom: "2px solid #0891b2" }}>📊 PRODUCTION RAMP-UP</th>
          </tr>
          <tr style={{ background: "#1e293b" }}>
            <th style={{ padding: "6px 10px", color: "#fff", fontWeight: 700, textAlign: "left", position: "sticky", left: 0, zIndex: 3, background: "#1e293b", minWidth: 150, fontSize: 10 }}>ESTIMATED VOLUMES</th>
            <th style={{ padding: "6px 8px", color: "#94a3b8", fontWeight: 600, textAlign: "right", minWidth: 75, fontSize: 10 }}>Prev Vol</th>
            {visCols.map(i => <th key={i} style={{ padding: "4px 6px", color: "#fff", fontWeight: 600, textAlign: "right", minWidth: 72, fontSize: 9, borderRight: i === 6 ? "2px solid #334155" : "none", background: i < 7 ? "#1e1b4b" : "#1e293b" }}><div>{WP[i]}</div><div style={{ color: "#94a3b8", fontWeight: 400 }}>{WL[i]}</div></th>)}
          </tr>
        </thead>
        <tbody>
          {skus.map((s, si) => (
            <tr key={s.id} style={{ background: s.on ? SBG[si % 6] : "#f8f9fa" }}>
              <td style={{ padding: "5px 10px", borderBottom: `1px solid ${C.brd}`, position: "sticky", left: 0, zIndex: 1, background: s.on ? SBG[si % 6] : "#f8f9fa" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Toggle on={s.on} fn={() => set(p => p.map((x, i) => i === si ? { ...x, on: !x.on } : x))} color={SC[si % 6]} sm />
                  <input type="text" value={s.name} onChange={e => set(p => p.map((x, i) => i === si ? { ...x, name: e.target.value } : x))}
                    style={{ ...nameStyle, fontWeight: 700, fontSize: 11, color: s.on ? SC[si % 6] : C.off, width: 100 }} />
                </div>
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: `1px solid ${C.brd}`, color: C.mut, fontWeight: 600 }}>{fS(s.pv)}</td>
              {visCols.map(wi => (
                <td key={wi} style={{ padding: "2px 3px", borderBottom: `1px solid ${C.brd}`, textAlign: "right", borderRight: wi === 6 ? "2px solid #e2e8f0" : "none", background: wi < 7 ? "#f5f3ff" : "transparent" }}>
                  <Cell val={s.vol[wi]} fmt={fS} onSave={d => { const n = parseInt(d.replace(/,/g, "")); set(p => p.map((x, i) => { if (i !== si) return x; const nv = [...x.vol]; nv[wi] = isNaN(n) ? 0 : Math.max(0, n); return { ...x, vol: nv }; })); }} w="100%" />
                </td>
              ))}
            </tr>
          ))}
          <tr style={{ background: "#f1f5f9", fontWeight: 800 }}>
            <td style={{ padding: "5px 10px", borderTop: `2px solid ${C.brd}`, position: "sticky", left: 0, zIndex: 1, background: "#f1f5f9", fontSize: 10 }}>TOTAL</td>
            <td style={{ borderTop: `2px solid ${C.brd}` }}></td>
            {visCols.map(i => <td key={i} style={{ padding: "5px 4px", borderTop: `2px solid ${C.brd}`, textAlign: "right" }}>{fS(tots[i])}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ── BOM Matrix ── */
function BOMGrid({ skus, rms, bom, setBom, uRM }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
        <thead><tr>
          <th style={{ padding: "6px 8px", textAlign: "left", color: C.dim, fontSize: 9, borderBottom: `1px solid ${C.brd}` }}>BOM QTY / FG piece</th>
          {rms.map((r, i) => (
            <th key={r.id} style={{ padding: "6px 4px", textAlign: "center", borderBottom: `1px solid ${C.brd}`, minWidth: 110 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: RC[i % 6], flexShrink: 0 }} />
                <input type="text" value={r.name} onChange={e => uRM(i, "name", e.target.value)}
                  style={{ ...nameStyle, fontSize: 10, color: C.mut, fontWeight: 600, width: "100%", textAlign: "center" }} />
              </div>
              <select value={r.u} onChange={e => uRM(i, "u", e.target.value)}
                style={{ ...selStyle, marginTop: 2, fontSize: 9, color: C.dim }}>
                <option value="CM">CM</option><option value="M">M</option>
              </select>
            </th>
          ))}
        </tr></thead>
        <tbody>
          {skus.map((s, si) => (
            <tr key={s.id} style={{ background: s.on ? "transparent" : C.inp, opacity: s.on ? 1 : .4 }}>
              <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.brd}`, fontWeight: 600, color: SC[si % 6] }}>{s.name}</td>
              {rms.map((r, ri) => {
                const v = bom[s.id]?.[r.id] || 0;
                return (
                  <td key={r.id} style={{ padding: "3px 4px", borderBottom: `1px solid ${C.brd}`, textAlign: "center" }}>
                    <Cell val={v} fmt={x => x > 0 ? (x < 0.01 ? x.toFixed(4) : x < 1 ? x.toFixed(3) : String(x)) : "—"}
                      color={v > 0 ? C.txt : C.dim} w={60}
                      onSave={d => { const n = parseFloat(d); setBom(p => { const nx = { ...p, [s.id]: { ...p[s.id] } }; if (isNaN(n) || n === 0) delete nx[s.id][r.id]; else nx[s.id][r.id] = n; return nx; }); }} />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr style={{ background: `${C.warn}08`, borderTop: `2px solid ${C.brd}` }}>
            <td style={{ padding: "6px 8px", fontWeight: 700, fontSize: 10, color: C.warn }}>SCRAP %</td>
            {rms.map((r, i) => (
              <td key={r.id} style={{ padding: "4px 4px", textAlign: "center" }}>
                <Cell val={r.scrap || 0} fmt={x => x + "%"} color={C.warn} w={55}
                  onSave={d => { const n = parseFloat(d.replace("%", "")); uRM(i, "scrap", isNaN(n) ? 0 : Math.max(0, Math.min(100, n))); }} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ── PO Schedule ── */
function POGrid({ rms, pos, setPos, uRM }) {
  return (
    <div>
      {rms.map((rm, ri) => {
        const col = RC[ri % 6];
        const list = pos[rm.id] || [];
        return (
          <div key={rm.id} style={{ marginBottom: 14, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `${col}06` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }} />
                <input type="text" value={rm.name} onChange={e => uRM(ri, "name", e.target.value)}
                  style={{ ...nameStyle, fontSize: 12, fontWeight: 700, color: C.txt, width: 200 }} />
                <select value={rm.u} onChange={e => uRM(ri, "u", e.target.value)}
                  style={{ ...selStyle, color: C.txt }}>
                  <option value="CM">CM</option><option value="M">M</option>
                </select>
              </div>
              <button onClick={() => setPos(p => ({ ...p, [rm.id]: [...(p[rm.id] || []), { q: 100000, w: 1, lt: 4, on: true }] }))}
                style={{ padding: "4px 12px", fontSize: 10, fontFamily: "monospace", fontWeight: 700, background: col, color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>+ PO</button>
            </div>
            {list.length === 0
              ? <div style={{ padding: 14, textAlign: "center", color: C.dim, fontSize: 11, fontFamily: "monospace" }}>No POs. Click "+ PO" to add.</div>
              : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
                <thead><tr style={{ background: C.inp }}>
                  <th style={{ padding: "5px 6px", textAlign: "center", color: C.dim, fontSize: 9, width: 30 }}>ON</th>
                  <th style={{ padding: "5px 10px", textAlign: "left", color: C.dim, fontSize: 9 }}>PO #</th>
                  <th style={{ padding: "5px 10px", textAlign: "right", color: C.dim, fontSize: 9 }}>Qty ({rm.u})</th>
                  <th style={{ padding: "5px 10px", textAlign: "center", color: C.dim, fontSize: 9 }}>Order Date</th>
                  <th style={{ padding: "5px 10px", textAlign: "center", color: C.dim, fontSize: 9 }}>Lead Time</th>
                  <th style={{ padding: "5px 10px", textAlign: "center", color: C.dim, fontSize: 9 }}>Est. Arrival</th>
                  <th style={{ width: 30 }}></th>
                </tr></thead>
                <tbody>
                  {list.map((po, pi) => {
                    const arrWk = po.w + (po.lt || 0);
                    const arrLabel = arrWk >= 1 && arrWk <= NW ? WL[arrWk - 1] : arrWk > NW ? `S${arrWk} (outside)` : "—";
                    const arrColor = arrWk > NW ? C.warn : C.grn;
                    const isOn = po.on !== false;
                    const rowOpacity = isOn ? 1 : 0.4;
                    return (
                    <tr key={pi} style={{ borderBottom: `1px solid ${C.brd}`, opacity: rowOpacity, transition: "opacity .2s" }}>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>
                        <input type="checkbox" checked={isOn}
                          onChange={() => setPos(p => ({ ...p, [rm.id]: (p[rm.id] || []).map((x, i) => i === pi ? { ...x, on: !isOn } : x) }))}
                          style={{ cursor: "pointer", width: 16, height: 16, accentColor: col }} />
                      </td>
                      <td style={{ padding: "5px 10px", color: col, fontWeight: 700 }}>PO-{pi + 1}</td>
                      <td style={{ padding: "3px 10px", textAlign: "right" }}>
                        <Cell val={po.q} fmt={fN} color={C.txt} w={90}
                          onSave={d => { const n = parseFloat(d.replace(/,/g, "")); setPos(p => ({ ...p, [rm.id]: (p[rm.id] || []).map((x, i) => i === pi ? { ...x, q: isNaN(n) ? 0 : Math.max(0, n) } : x) })); }} />
                      </td>
                      <td style={{ padding: "3px 10px", textAlign: "center" }}>
                        <select value={po.w} onChange={e => { const n = parseInt(e.target.value); setPos(p => ({ ...p, [rm.id]: (p[rm.id] || []).map((x, i) => i === pi ? { ...x, w: n } : x) })); }}
                          style={{ ...selStyle, fontSize: 10, color: C.acc, minWidth: 90 }}>
                          {WL.map((lbl, wi) => <option key={wi} value={wi + 1}>{lbl}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "3px 10px", textAlign: "center" }}>
                        <select value={po.lt || 4} onChange={e => { const n = parseInt(e.target.value); setPos(p => ({ ...p, [rm.id]: (p[rm.id] || []).map((x, i) => i === pi ? { ...x, lt: n } : x) })); }}
                          style={{ ...selStyle, fontSize: 10, color: C.mut, minWidth: 65 }}>
                          {Array.from({ length: 27 }, (_, i) => <option key={i} value={i + 1}>{i + 1} wks</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "3px 10px", textAlign: "center", fontWeight: 700, fontSize: 10, color: isOn ? arrColor : C.off }}>
                        {arrLabel}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span onClick={() => setPos(p => ({ ...p, [rm.id]: (p[rm.id] || []).filter((_, i) => i !== pi) }))}
                          style={{ cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 14 }}>×</span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            }
          </div>
        );
      })}
    </div>
  );
}

/* ── Chart ── */
function Chart({ res, rms, mx, mn, mob }) {
  const [hov, setHov] = useState(null);
  const w = 920, h = mob ? 300 : 390, p = { t: 14, r: 14, b: 50, l: mob ? 42 : 52 };
  const cw = w - p.l - p.r, ch = h - p.t - p.b;
  const xT = []; for (let i = 1; i <= NW; i += (mob ? 2 : 1)) xT.push(i);
  const range = mx - mn || 1;
  const yToScreen = v => p.t + ch - ((v - mn) / range) * ch;
  const ys = Math.ceil(mx / 5 / 1000) * 1000 || 1000; const yT = []; for (let i = Math.floor(mn / ys) * ys; i <= mx; i += ys) yT.push(i);
  const ln = pts => pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ");
  const colW = cw / NW;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", maxHeight: 450 }} onMouseLeave={() => setHov(null)}>
      <rect x={p.l} y={p.t} width={cw} height={ch} fill="#fafbfe" rx="4" />
      {yT.map(v => { const y = yToScreen(v); return (<g key={v}><line x1={p.l} y1={y} x2={p.l + cw} y2={y} stroke={v === 0 && mn < 0 ? "#dc2626" : C.brd} strokeWidth={v === 0 && mn < 0 ? "1" : ".5"} /><text x={p.l - 6} y={y + 3} textAnchor="end" fill={v < 0 ? "#dc2626" : C.dim} fontSize="8" fontFamily="monospace">{fS(v)}</text></g>); })}
      {xT.map(wk => { const x = p.l + ((wk - 1) / (NW - 1)) * cw; return (<g key={wk}><line x1={x} y1={p.t} x2={x} y2={p.t + ch} stroke={C.brd} strokeWidth=".3" /><text x={x} y={p.t + ch + 10} textAnchor="end" fill={wk <= 7 ? "#a78bfa" : C.dim} fontSize="7" fontFamily="monospace" transform={`rotate(-45,${x},${p.t + ch + 10})`}>{WL[wk - 1] || "S" + wk}</text></g>); })}
      {res.map((r, i) => {
        if (r.avg === 0) return null;
        const col = RC[i % 6];
        const pts = r.data.map((d, j) => ({ x: p.l + (j / (NW - 1)) * cw, y: yToScreen(d.inv) }));
        const zeroY = yToScreen(0);
        const area = pts.map((pt, j) => `${j === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ") + ` L${pts[pts.length-1].x},${zeroY} L${pts[0].x},${zeroY} Z`;
        return (<g key={i}>
          {(() => {
            const segs = []; let cur = [pts[0]]; let isPos = r.data[0].inv >= 0;
            for (let k = 1; k < pts.length; k++) {
              const nPos = r.data[k].inv >= 0;
              if (nPos !== isPos) {
                const p1 = pts[k-1], p2 = pts[k], d1 = r.data[k-1].inv, d2 = r.data[k].inv;
                const t = d1 / (d1 - d2);
                const zx = p1.x + (p2.x - p1.x) * t, zy = p1.y + (p2.y - p1.y) * t;
                cur.push({x: zx, y: zy}); segs.push({pts: cur, pos: isPos}); cur = [{x: zx, y: zy}]; isPos = nPos;
              }
              cur.push(pts[k]);
            }
            segs.push({pts: cur, pos: isPos});
            const zY = yToScreen(0);
            return segs.map((sg, si) => {
              const d = sg.pts.map((pt, j) => `${j===0?"M":"L"}${pt.x},${pt.y}`).join(" ");
              const aFill = d + ` L${sg.pts[sg.pts.length-1].x},${zY} L${sg.pts[0].x},${zY} Z`;
              return (<g key={si}><path d={aFill} fill={sg.pos ? col : "#dc2626"} opacity=".08" /><path d={d} fill="none" stroke={sg.pos ? col : "#dc2626"} strokeWidth="2" opacity=".85" /></g>);
            });
          })()}
          {r.data.map((d, j) => <circle key={j} cx={p.l + (j / (NW - 1)) * cw} cy={yToScreen(d.inv)} r="2.5" fill={d.inv < 0 ? "#dc2626" : col} opacity=".6" />)}
          {r.data.map((d, j) => d.inv < 0 ? <g key={"so"+j}><rect x={p.l + (j / (NW - 1)) * cw - colW/2} y={zeroY} width={colW} height={yToScreen(d.inv) - zeroY} fill="#dc2626" opacity=".06" /></g> : null)}
        </g>);
      })}
      {/* Run-out zones */}
      {res.map((r, i) => {
        if (r.so === 0) return null;
        return r.data.map((d, j) => {
          if (d.inv > 0 || d.wc === 0) return null;
          const x = p.l + (j / (NW - 1)) * cw;
          return <rect key={`so-${i}-${j}`} x={x - colW / 2} y={p.t} width={colW} height={ch} fill="#dc2626" opacity=".06" />;
        });
      })}
      {/* Hover zones */}
      {Array.from({ length: NW }, (_, i) => {
        const x = p.l + (i / (NW - 1)) * cw - colW / 2;
        return <rect key={i} x={x} y={p.t} width={colW} height={ch} fill="transparent" onMouseEnter={() => setHov(i)} onTouchStart={() => setHov(i)} style={{ cursor: "crosshair" }} />;
      })}
      {/* Hover indicator */}
      {hov !== null && <>
        <line x1={p.l + (hov / (NW - 1)) * cw} y1={p.t} x2={p.l + (hov / (NW - 1)) * cw} y2={p.t + ch} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
        {res.map((r, i) => {
          if (r.avg === 0) return null;
          const d = r.data[hov];
          if (!d) return null;
          const cy = yToScreen(d.inv);
          return <circle key={i} cx={p.l + (hov / (NW - 1)) * cw} cy={cy} r="5" fill={RC[i % 6]} stroke="#fff" strokeWidth="2" />;
        })}
        {(() => {
          const tx = p.l + (hov / (NW - 1)) * cw;
          const flipX = tx > p.l + cw * 0.7;
          const bx = flipX ? tx - 180 : tx + 10;
          const activeRms = rms.map((rm, i) => ({ rm, r: res[i], i })).filter(x => x.r.avg > 0);
          const bh = 20 + activeRms.length * 28;
          return (
            <g>
              <rect x={bx} y={p.t + 4} width={175} height={bh} rx="4" fill="#1e293b" opacity=".94" />
              <text x={bx + 8} y={p.t + 16} fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="700">{WL[hov]} — Week {hov + 1}</text>
              {activeRms.map(({ rm, r, i: ri }, idx) => {
                const d = r.data[hov];
                return (
                  <g key={ri}>
                    <rect x={bx + 6} y={p.t + 22 + idx * 28} width="6" height="6" rx="1" fill={RC[ri % 6]} />
                    <text x={bx + 16} y={p.t + 28 + idx * 28} fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="600">{rm.name.split("(")[0].trim()}</text>
                    <text x={bx + 8} y={p.t + 39 + idx * 28} fill="#94a3b8" fontSize="7" fontFamily="monospace">
                      {d.wc > 0 ? "▼" + fN(d.wc) : "—"} → Inv: </text>
                    <text x={bx + 167} y={p.t + 39 + idx * 28} fill={d.inv > 0 ? "#22d3ee" : "#ef4444"} fontSize="8" fontFamily="monospace" textAnchor="end" fontWeight="700">{fN(d.inv)}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </>}
    </svg>
  );
}

/* ── RM Detail Chart (individual) ── */
function RMDetailChart({ rm, ri, r, mob, skus, bom }) {
  const [hov, setHov] = useState(null);
  const col = RC[ri % 6];
  const w = 920, h = mob ? 220 : 280, p = { t: 14, r: 14, b: 50, l: mob ? 42 : 56 };
  const cw = w - p.l - p.r, ch = h - p.t - p.b;
  const xT = []; for (let i = 1; i <= NW; i += (mob ? 2 : 1)) xT.push(i);
  const maxWc = Math.max(...r.data.map(d => d.wc), 1);
  const maxInv = Math.max(...r.data.map(d => d.inv), 1);
  const minInv = Math.min(...r.data.map(d => d.inv), 0);
  const scaleTop = Math.max(maxWc, maxInv) * 1.05;
  const scaleBot = minInv * 1.1;
  const scale = scaleTop - scaleBot || 1;
  const yMap = v => p.t + ch - ((v - scaleBot) / scale) * ch;
  const ys = Math.ceil(scaleTop / 5 / 1000) * 1000 || 1000;
  const yT = []; for (let i = Math.floor(scaleBot / ys) * ys; i <= scaleTop; i += ys) yT.push(i);
  const barW = (cw / NW) * 0.6;
  const pts = r.data.map((d, j) => ({ x: p.l + (j / (NW - 1)) * cw, y: yMap(d.inv) }));
  const ln = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ");
  const areaPath = ln + ` L${pts[pts.length-1].x},${yMap(0)} L${pts[0].x},${yMap(0)} Z`;
  return (
    <div style={{ marginBottom: 14, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", gap: 8, background: `${col}06`, flexWrap: "wrap" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: col }} />
        <span style={{ fontWeight: 800, fontSize: 13, fontFamily: "monospace", color: C.txt }}>{rm.name}</span>
        <span style={{ fontSize: 10, color: C.mut, fontFamily: "monospace" }}>({rm.u})</span>
        {r.so > 0 && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "#fef2f2", color: C.red, fontWeight: 700, fontFamily: "monospace" }}>⚠ Runs out {WL[r.soWk]}</span>}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 12, fontSize: 9, fontFamily: "monospace" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 14, height: 8, borderRadius: 2, background: "#f59e0b", opacity: 0.5 }} /><span style={{ color: C.mut }}>Consumption/wk ({rm.u})</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 14, height: 3, borderRadius: 2, background: "#059669" }} /><span style={{ color: C.mut }}>Inventory ({rm.u})</span></div>
        </div>
      </div>
      <div style={{ padding: "8px 12px" }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }} onMouseLeave={() => setHov(null)}>
          <rect x={p.l} y={p.t} width={cw} height={ch} fill="#fafbfe" rx="4" />
          {yT.map(v => { const y = yMap(v); return (<g key={v}><line x1={p.l} y1={y} x2={p.l + cw} y2={y} stroke={C.brd} strokeWidth=".5" /><text x={p.l - 6} y={y + 3} textAnchor="end" fill={v < 0 ? "#dc2626" : C.dim} fontSize="8" fontFamily="monospace">{fS(v)}</text></g>); })}
          {xT.map(wk => { const x = p.l + ((wk - 1) / (NW - 1)) * cw; return (<g key={wk}><line x1={x} y1={p.t} x2={x} y2={p.t + ch} stroke={C.brd} strokeWidth=".3" /><text x={x} y={p.t + ch + 10} textAnchor="end" fill={wk <= 7 ? "#a78bfa" : C.dim} fontSize="7" fontFamily="monospace" transform={`rotate(-45,${x},${p.t + ch + 10})`}>{WL[wk - 1]}</text></g>); })}
          {r.data.map((d, j) => { const x = p.l + (j / (NW - 1)) * cw; return <rect key={"b"+j} x={x - barW/2} y={yMap(d.wc)} width={barW} height={Math.max(yMap(0) - yMap(d.wc), 0)} fill="#f59e0b" opacity={hov === j ? 0.5 : 0.25} rx="2" />; })}
          {(() => {
            const segs = []; let cur = [pts[0]]; let pos = r.data[0].inv >= 0;
            for (let k = 1; k < pts.length; k++) {
              const nPos = r.data[k].inv >= 0;
              if (nPos !== pos) {
                const p1 = pts[k-1], p2 = pts[k], d1 = r.data[k-1].inv, d2 = r.data[k].inv;
                const t = d1 / (d1 - d2);
                const zx = p1.x + (p2.x - p1.x) * t, zy = p1.y + (p2.y - p1.y) * t;
                cur.push({x: zx, y: zy});
                segs.push({pts: cur, pos});
                cur = [{x: zx, y: zy}];
                pos = nPos;
              }
              cur.push(pts[k]);
            }
            segs.push({pts: cur, pos});
            const zY = yMap(0);
            return segs.map((sg, si) => {
              const d = sg.pts.map((pt, i) => `${i===0?"M":"L"}${pt.x},${pt.y}`).join(" ");
              const aFill = d + ` L${sg.pts[sg.pts.length-1].x},${zY} L${sg.pts[0].x},${zY} Z`;
              return (<g key={si}>
                <path d={aFill} fill={sg.pos ? "#059669" : "#dc2626"} opacity=".08" />
                <path d={d} fill="none" stroke={sg.pos ? "#059669" : "#dc2626"} strokeWidth="2.5" opacity=".9" />
              </g>);
            });
          })()}
          {r.data.map((d, j) => <circle key={j} cx={p.l + (j / (NW - 1)) * cw} cy={yMap(d.inv)} r="3" fill={d.inv < 0 ? "#dc2626" : "#059669"} opacity=".7" />)}
          {r.data.map((d, j) => d.inv <= 0 && d.wc > 0 ? <g key={"ro"+j}><circle cx={p.l + (j / (NW - 1)) * cw} cy={yMap(0)} r="5" fill="#dc2626" opacity=".15" /><text x={p.l + (j / (NW - 1)) * cw} y={yMap(0) + 1} textAnchor="middle" fill="#dc2626" fontSize="8" fontWeight="700" dominantBaseline="middle">x</text></g> : null)}
          {Array.from({ length: NW }, (_, i) => { const x = p.l + (i / (NW - 1)) * cw; const colWid = cw / NW; return <rect key={i} x={x - colWid/2} y={p.t} width={colWid} height={ch} fill="transparent" onMouseEnter={() => setHov(i)} onTouchStart={() => setHov(i)} style={{ cursor: "crosshair" }} />; })}
          {hov !== null && (() => { const d = r.data[hov]; if (!d) return null; const tx = p.l + (hov / (NW - 1)) * cw; const flipX = tx > p.l + cw * 0.65; const usedSkus = skus.filter(s => s.on && bom[s.id] && bom[s.id][rm.id] > 0); const bh = 120 + usedSkus.length * 20; const bw = 290; const bx = flipX ? tx - bw - 8 : tx + 12; return (<g><line x1={tx} y1={p.t} x2={tx} y2={p.t + ch} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" /><circle cx={tx} cy={p.t + ch - (d.inv / scale) * ch} r="6" fill={col} stroke="#fff" strokeWidth="2" /><rect x={bx} y={p.t + 2} width={bw} height={bh} rx="6" fill="#1e293b" opacity=".95" /><text x={bx + bw/2} y={p.t + 18} fill="#e2e8f0" fontSize="11" fontFamily="monospace" fontWeight="800" textAnchor="middle">{WL[hov]} — Week {hov + 1}</text><line x1={bx + 10} y1={p.t + 26} x2={bx + bw - 10} y2={p.t + 26} stroke="#334155" strokeWidth=".5" /><text x={bx + 10} y={p.t + 40} fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="1">RAW MATERIAL</text><text x={bx + 14} y={p.t + 55} fill="#94a3b8" fontSize="9" fontFamily="monospace">PO Received:</text><text x={bx + bw - 12} y={p.t + 55} fill={d.poAdded > 0 ? "#34d399" : "#64748b"} fontSize="10" fontFamily="monospace" textAnchor="end" fontWeight="700">{d.poAdded > 0 ? "+" + fN(d.poAdded) + " " + rm.u : "—"}</text><text x={bx + 14} y={p.t + 70} fill="#94a3b8" fontSize="9" fontFamily="monospace">Consumption:</text><text x={bx + bw - 12} y={p.t + 70} fill={d.wc > 0 ? "#fbbf24" : "#64748b"} fontSize="10" fontFamily="monospace" textAnchor="end" fontWeight="700">{d.wc > 0 ? "-" + fN(d.wc) + " " + rm.u : "—"}</text><text x={bx + 14} y={p.t + 85} fill="#e2e8f0" fontSize="9" fontFamily="monospace" fontWeight="600">Final Inventory:</text><text x={bx + bw - 12} y={p.t + 85} fill={d.inv > 0 ? "#22d3ee" : "#ef4444"} fontSize="11" fontFamily="monospace" textAnchor="end" fontWeight="800">{fN(d.inv)} {rm.u}</text><line x1={bx + 10} y1={p.t + 93} x2={bx + bw - 10} y2={p.t + 93} stroke="#334155" strokeWidth=".5" /><text x={bx + 10} y={p.t + 107} fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="1">FINISHED GOODS</text>{usedSkus.map((s, si) => { const skuVol = s.vol[hov] || 0; const skuIdx = skus.indexOf(s); return (<g key={s.id}><rect x={bx + 12} y={p.t + 114 + si * 20} width="6" height="6" rx="1" fill={SC[skuIdx % 6]} /><text x={bx + 22} y={p.t + 120 + si * 20} fill="#e2e8f0" fontSize="9" fontFamily="monospace">{s.name}</text><text x={bx + bw - 12} y={p.t + 120 + si * 20} fill={skuVol > 0 ? "#a78bfa" : "#64748b"} fontSize="10" fontFamily="monospace" textAnchor="end" fontWeight="700">{skuVol > 0 ? fN(skuVol) + " ea (" + fN(Math.round(skuVol * (bom[s.id]?.[rm.id] || 0) * (1 + (rm.scrap || 0) / 100))) + " " + rm.u + ")" : "—"}</text></g>); })}</g>); })()}
        </svg>
      </div>
    </div>
  );
}

/* ── MAIN ── */
export default function App() {
  const [skus, setSkus] = useState(mkSKUs);
  const [rms, setRms] = useState(mkRMs);
  const [bom, setBom] = useState(mkBOM);
  const [pos, setPos] = useState(mkPOs);
  const [tab, setTab] = useState("rampup");
  const [mob, setMob] = useState(false);
  const [simView, setSimView] = useState("individual");

  const uRM = useCallback((i, f, v) => {
    if (f === "u") {
      /* auto-convert CM <-> M */
      const old = rms[i].u;
      if (old === v) return;
      const fac = (old === "CM" && v === "M") ? 0.01 : (old === "M" && v === "CM") ? 100 : 1;
      setRms(p => p.map((x, j) => j !== i ? x : { ...x, u: v, stock: Math.round(x.stock * fac * 1e3) / 1e3 }));
      const rid = rms[i].id;
      setBom(p => { const n = { ...p }; Object.keys(n).forEach(k => { if (n[k][rid] != null) n[k] = { ...n[k], [rid]: Math.round(n[k][rid] * fac * 1e5) / 1e5 }; }); return n; });
      setPos(p => { if (!p[rid]) return p; return { ...p, [rid]: p[rid].map(po => ({ ...po, q: Math.round(po.q * fac * 1e3) / 1e3 })) }; });
    } else {
      setRms(p => p.map((x, j) => j === i ? { ...x, [f]: v } : x));
    }
  }, [rms]);

  const addRM = () => { const id = "rm" + Date.now(); setRms(p => [...p, { id, name: "New Material", u: "CM", stock: 0, lt: 4, sf: 1.5, scrap: 0 }]); setPos(p => ({ ...p, [id]: [{ q: 100000, w: 1, lt: 4, on: true }] })); };
  const delRM = i => { const id = rms[i].id; setRms(p => p.filter((_, j) => j !== i)); setBom(p => { const n = { ...p }; Object.keys(n).forEach(k => { const b = { ...n[k] }; delete b[id]; n[k] = b; }); return n; }); setPos(p => { const n = { ...p }; delete n[id]; return n; }); };

  const res = useMemo(() => sim(rms, skus, bom, pos), [rms, skus, bom, pos]);
  const actR = res.filter(r => r.avg > 0);
  const mx = useMemo(() => { let m = 0; res.forEach(r => r.data.forEach(d => { if (d.inv > m) m = d.inv; })); return Math.max(m, 1000); }, [res]);
  const mn = useMemo(() => { let m = 0; res.forEach(r => r.data.forEach(d => { if (d.inv < m) m = d.inv; })); return m; }, [res]);
  const totSO = actR.reduce((s, r) => s + r.so, 0);
  const risk = actR.filter(r => r.so > 0).length;

  const TABS = [["rampup", "📊 Ramp-Up"], ["bom", "📋 BOM"], ["po", "📦 Purchase Orders"], ["sim", "📈 Simulation"]];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.txt, fontFamily: "'Segoe UI',system-ui,sans-serif", padding: mob ? 6 : 14 }}>
      <style>{`
        input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.3);border:2px solid #94a3b8}
        input[type="range"]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;cursor:pointer;border:2px solid #94a3b8}
        *{box-sizing:border-box}::selection{background:#0891b230}input::placeholder{color:${C.dim}}table td,table th{white-space:nowrap}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        input[type="text"]:hover{background:#dbeafe !important}
        select:hover{background:#dbeafe !important;border-color:#818cf8 !important}
      `}</style>

      <div style={{ textAlign: "center", marginBottom: mob ? 8 : 14 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button onClick={() => setMob(m => !m)} style={{ padding: "4px 10px", fontSize: 10, fontFamily: "monospace", fontWeight: 700, background: mob ? C.acc : C.inp, color: mob ? "#fff" : C.mut, border: `1px solid ${mob ? C.acc : C.brd}`, borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            {mob ? "📱 Mobile" : "🖥 Desktop"}
          </button>
        </div>
        {!mob && <div style={{ fontSize: 9, letterSpacing: 4, color: C.dim, textTransform: "uppercase", fontFamily: "monospace" }}>Production Ramp-Up & Material Planning</div>}
        <h1 style={{ fontSize: mob ? 16 : 22, fontWeight: 800, margin: "2px 0", fontFamily: "monospace" }}>Inventory Simulator</h1>
        <div style={{ fontSize: mob ? 9 : 11, color: C.mut }}>{skus.filter(s => s.on).length} active SKUs • {rms.length} RM • {NW} weeks{!mob && " • CM↔M auto-conversion"}</div>
      </div>

      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ padding: mob ? "6px 10px" : "8px 16px", borderRadius: "8px 8px 0 0", border: `1px solid ${C.brd}`, borderBottom: tab === k ? "2px solid #0891b2" : `1px solid ${C.brd}`, background: tab === k ? C.card : C.bg, color: tab === k ? C.acc : C.mut, fontWeight: 700, fontSize: mob ? 10 : 11, fontFamily: "monospace", cursor: "pointer" }}>{mob ? l.split(" ")[0] + " " + l.split(" ").slice(1).join("").substring(0, 6) : l}</button>)}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: "0 8px 8px 8px", padding: mob ? 8 : 16, boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>

        {tab === "rampup" && <>
          <div style={{ fontSize: 10, color: C.dim, fontFamily: "monospace", marginBottom: 10 }}>✎ Shaded fields are editable. Purple zone = PQ Validation weeks. Cyan zone = Production Ramp-Up.</div>
          <RampGrid skus={skus} set={setSkus} mob={mob} />
        </>}

        {tab === "bom" && <>
          <div style={{ fontSize: 10, color: C.dim, fontFamily: "monospace", marginBottom: 10 }}>✎ Shaded fields are editable — names, units (CM↔M auto-converts), and BOM Qty per cell.</div>
          <BOMGrid skus={skus} rms={rms} bom={bom} setBom={setBom} uRM={uRM} />
        </>}

        {tab === "po" && <>
          <div style={{ fontSize: 10, color: C.dim, fontFamily: "monospace", marginBottom: 10 }}>✎ Shaded fields are editable — names, units, Qty and arrival week. "+ PO" to add.</div>
          <POGrid rms={rms} pos={pos} setPos={setPos} uRM={uRM} />
        </>}

        {tab === "sim" && <>
          {risk > 0 && (
            <div style={{ marginBottom: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", fontFamily: "monospace", marginBottom: 4 }}>RUN-OUT ALERT</div>
                {rms.map((rm, i) => {
                  const r = res[i];
                  if (r.so === 0) return null;
                  return (
                    <div key={rm.id} style={{ fontSize: 11, fontFamily: "monospace", color: "#991b1b", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: RC[i % 6], flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>{rm.name}</span>
                      <span style={{ color: "#dc2626" }}>— runs out <span style={{ fontWeight: 700, textDecoration: "underline" }}>{WL[r.soWk]}</span> ({r.so} wks without material)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: C.dim, textTransform: "uppercase", fontFamily: "monospace" }}>RM Inventory — Variable consumption by ramp-up</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {["combined", "individual"].map(v => (
                  <button key={v} onClick={() => setSimView(v)} style={{ padding: "4px 12px", fontSize: 10, fontFamily: "monospace", fontWeight: 700, border: `1px solid ${simView === v ? C.acc : C.brd}`, borderRadius: 5, background: simView === v ? C.acc : C.card, color: simView === v ? "#fff" : C.mut, cursor: "pointer" }}>
                    {v === "combined" ? "Combined" : "Individual"}
                  </button>
                ))}
              </div>
            </div>
            {simView === "combined" && <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                {rms.map((r, i) => res[i].avg > 0 && (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 10, height: 3, borderRadius: 2, background: RC[i % 6] }} />
                    <span style={{ fontSize: 9, color: C.mut, fontFamily: "monospace" }}>{r.name} ({r.u})</span>
                  </div>
                ))}
              </div>
              {actR.length > 0 ? <Chart res={res} rms={rms} mx={mx} mn={mn} mob={mob} /> : <div style={{ padding: 30, textAlign: "center", color: C.dim }}>Enable SKUs and configure BOM</div>}
            </>}
            {simView === "individual" && <>
              {rms.map((rm, i) => res[i].avg > 0 && <RMDetailChart key={rm.id} rm={rm} ri={i} r={res[i]} mob={mob} skus={skus} bom={bom} />)}
              {actR.length === 0 && <div style={{ padding: 30, textAlign: "center", color: C.dim }}>Enable SKUs and configure BOM</div>}
            </>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : (rms.length <= 3 ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1fr"), gap: 10 }}>
            {rms.map((rm, idx) => {
              const r = res[idx], col = RC[idx % 6], dead = r.avg === 0;
              const used = skus.filter(s => s.on && bom[s.id]?.[rm.id] > 0);
              const npo = (pos[rm.id] || []).filter(p => p.on !== false).length;
              const npoTotal = (pos[rm.id] || []).length;
              return (
                <div key={rm.id} style={{ background: C.card, border: `${r.so > 0 ? "2px" : "1px"} solid ${dead ? C.off : r.so > 0 ? "#fca5a5" : C.brd}`, borderRadius: 8, overflow: "hidden", opacity: dead ? .45 : 1, position: "relative" }}>
                  {r.so > 0 && <div style={{ background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, fontFamily: "monospace", padding: "3px 0", textAlign: "center", letterSpacing: 1, animation: "pulse 2s infinite" }}>⚠ RUN-OUT — starts {WL[r.soWk]}</div>}
                  <div style={{ padding: "8px 10px 6px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: dead ? C.off : col, flexShrink: 0 }} />
                    <input type="text" value={rm.name} onChange={e => uRM(idx, "name", e.target.value)}
                      style={{ ...nameStyle, flex: 1, fontSize: 12, fontWeight: 700, color: dead ? C.off : C.txt, minWidth: 0 }} />
                    <select value={rm.u} onChange={e => uRM(idx, "u", e.target.value)}
                      style={{ ...selStyle, color: C.txt }}>
                      <option value="CM">CM</option><option value="M">M</option>
                    </select>
                    {rms.length > 1 && <span onClick={() => delRM(idx)} style={{ cursor: "pointer", fontSize: 13, color: C.dim }}>×</span>}
                  </div>
                  {used.length > 0 && <div style={{ padding: "3px 10px", display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {used.map(s => { const si = skus.indexOf(s); return <span key={s.id} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 6, background: `${SC[si % 6]}15`, color: SC[si % 6], fontFamily: "monospace", fontWeight: 600 }}>{s.name}</span>; })}
                  </div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, padding: "4px 10px" }}>
                    <div style={{ textAlign: "center", padding: 3, background: `${col}08`, borderRadius: 4 }}>
                      <div style={{ fontSize: 8, color: C.dim, textTransform: "uppercase" }}>Consumption/wk</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: col, fontFamily: "monospace" }}>{fS(Math.round(r.avg))} {rm.u}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 3, background: `${C.warn}08`, borderRadius: 4 }}>
                      <div style={{ fontSize: 8, color: C.dim, textTransform: "uppercase" }}>Run-out</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: r.so > 0 ? C.red : C.grn, fontFamily: "monospace" }}>{r.so > 0 ? r.so + " wks" : "✓"}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 3, background: `${C.acc}08`, borderRadius: 4 }}>
                      <div style={{ fontSize: 8, color: C.dim, textTransform: "uppercase" }}>POs</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.acc, fontFamily: "monospace" }}>{npo}/{npoTotal}</div>
                    </div>
                  </div>
                  <div style={{ padding: "6px 10px 10px", fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ color: C.mut }}>Initial Stock</span>
                      <Cell val={rm.stock} fmt={fN} color={col} w={90} onSave={d => { const n = parseFloat(d.replace(/,/g, "")); uRM(idx, "stock", isNaN(n) ? 0 : Math.max(0, n)); }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ color: C.mut }}>Final Inventory</span>
                      <span style={{ fontWeight: 700, fontFamily: "monospace", color: (r.data[NW - 1] || {}).inv > 0 ? C.grn : C.red }}>{fN((r.data[NW - 1] || {}).inv)} {rm.u}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ color: C.mut }}>Weeks w/ Stock</span>
                      <span style={{ fontWeight: 700, fontFamily: "monospace", color: (NW - r.so) === NW ? C.grn : r.so > NW / 2 ? C.red : C.warn }}>{NW - r.so} / {NW}</span>
                    </div>
                    {r.so > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px", background: "#fef2f2", borderRadius: 4 }}>
                      <span style={{ color: C.red, fontWeight: 600, fontSize: 10 }}>⚠ Runs out</span>
                      <span style={{ fontWeight: 700, fontFamily: "monospace", color: C.red }}>{WL[r.soWk]}</span>
                    </div>}
                  </div>
                </div>
              );
            })}
            <div onClick={addRM} style={{ background: C.bg, border: `2px dashed ${C.brd}`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: 180 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.acc} onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
              <div style={{ fontSize: 24, color: C.dim }}>+</div>
              <div style={{ fontSize: 10, color: C.dim, fontFamily: "monospace" }}>Add Material</div>
            </div>
          </div>
        </>}
      </div>

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 8, color: C.dim, fontFamily: "monospace" }}>
        Consumption = Σ(Ramp-up Vol × BOM Qty) • Scheduled POs • CM↔M auto-converts BOM + Stock + POs
      </div>
    </div>
  );
}
