import React, { useState, useMemo, useEffect } from 'react';

// --- CONSTANTS ---
const SALARY = 12570;
const BASIC_RATE = 50270;
const DIV_ALLOWANCE = 500;
const TOTAL_DAYS = 253;
const EMPLOYER_NI_THRESHOLD = 5000;
const EMPLOYER_NI_RATE = 0.15;

// --- HELPERS ---
const getDividendRates = (taxYear) =>
  taxYear === '2026' ? { basic: 0.1075, higher: 0.3575 } : { basic: 0.0875, higher: 0.3375 };

const fmt = (v) => isFinite(v) ? '£' + Math.round(v).toLocaleString('en-GB') : '–';
const fmtPct = (v) => isFinite(v) ? (v * 100).toFixed(1) + '%' : '–';

const calcEmployerNI = (salary) =>
  salary <= EMPLOYER_NI_THRESHOLD ? 0 : (salary - EMPLOYER_NI_THRESHOLD) * EMPLOYER_NI_RATE;

const calcCorpTax = (profit) => {
  if (profit <= 0) return 0;
  const LOWER = 50000, UPPER = 250000, SMALL = 0.19, MAIN = 0.25, MR = 3 / 200;
  if (profit <= LOWER) return profit * SMALL;
  if (profit >= UPPER) return profit * MAIN;
  return profit * MAIN - MR * (UPPER - profit);
};

const calcScenario = (turnover, annualPension, yearlyExpenses, taxYear) => {
  const employerNI = calcEmployerNI(SALARY);
  const profit = turnover - SALARY - employerNI - annualPension - yearlyExpenses;
  const ct = profit > 0 ? calcCorpTax(profit) : 0;
  const afterCt = profit - ct;
  const { basic: BASIC_DIV, higher: HIGHER_DIV } = getDividendRates(taxYear);
  const basicDiv = Math.min(afterCt, Math.max(0, BASIC_RATE - SALARY));
  const basicTaxable = Math.max(0, basicDiv - DIV_ALLOWANCE);
  const basicTax = basicTaxable * BASIC_DIV;
  const higherDiv = afterCt - basicDiv;
  const higherTax = higherDiv * HIGHER_DIV;
  const totalDivTax = basicTax + higherTax;
  const netDiv = afterCt - totalDivTax;
  const annualNet = SALARY + netDiv;
  const monthlyNet = annualNet / 12;
  const totalValue = annualNet + annualPension;
  const totalTax = ct + employerNI + totalDivTax;
  const effectiveTaxRate = turnover > 0 ? totalTax / turnover : 0;
  const ctRate = profit > 0 ? ct / profit : 0;
  let marginalRate = 0.19;
  if (profit > 50000 && profit < 250000) marginalRate = 0.265;
  if (profit >= 250000) marginalRate = 0.25;
  return {
    turnover, pension: annualPension, employerNI, yearlyExpenses, profit, ct, afterCt,
    basicDiv, basicTax, higherDiv, higherTax, totalDivTax, netDiv, annualNet, monthlyNet,
    totalValue, totalTax, effectiveTaxRate, ctRate, marginalRate, BASIC_DIV, HIGHER_DIV
  };
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:            #ffffff;
    --bg-subtle:     #f0ede8;
    --bg-muted:      #e8e4dd;
    --text:          #111111;
    --text-2:        #6b6b6b;
    --text-3:        #aaaaaa;
    --border:        #d8d3cb;
    --border-strong: #c4beb5;
    --primary:       #111111;
    --primary-fg:    #ffffff;
    --success:       #15803d;
    --danger:        #dc2626;
    --shadow-sm:     0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.07);
    --shadow-md:     0 4px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06);
    --r-sm: 4px; --r: 6px; --r-md: 8px; --r-lg: 12px;
    --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --mono: 'SF Mono', 'Roboto Mono', ui-monospace, monospace;
  }

  [data-theme='dark'] {
    --bg:            #0f0f0f;
    --bg-subtle:     #1c1c1c;
    --bg-muted:      #262626;
    --text:          #eeeeee;
    --text-2:        #888888;
    --text-3:        #555555;
    --border:        #2e2e2e;
    --border-strong: #3a3a3a;
    --primary:       #eeeeee;
    --primary-fg:    #111111;
    --success:       #22c55e;
    --danger:        #f87171;
    --shadow-sm:     0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
    --shadow-md:     0 4px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.2s, color 0.2s;
    min-height: 100vh;
    font-size: 14px;
    line-height: 1.5;
  }

  .app { max-width: 1100px; margin: 0 auto; padding: 36px 24px 80px; }

  .app-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; margin-bottom: 24px;
  }
  .app-title {
    font-size: 1.5rem; font-weight: 700;
    letter-spacing: -0.03em; color: var(--text); line-height: 1.2;
  }
  .app-subtitle { font-size: 0.875rem; color: var(--text-2); margin-top: 3px; }

  .theme-btn {
    width: 34px; height: 34px; border-radius: var(--r-md);
    border: 1px solid var(--border-strong); background: var(--bg-subtle);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0; transition: background 0.15s;
  }
  .theme-btn:hover { background: var(--bg-muted); }

  /* ── Split card ── */
  .split-card {
    display: grid; grid-template-columns: 272px 1fr;
    border: 1px solid var(--border-strong); border-radius: var(--r-lg);
    box-shadow: var(--shadow-sm); overflow: hidden; background: var(--bg);
  }

  /* ── Left panel ── */
  .panel-left {
    background: var(--bg-subtle); border-right: 1px solid var(--border-strong);
    padding: 24px 18px; display: flex; flex-direction: column;
  }
  .panel-title { font-size: 1rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text); margin-bottom: 2px; }
  .panel-subtitle { font-size: 0.8125rem; color: var(--text-2); margin-bottom: 20px; }
  .left-divider { height: 1px; background: var(--border-strong); margin: 16px 0; }

  /* ── Seg control ── */
  .seg {
    display: flex; background: var(--bg-muted); border: 1px solid var(--border-strong);
    border-radius: var(--r-md); padding: 3px; gap: 2px; margin-bottom: 16px;
  }
  .seg-btn {
    flex: 1; background: transparent; border: none; padding: 6px 10px;
    font-family: var(--font); font-size: 0.8125rem; font-weight: 600;
    color: var(--text-2); border-radius: var(--r-sm); cursor: pointer;
    transition: background 0.15s, color 0.12s, box-shadow 0.15s;
    white-space: nowrap; text-align: center;
  }
  .seg-btn.active { background: var(--bg); color: var(--text); box-shadow: var(--shadow-sm); }

  /* ── Input stack ── */
  .input-stack { display: flex; flex-direction: column; gap: 12px; flex: 1; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field-label {
    font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--text-2);
  }
  .field-hint { font-size: 0.6875rem; color: var(--text-3); margin-top: 2px; }
  .input-wrap {
    display: flex; align-items: center; border: 1px solid var(--border-strong);
    border-radius: var(--r); background: var(--bg); overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .input-wrap:focus-within { border-color: var(--text); box-shadow: 0 0 0 3px rgba(0,0,0,0.08); }
  [data-theme='dark'] .input-wrap:focus-within { box-shadow: 0 0 0 3px rgba(255,255,255,0.08); }
  .input-affix {
    padding: 0 10px; font-size: 0.875rem; font-weight: 600; color: var(--text-2);
    background: var(--bg-muted); height: 36px; display: flex;
    align-items: center; user-select: none; flex-shrink: 0;
  }
  .input-affix.prefix { border-right: 1px solid var(--border-strong); }
  .input-affix.suffix { border-left: 1px solid var(--border-strong); }
  .field-input {
    flex: 1; min-width: 0; border: none; background: transparent;
    padding: 0 10px; height: 36px; font-family: var(--font);
    font-size: 0.9375rem; font-weight: 500; color: var(--text); outline: none;
  }
  .field-input::placeholder { color: var(--text-3); font-weight: 400; }

  /* ── Right panel ── */
  .panel-right { padding: 24px; overflow: hidden; min-width: 0; }

  /* ── Tabs ── */
  .tabs-bar {
    display: flex; align-items: center; border-bottom: 1px solid var(--border-strong);
    margin-bottom: 20px; overflow-x: auto;
  }
  .tab-btn {
    background: none; border: none; border-bottom: 2px solid transparent;
    padding: 10px 16px; font-family: var(--font); font-size: 0.875rem;
    font-weight: 600; color: var(--text-2); cursor: pointer;
    white-space: nowrap; margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active { color: var(--text); border-bottom-color: var(--text); }
  .tab-btn.optimise { margin-left: auto; color: var(--success); }
  .tab-btn.optimise.active { border-bottom-color: var(--success); color: var(--success); }

  /* ── Stat grid ── */
  .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat-card { background: var(--bg-subtle); border: none; border-radius: var(--r-md); padding: 14px 16px; }
  .stat-card.primary { background: var(--primary); border-color: var(--primary); }
  .stat-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-2); margin-bottom: 4px; }
  .stat-card.primary .stat-label { color: rgba(255,255,255,0.55); }
  [data-theme='dark'] .stat-card.primary .stat-label { color: rgba(0,0,0,0.45); }
  .stat-value { font-size: 1.625rem; font-weight: 700; color: var(--text); letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1.1; }
  .stat-card.primary .stat-value { color: var(--primary-fg); }

  /* ── Table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .data-table thead th {
    text-align: left; padding: 8px 12px; font-size: 0.6875rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-2);
    border-bottom: 1px solid var(--border-strong); background: var(--bg-subtle); white-space: nowrap;
  }
  .data-table thead th:not(:first-child) { text-align: right; }
  .data-table tbody td { padding: 11px 12px; border-bottom: 1px solid var(--border); color: var(--text); font-variant-numeric: tabular-nums; }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody td:not(:first-child) { text-align: right; }
  .data-table .mono { font-family: var(--mono); letter-spacing: -0.01em; }
  .data-table .accent { font-weight: 700; }
  .data-table .row-highlight { background: var(--bg-muted); }
  .data-table .row-highlight td { font-weight: 700; border-color: var(--border-strong); }
  .data-table .row-gold { background: #fffbeb; }
  [data-theme='dark'] .data-table .row-gold { background: #3d2700; }
  .data-table .row-gold td { color: #92400e; }
  [data-theme='dark'] .data-table .row-gold td { color: #fde68a; }

  /* ── Section header ── */
  .section-header {
    font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-2); padding: 18px 0 8px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .section-header:first-child { padding-top: 0; }

  /* ── Pension inputs ── */
  .pension-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }

  /* ── Optimise ── */
  .opt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 4px; }
  .opt-card {
    border: 1px solid var(--border-strong); border-radius: var(--r-md);
    padding: 16px; background: var(--bg); display: flex; flex-direction: column;
    gap: 12px; transition: box-shadow 0.15s;
  }
  .opt-card:hover { box-shadow: var(--shadow-md); }
  .opt-card-top { display: flex; align-items: flex-start; gap: 10px; }
  .opt-icon { font-size: 1.125rem; flex-shrink: 0; margin-top: 1px; }
  .opt-title { font-size: 0.875rem; font-weight: 700; color: var(--text); line-height: 1.3; }
  .opt-desc { font-size: 0.8125rem; color: var(--text-2); margin-top: 4px; line-height: 1.55; }
  .opt-footer { border-top: 1px solid var(--border); padding-top: 12px; display: flex; align-items: center; justify-content: space-between; }
  .opt-sub { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
  .opt-value { font-size: 1.0625rem; font-weight: 700; color: var(--success); font-variant-numeric: tabular-nums; }
  .opt-apply-btn {
    font-family: var(--font); font-size: 0.75rem; font-weight: 700;
    padding: 5px 12px; border-radius: var(--r-sm); border: 1px solid var(--border-strong);
    background: var(--bg-muted); color: var(--text); cursor: pointer; transition: box-shadow 0.12s;
  }
  .opt-apply-btn:hover { box-shadow: var(--shadow-sm); }
  .insight-box {
    margin-top: 16px; padding: 14px 16px; border: 1px solid var(--border);
    border-left: 3px solid var(--border-strong); border-radius: var(--r);
    background: var(--bg-subtle); font-size: 0.8125rem; color: var(--text-2); line-height: 1.6;
  }

  /* ── Mobile scenario cards ── */
  .scenario-cards { display: flex; flex-direction: column; gap: 8px; }
  .scenario-card { border: 1px solid var(--border); border-radius: var(--r-md); padding: 14px 16px; background: var(--bg); }
  .scenario-card--active { background: var(--bg-subtle); border-color: var(--border); }
  .scenario-card__name { font-size: 0.875rem; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .scenario-card__row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid var(--border); }
  .scenario-card__row:last-child { border-bottom: none; }
  .scenario-card__lbl { font-size: 0.875rem; color: var(--text-2); font-weight: 400; }
  .scenario-card__monthly { font-size: 1.125rem; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
  .scenario-card__val { font-size: 0.9375rem; font-weight: 600; color: var(--text); font-variant-numeric: tabular-nums; }

  /* ── Visibility ── */
  .desktop-only { display: table; }
  .mobile-only  { display: none; }

  /* ── Tablet ── */
  @media (max-width: 860px) {
    .split-card { grid-template-columns: 1fr; }
    .panel-left { border-right: none; border-bottom: 1px solid var(--border-strong); }
    .input-stack { flex-direction: row; flex-wrap: wrap; }
    .input-stack .field { flex: 1 1 160px; }
  }

  /* ── Mobile ── */
  @media (max-width: 600px) {
    .app { padding: 20px 14px 60px; }
    .app-title { font-size: 1.25rem; }
    .panel-left, .panel-right { padding: 16px; }
    .stat-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .stat-value { font-size: 1.375rem; }
    .opt-grid { grid-template-columns: 1fr; }
    .tabs-bar { overflow-x: auto; justify-content: space-around; }
    .tab-btn { padding: 9px 8px; font-size: 0.8125rem; flex: 1; text-align: center; justify-content: center; }
    .tab-btn.optimise { margin-left: 0; flex: 1; }
    .data-table { font-size: 0.8125rem; }
    .data-table thead th, .data-table tbody td { padding: 9px 8px; }
    .input-stack { flex-direction: column; }
    .input-stack .field { flex: none; }
    .desktop-only { display: none; }
    .mobile-only  { display: flex; }
  }
`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function App() {

  const [incomeMode, setIncomeMode] = useState('dayRate');
  const [taxYear, setTaxYear] = useState('2026');
  const [activeTab, setActiveTab] = useState('comparison');

  const [dailyRate, setDailyRate] = useState('');
  const [holidays, setHolidays] = useState('');
  const [monthlyPension, setMonthlyPension] = useState('');
  const [yearlyExpenses, setYearlyExpenses] = useState('');
  const [annualTurnover, setAnnualTurnover] = useState('');
  const [annualPension, setAnnualPension] = useState('');
  const [pensionStartBalance, setPensionStartBalance] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [pensionGrowth, setPensionGrowth] = useState('');



  const isDayRate = incomeMode === 'dayRate';
  const workingDays = isDayRate ? Math.max(0, TOTAL_DAYS - (parseFloat(holidays) || 0)) : 0;

  const currentTurnover = useMemo(() => {
    if (isDayRate) return (parseFloat(dailyRate) || 0) * workingDays;
    return parseFloat(annualTurnover) || 0;
  }, [isDayRate, dailyRate, workingDays, annualTurnover]);

  const currentAnnualPension = useMemo(() => {
    if (isDayRate) return (parseFloat(monthlyPension) || 0) * 12;
    return parseFloat(annualPension) || 0;
  }, [isDayRate, monthlyPension, annualPension]);

  useEffect(() => {
    if (isDayRate) {
      if (dailyRate) setAnnualTurnover(String((parseFloat(dailyRate) || 0) * workingDays));
      if (monthlyPension) setAnnualPension(String((parseFloat(monthlyPension) || 0) * 12));
    } else {
      if (annualPension) setMonthlyPension(String(Math.round((parseFloat(annualPension) || 0) / 12)));
    }
  }, [isDayRate, dailyRate, workingDays, monthlyPension, annualPension]);

  const scenarios = useMemo(() => {
    const exp = parseFloat(yearlyExpenses) || 0;
    return {
      s0:     calcScenario(currentTurnover, 0,     exp, taxYear),
      s1000:  calcScenario(currentTurnover, 12000, exp, taxYear),
      custom: calcScenario(currentTurnover, currentAnnualPension, exp, taxYear),
    };
  }, [currentTurnover, currentAnnualPension, yearlyExpenses, taxYear]);

  const projectionData = useMemo(() => {
    const data = [];
    let balance = parseFloat(pensionStartBalance) || 0;
    const contrib = currentAnnualPension;
    const rate = (parseFloat(pensionGrowth) || 0) / 100;
    const age = parseFloat(currentAge) || 0;
    let hitMillion = false;
    for (let year = 1; year <= 25; year++) {
      const start = balance;
      const growth = start * rate;
      balance = start + growth + contrib;
      let isMillionRow = false;
      if (!hitMillion && balance >= 1000000) { hitMillion = true; isMillionRow = true; }
      data.push({ year, age: age + year - 1, contrib, start, growth, end: balance, isMillionRow });
    }
    return data;
  }, [pensionStartBalance, currentAnnualPension, pensionGrowth, currentAge]);

  const custom = scenarios.custom;

  const getCTLabel = (profit, rate) => {
    if (profit <= 50000) return `Corporation Tax @ ${(rate * 100).toFixed(1)}%`;
    if (profit >= 250000) return `Corporation Tax @ 25%`;
    return `Corporation Tax (Marginal Relief) @ ${(rate * 100).toFixed(2)}%`;
  };

  const strategies = useMemo(() => {
    const mr = custom.marginalRate;
    const excessProfit = Math.max(0, custom.profit - 50000);
    const evCost = 7200;
    return [
      {
        id: 'pension', title: 'Optimise for 19% Corp Tax', icon: '📉',
        desc: custom.profit <= 50000
          ? "Great — your profit is already at or below £50,000, paying the lowest Corp Tax rate (19%)."
          : `Contribute an extra ${fmt(excessProfit)} to pension to bring profit to £50k and avoid the 26.5% marginal trap.`,
        value: excessProfit * mr, subtext: 'Corp Tax Saved',
        canApply: custom.profit > 50000, applyValue: excessProfit + custom.pension
      },
      {
        id: 'ev', title: 'Company Electric Car', icon: '🚗',
        desc: 'Lease an EV (~£600/mo). 100% Corp Tax write-off + negligible BiK = significant tax efficiency.',
        value: evCost * mr + evCost * 0.3375, subtext: 'Total Tax Efficiency / yr', canApply: false
      },
      {
        id: 'trivial', title: 'Trivial Benefits', icon: '🎁',
        desc: 'Use your £300 annual director exemption for gift cards. Zero tax, zero NI, zero reporting.',
        value: 300 * mr + 300 * 0.3375, subtext: 'Tax-free Extraction', canApply: false
      },
      {
        id: 'wfh', title: 'Formal Home Rent', icon: '🏠',
        desc: `Switch from £6/wk flat rate (saves ${fmt(312 * mr)}/yr) to a formal rental agreement for greater deduction.`,
        value: 2400 * mr - 312 * mr, subtext: 'Extra Corp Tax Saved', canApply: false
      },
      {
        id: 'party', title: 'Annual Party (+1 Guest)', icon: '🥂',
        desc: '£150/head HMRC allowance — use it for a Christmas or Summer event for you and a partner.',
        value: 300 * mr + 300 * 0.3375, subtext: 'Tax-free Value', canApply: false
      },
    ];
  }, [custom]);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        <header className="app-header">
          <h1 className="app-title">LTD Tax Calculator</h1>
        </header>

        <div className="split-card">

          {/* ── LEFT ── */}
          <div className="panel-left">
            <p className="panel-title">Your details</p>
            <p className="panel-subtitle">{taxYear === '2025' ? '2025/26' : '2026/27'} tax year</p>

            {/* Tax year toggle — top */}
            <div className="seg">
              <button className={`seg-btn${taxYear === '2025' ? ' active' : ''}`} onClick={() => setTaxYear('2025')}>2025/26</button>
              <button className={`seg-btn${taxYear === '2026' ? ' active' : ''}`} onClick={() => setTaxYear('2026')}>2026/27</button>
            </div>

            {/* Income mode toggle */}
            <div className="seg">
              <button className={`seg-btn${incomeMode === 'dayRate' ? ' active' : ''}`} onClick={() => setIncomeMode('dayRate')}>Day Rate</button>
              <button className={`seg-btn${incomeMode === 'annualTurnover' ? ' active' : ''}`} onClick={() => setIncomeMode('annualTurnover')}>Turnover</button>
            </div>

            <div className="input-stack">
              {isDayRate ? (
                <>
                  <div className="field">
                    <label className="field-label">Daily Rate</label>
                    <div className="input-wrap">
                      <span className="input-affix prefix">£</span>
                      <input className="field-input" type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="600" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Personal Holidays</label>
                    <div className="input-wrap">
                      <input className="field-input" type="number" value={holidays} onChange={e => setHolidays(e.target.value)} placeholder="25" style={{ paddingLeft: 14 }} />
                      <span className="input-affix suffix">days</span>
                    </div>
                    <span className="field-hint">261 − 8 BH − {holidays || 0} = {workingDays} working days</span>
                  </div>
                  <div className="field">
                    <label className="field-label">Monthly Pension</label>
                    <div className="input-wrap">
                      <span className="input-affix prefix">£</span>
                      <input className="field-input" type="number" value={monthlyPension} onChange={e => setMonthlyPension(e.target.value)} placeholder="0" />
                      <span className="input-affix suffix">/mo</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label className="field-label">Annual Turnover</label>
                    <div className="input-wrap">
                      <span className="input-affix prefix">£</span>
                      <input className="field-input" type="number" value={annualTurnover} onChange={e => setAnnualTurnover(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Annual Pension</label>
                    <div className="input-wrap">
                      <span className="input-affix prefix">£</span>
                      <input className="field-input" type="number" value={annualPension} onChange={e => setAnnualPension(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </>
              )}
              <div className="field">
                <label className="field-label">Annual Expenses</label>
                <div className="input-wrap">
                  <span className="input-affix prefix">£</span>
                  <input className="field-input" type="number" value={yearlyExpenses} onChange={e => setYearlyExpenses(e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="panel-right">
            <div className="tabs-bar">
              <button className={`tab-btn${activeTab === 'comparison' ? ' active' : ''}`} onClick={() => setActiveTab('comparison')}>Comparison</button>
              <button className={`tab-btn${activeTab === 'breakdown' ? ' active' : ''}`} onClick={() => setActiveTab('breakdown')}>Breakdown</button>
              <button className={`tab-btn${activeTab === 'pension' ? ' active' : ''}`} onClick={() => setActiveTab('pension')}>Pension</button>
              <button className={`tab-btn optimise${activeTab === 'optimize' ? ' active' : ''}`} onClick={() => setActiveTab('optimize')}>Optimise ↗</button>
            </div>

            {/* COMPARISON */}
            {activeTab === 'comparison' && (
              <div>
                <div className="stat-grid">
                  <div className="stat-card primary">
                    <div className="stat-label">Net Annual</div>
                    <div className="stat-value">{fmt(custom.annualNet)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Net Monthly</div>
                    <div className="stat-value">{fmt(custom.monthlyNet)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Annual Pension</div>
                    <div className="stat-value">{fmt(custom.pension)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Effective Tax</div>
                    <div className="stat-value">{fmtPct(custom.effectiveTaxRate)}</div>
                  </div>
                </div>

                <table className="data-table desktop-only">
                  <thead>
                    <tr>
                      <th>Scenario</th><th>Pension / yr</th><th>Net Monthly</th>
                      <th>Net Annual</th><th>Total Value</th><th>Eff. Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'No Pension', data: scenarios.s0 },
                      { label: '£1k / mo', data: scenarios.s1000 },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td>{row.label}</td>
                        <td className="mono">{fmt(row.data.pension)}</td>
                        <td className="mono accent">{fmt(row.data.monthlyNet)}</td>
                        <td className="mono">{fmt(row.data.annualNet)}</td>
                        <td className="mono">{fmt(row.data.totalValue)}</td>
                        <td className="mono">{fmtPct(row.data.effectiveTaxRate)}</td>
                      </tr>
                    ))}
                    <tr className="row-highlight">
                      <td>Your Input</td>
                      <td className="mono">{fmt(currentAnnualPension)}</td>
                      <td className="mono accent">{fmt(custom.monthlyNet)}</td>
                      <td className="mono">{fmt(custom.annualNet)}</td>
                      <td className="mono">{fmt(custom.totalValue)}</td>
                      <td className="mono">{fmtPct(custom.effectiveTaxRate)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="scenario-cards mobile-only">
                  {[
                    { label: 'No Pension', data: scenarios.s0, isUser: false },
                    { label: '£1k / mo pension', data: scenarios.s1000, isUser: false },
                    {
                      label: currentAnnualPension > 0
                        ? `Your input — ${fmt(currentAnnualPension / 12 / 1000 % 1 === 0 ? currentAnnualPension / 12 / 1000 : (currentAnnualPension / 12 / 1000).toFixed(1))}k / mo`
                        : 'Your input',
                      data: custom, isUser: true
                    },
                  ].map((row, i) => (
                    <div key={i} className={`scenario-card${row.isUser ? ' scenario-card--active' : ''}`}>
                      <p className="scenario-card__name">{row.label}</p>
                      <div className="scenario-card__row">
                        <span className="scenario-card__lbl">Net monthly</span>
                        <span className="scenario-card__monthly">{fmt(row.data.monthlyNet)}</span>
                      </div>
                      <div className="scenario-card__row">
                        <span className="scenario-card__lbl">Net annual</span>
                        <span className="scenario-card__val">{fmt(row.data.annualNet)}</span>
                      </div>
                      <div className="scenario-card__row">
                        <span className="scenario-card__lbl">Eff. tax</span>
                        <span className="scenario-card__val">{fmtPct(row.data.effectiveTaxRate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BREAKDOWN */}
            {activeTab === 'breakdown' && (
              <div>
                <div className="section-header">Inputs</div>
                <table className="data-table">
                  <tbody>
                    {isDayRate && (<>
                      <tr><td>Total Working Days Available</td><td className="mono">{TOTAL_DAYS}</td></tr>
                      <tr><td>Holidays Taken</td><td className="mono">{holidays || 0}</td></tr>
                      <tr><td>Actual Days Worked</td><td className="mono" style={{ fontWeight: 700 }}>{workingDays}</td></tr>
                      <tr><td>Daily Rate</td><td className="mono">{fmt(parseFloat(dailyRate) || 0)}</td></tr>
                    </>)}
                    <tr className="row-highlight"><td>Annual Turnover</td><td className="mono">{fmt(custom.turnover)}</td></tr>
                  </tbody>
                </table>

                <div className="section-header">Company Calculations</div>
                <table className="data-table">
                  <tbody>
                    <tr><td>Annual Turnover</td><td className="mono">{fmt(custom.turnover)}</td></tr>
                    <tr><td>Less: Director Salary</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(SALARY)}</td></tr>
                    <tr><td>Less: Employer NI</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(custom.employerNI)}</td></tr>
                    <tr><td>Less: Employer Pension</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(custom.pension)}</td></tr>
                    <tr><td>Less: Expenses</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(custom.yearlyExpenses)}</td></tr>
                    <tr className="row-highlight"><td>Taxable Company Profit</td><td className="mono">{fmt(custom.profit)}</td></tr>
                    <tr><td>{getCTLabel(custom.profit, custom.ctRate)}</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(custom.ct)}</td></tr>
                    <tr className="row-highlight"><td>After-Tax Profit (available for dividends)</td><td className="mono">{fmt(custom.afterCt)}</td></tr>
                  </tbody>
                </table>

                <div className="section-header">Personal Tax</div>
                <table className="data-table">
                  <tbody>
                    <tr><td>Director Salary</td><td className="mono">{fmt(SALARY)}</td></tr>
                    <tr><td>Taxable in Basic Band</td><td className="mono">{fmt(custom.basicDiv)}</td></tr>
                    <tr><td>Basic Div Tax @ {(custom.BASIC_DIV * 100).toFixed(2)}%</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(custom.basicTax)}</td></tr>
                    <tr><td>Taxable in Higher Band</td><td className="mono">{fmt(custom.higherDiv)}</td></tr>
                    <tr><td>Higher Div Tax @ {(custom.HIGHER_DIV * 100).toFixed(2)}%</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(custom.higherTax)}</td></tr>
                    <tr className="row-highlight"><td>Total Dividend Tax</td><td className="mono" style={{ color: 'var(--danger)' }}>−{fmt(custom.totalDivTax)}</td></tr>
                    <tr className="row-highlight"><td>Net Dividend</td><td className="mono">{fmt(custom.netDiv)}</td></tr>
                  </tbody>
                </table>

                <div className="section-header">Final Summary</div>
                <table className="data-table">
                  <tbody>
                    <tr><td>Net Salary</td><td className="mono">{fmt(SALARY)}</td></tr>
                    <tr><td>Net Dividend</td><td className="mono">{fmt(custom.netDiv)}</td></tr>
                    <tr className="row-highlight"><td>Total Annual Net (Cash)</td><td className="mono">{fmt(custom.annualNet)}</td></tr>
                    <tr className="row-highlight"><td>Total Monthly Net</td><td className="mono">{fmt(custom.monthlyNet)}</td></tr>
                    <tr><td>Plus: Annual Pension</td><td className="mono" style={{ color: 'var(--success)' }}>+{fmt(custom.pension)}</td></tr>
                    <tr className="row-highlight"><td>Total Annual Value (incl. pension)</td><td className="mono">{fmt(custom.totalValue)}</td></tr>
                  </tbody>
                </table>

                <div className="section-header">Tax Paid</div>
                <table className="data-table">
                  <tbody>
                    <tr><td>Corporation Tax</td><td className="mono">{fmt(custom.ct)}</td></tr>
                    <tr><td>Employer NI</td><td className="mono">{fmt(custom.employerNI)}</td></tr>
                    <tr><td>Dividend Tax</td><td className="mono">{fmt(custom.totalDivTax)}</td></tr>
                    <tr className="row-highlight"><td>Total Tax &amp; NI</td><td className="mono">{fmt(custom.totalTax)}</td></tr>
                    <tr className="row-highlight"><td>Effective Tax Rate</td><td className="mono">{fmtPct(custom.effectiveTaxRate)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* PENSION */}
            {activeTab === 'pension' && (
              <div>
                <div className="pension-inputs">
                  <div className="field">
                    <label className="field-label">Current Pot</label>
                    <div className="input-wrap">
                      <span className="input-affix prefix">£</span>
                      <input className="field-input" type="number" value={pensionStartBalance} onChange={e => setPensionStartBalance(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Current Age</label>
                    <div className="input-wrap">
                      <input className="field-input" type="number" value={currentAge} onChange={e => setCurrentAge(e.target.value)} placeholder="35" style={{ paddingLeft: 14 }} />
                      <span className="input-affix suffix">yrs</span>
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Annual Growth</label>
                    <div className="input-wrap">
                      <input className="field-input" type="number" value={pensionGrowth} onChange={e => setPensionGrowth(e.target.value)} placeholder="5" style={{ paddingLeft: 14 }} />
                      <span className="input-affix suffix">%</span>
                    </div>
                  </div>
                </div>
                <div className="section-header">
                  <span>25-Year Projection</span>
                  <span>Contributing {fmt(currentAnnualPension)} / yr</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr><th>Age</th><th>Contribution</th><th>Growth</th><th>Total Pot</th></tr>
                  </thead>
                  <tbody>
                    {projectionData.map(row => (
                      <tr key={row.year} className={row.isMillionRow ? 'row-gold' : ''}>
                        <td>{row.age}</td>
                        <td className="mono">{fmt(row.contrib)}</td>
                        <td className="mono">{fmt(row.growth)}</td>
                        <td className="mono" style={{ fontWeight: row.isMillionRow ? 700 : 400 }}>{fmt(row.end)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* OPTIMISE */}
            {activeTab === 'optimize' && (
              <div>
                <div className="section-header">
                  <span>Efficiency Opportunities</span>
                  <span>Marginal rate: {(custom.marginalRate * 100).toFixed(1)}%</span>
                </div>
                <div className="opt-grid">
                  {strategies.map(s => (
                    <div key={s.id} className="opt-card">
                      <div className="opt-card-top">
                        <span className="opt-icon">{s.icon}</span>
                        <div>
                          <div className="opt-title">{s.title}</div>
                          <div className="opt-desc">{s.desc}</div>
                        </div>
                      </div>
                      <div className="opt-footer">
                        <div>
                          <div className="opt-sub">{s.subtext}</div>
                          <div className="opt-value">+{fmt(s.value)}</div>
                        </div>
                        {s.canApply && (
                          <button className="opt-apply-btn" onClick={() => {
                            if (isDayRate) setMonthlyPension(String(Math.round(s.applyValue / 12)));
                            else setAnnualPension(String(Math.round(s.applyValue)));
                            setActiveTab('comparison');
                          }}>Apply →</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="insight-box">
                  <strong>How this works:</strong> Values are calculated dynamically from your profit band.
                  Savings shown are the total tax avoided (Corp Tax + dividend tax) vs. taking the money as dividends.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}