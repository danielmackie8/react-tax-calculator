import React, { useState, useMemo, useEffect } from 'react';

// --- CONSTANTS ---
const SALARY = 12570;
const BASIC_RATE = 50270;
const DIV_ALLOWANCE = 500;
const TOTAL_DAYS = 253; // 261 working days - 8 bank holidays
const EMPLOYER_NI_THRESHOLD = 5000;
const EMPLOYER_NI_RATE = 0.15;

// --- CALCULATION LOGIC ---
const getDividendRates = (taxYear) =>
  taxYear === '2026' ? { basic: 0.1075, higher: 0.3575 } : { basic: 0.0875, higher: 0.3375 };

const formatCurrency = (v) =>
  isFinite(v) ? '£' + Math.round(v).toLocaleString('en-GB') : '–';

const formatPercentage = (v) =>
  isFinite(v) ? (v * 100).toFixed(1) + '%' : '–';

const calculateEmployerNI = (salary) => {
  if (salary <= EMPLOYER_NI_THRESHOLD) return 0;
  return (salary - EMPLOYER_NI_THRESHOLD) * EMPLOYER_NI_RATE;
};

const calculateCorporationTax = (profit) => {
  if (profit <= 0) return 0;
  const LOWER_LIMIT = 50000;
  const UPPER_LIMIT = 250000;
  const SMALL_RATE = 0.19;
  const MAIN_RATE = 0.25;
  const MR_FRACTION = 3 / 200;

  if (profit <= LOWER_LIMIT) return profit * SMALL_RATE;
  if (profit >= UPPER_LIMIT) return profit * MAIN_RATE;
  
  const ctAtMainRate = profit * MAIN_RATE;
  const marginalRelief = MR_FRACTION * (UPPER_LIMIT - profit);
  return ctAtMainRate - marginalRelief;
};

const calculateScenario = (turnover, annualPension, yearlyExpenses, taxYear) => {
  const employerNI = calculateEmployerNI(SALARY);
  const profit = turnover - SALARY - employerNI - annualPension - yearlyExpenses;
  const ct = profit > 0 ? calculateCorporationTax(profit) : 0;
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

  // Determine Marginal Rate for Optimisation Calcs
  let marginalRate = 0.19;
  if (profit > 50000 && profit < 250000) marginalRate = 0.265;
  if (profit >= 250000) marginalRate = 0.25;

  return {
    turnover, pension: annualPension, employerNI, yearlyExpenses, profit, ct, afterCt,
    basicDiv, basicTax, higherDiv, higherTax, totalDivTax, netDiv, annualNet, monthlyNet,
    totalValue, totalTax, effectiveTaxRate, ctRate, marginalRate, BASIC_DIV, HIGHER_DIV
  };
};

export default function App() {
  // --- STATE ---
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'
  const [incomeMode, setIncomeMode] = useState('dayRate'); 
  const [taxYear, setTaxYear] = useState('2025');
  const [activeTab, setActiveTab] = useState('comparison');

  // Inputs
  const [dailyRate, setDailyRate] = useState('');
  const [holidays, setHolidays] = useState('');
  const [monthlyPension, setMonthlyPension] = useState('');
  const [yearlyExpenses, setYearlyExpenses] = useState('');
  const [annualTurnover, setAnnualTurnover] = useState('');
  const [annualPension, setAnnualPension] = useState('');

  // Pension Projection Inputs
  const [pensionStartBalance, setPensionStartBalance] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [pensionGrowth, setPensionGrowth] = useState('');

  // --- THEME EFFECT ---
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- COMPUTED ---
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
      if (dailyRate) setAnnualTurnover((parseFloat(dailyRate) || 0) * workingDays);
      if (monthlyPension) setAnnualPension((parseFloat(monthlyPension) || 0) * 12);
    } else {
      if (annualPension) setMonthlyPension(Math.round((parseFloat(annualPension) || 0) / 12));
    }
  }, [isDayRate, dailyRate, workingDays, monthlyPension, annualPension]);

  const scenarios = useMemo(() => {
    const expenses = parseFloat(yearlyExpenses) || 0;
    return {
      s0: calculateScenario(currentTurnover, 0, expenses, taxYear),
      s1500: calculateScenario(currentTurnover, 18000, expenses, taxYear),
      s1750: calculateScenario(currentTurnover, 21000, expenses, taxYear),
      s2000: calculateScenario(currentTurnover, 24000, expenses, taxYear),
      custom: calculateScenario(currentTurnover, currentAnnualPension, expenses, taxYear),
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
      if (!hitMillion && balance >= 1000000) {
        hitMillion = true;
        isMillionRow = true;
      }
      data.push({ year, age: age + year - 1, contrib, start, growth, end: balance, isMillionRow });
    }
    return data;
  }, [pensionStartBalance, currentAnnualPension, pensionGrowth, currentAge]);

  const custom = scenarios.custom;
  
  const getCTLabel = (profit, rate) => {
     if (profit <= 50000) return `Corporation Tax @ ${(rate*100).toFixed(1)}%`;
     if (profit >= 250000) return `Corporation Tax @ 25%`;
     return `Corporation Tax (Marginal Relief) @ ${(rate*100).toFixed(2)}%`;
  };

  // --- OPTIMISATION STRATEGIES ---
  const strategies = useMemo(() => {
    const marginalRate = custom.marginalRate; 
    
    // 1. Optimise Profit to £50k (Reduce Tax Band)
    const currentProfit = custom.profit;
    const excessProfit = Math.max(0, currentProfit - 50000);
    const pensionNeeded = excessProfit;
    const pensionTaxSave = pensionNeeded * marginalRate;
    
    // 2. EV
    const evCost = 7200; // £600/mo
    const evTotalBenefit = (evCost * marginalRate) + (evCost * 0.3375);

    // 3. Trivial Benefits
    const trivBen = 300;
    const trivSave = (trivBen * marginalRate) + (trivBen * 0.3375);

    // 4. Use of Home (Rent a Room)
    const flatRate = 312;
    const flatRateSave = flatRate * marginalRate;
    const rentVal = 2400;
    const rentTotalSave = rentVal * marginalRate;
    const rentExtraSave = rentTotalSave - flatRateSave; 

    // 5. Annual Party
    const partyCost = 300; // £150 x 2
    const partySave = (partyCost * marginalRate) + (partyCost * 0.3375);

    return [
      {
        id: 'pension',
        title: 'Optimise for 19% Tax Rate',
        icon: '📉',
        desc: currentProfit <= 50000 
          ? 'Great job! Your profit is already at or below £50,000, ensuring you pay the lowest Corporation Tax rate (19%).'
          : `Contribute an extra £${(pensionNeeded/1000).toFixed(1)}k to pension to bring profit down to £50k. This avoids the 26.5% marginal tax trap on that excess.`,
        value: pensionTaxSave,
        subtext: `Corp Tax Saved`,
        canApply: currentProfit > 50000,
        applyValue: pensionNeeded + custom.pension 
      },
      {
        id: 'ev',
        title: 'Company Electric Car',
        icon: '🚗',
        desc: 'Lease an EV (~£600/mo). 100% Corp Tax write-off + negligible BiK.',
        value: evTotalBenefit,
        subtext: 'Total Tax Efficiency / yr',
        canApply: false
      },
      {
        id: 'trivial',
        title: 'Trivial Benefits',
        icon: '🎁',
        desc: 'Utilise your £300 annual director exemption for gift cards (Amazon, etc).',
        value: trivSave,
        subtext: 'Tax-free Extraction',
        canApply: false
      },
      {
        id: 'wfh',
        title: 'Formal Home Rent',
        icon: '🏠',
        desc: `Switch from £6/wk flat rate (saves £${Math.round(flatRateSave)}/yr) to a formal rental agreement.`,
        value: rentExtraSave,
        subtext: 'Extra Corp Tax saved',
        canApply: false
      },
      {
        id: 'party',
        title: 'Annual Party (+1 Guest)',
        icon: '🥂',
        desc: '£150/head allowance. Treat yourself and a partner to a Christmas/Summer event.',
        value: partySave,
        subtext: 'Tax-free value extracted',
        canApply: false
      }
    ];
  }, [custom]);

  return (
    <>
      <style>{`
        :root {
          /* LIGHT THEME (Default) */
          --bg-app: #f8fafc;
          --bg-card: #ffffff;
          --primary: #4f46e5;
          --primary-hover: #4338ca;
          --accent-success: #10b981;
          --accent-warning: #f59e0b;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --border-focus: #4f46e5;
          --header-text: #0f172a;
          
          /* TOGGLE VARIABLES */
          --toggle-track: #e2e8f0;
          --toggle-knob: #ffffff;
          --toggle-icon-on: #fbbf24;  /* Sun color */
          --toggle-icon-off: #94a3b8; /* Moon color inactive */
          
          --insight-bg: #f0fdf4;
          --insight-border: #bbf7d0;
          --insight-text: #166534;
          --section-header-bg: #f1f5f9;
        }

        [data-theme='dark'] {
          /* DARK THEME */
          --bg-app: #0f172a;
          --bg-card: #1e293b;
          --primary: #6366f1;
          --primary-hover: #818cf8;
          --accent-success: #34d399;
          --accent-warning: #fbbf24;
          --text-main: #f1f5f9;
          --text-muted: #94a3b8;
          --border: #334155;
          --border-focus: #6366f1;
          --header-text: #f8fafc;
          
          /* TOGGLE VARIABLES */
          --toggle-track: #334155;
          --toggle-knob: #475569;
          --toggle-icon-on: #94a3b8; /* Sun color inactive */
          --toggle-icon-off: #f1f5f9; /* Moon color active */
          
          --insight-bg: #064e3b;
          --insight-border: #059669;
          --insight-text: #d1fae5;
          --section-header-bg: #334155;
        }

        * { box-sizing: border-box; }
        body { 
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: var(--bg-app);
          color: var(--text-main);
          -webkit-font-smoothing: antialiased;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .app-container {
          max-width: 1100px;
          margin: 40px auto;
          padding: 0 20px;
        }

        /* HEADER & MINIMALIST TOGGLE */
        header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin: 0; color: var(--header-text); }
        
        .toggle-switch {
          position: relative;
          width: 56px;
          height: 30px;
          background-color: var(--toggle-track);
          border-radius: 999px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          padding: 3px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
        }

        .toggle-knob {
          width: 24px;
          height: 24px;
          background-color: var(--toggle-knob);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transform: translateX(0);
          transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        [data-theme='dark'] .toggle-knob {
          transform: translateX(26px);
        }
        
        /* Icons inside the track (optional background icons) or knob */
        .toggle-icon {
          width: 14px;
          height: 14px;
          transition: color 0.3s;
        }
        
        /* Sun Icon Logic */
        .icon-sun { color: var(--accent-warning); display: block; }
        [data-theme='dark'] .icon-sun { display: none; }
        
        /* Moon Icon Logic */
        .icon-moon { color: #f1f5f9; display: none; }
        [data-theme='dark'] .icon-moon { display: block; }

        /* CARDS */
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          padding: 20px;
          margin-bottom: 20px;
          transition: background 0.3s, border-color 0.3s;
        }

        /* INPUTS */
        .controls-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; } 
        
        .input-group { display: flex; flex-direction: column; }
        .input-group label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.02em; }
        .input-group input {
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          padding: 8px 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-main);
          background: var(--bg-card);
          transition: all 0.2s;
        }
        .input-group input:focus { outline: none; border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .input-group small { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; }

        /* SEGMENTED CONTROL */
        .segmented-control {
          display: inline-flex;
          background: var(--toggle-track);
          padding: 3px;
          border-radius: 8px;
          margin-right: 16px;
          margin-bottom: 20px;
        }
        .segment-btn {
          border: none;
          background: transparent;
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .segment-btn.active {
          background: var(--bg-card);
          color: var(--primary);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          font-weight: 600;
        }

        /* TABS */
        .tabs-nav { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 24px; gap: 24px; flex-wrap: wrap; }
        .tab-btn {
          background: none;
          border: none;
          padding: 12px 0;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          position: relative;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active { color: var(--primary); font-weight: 600; }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--primary);
        }

        /* TABLES */
        .modern-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .modern-table th { text-align: left; padding: 12px 16px; color: var(--text-muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .modern-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-main); }
        .modern-table tr:last-child td { border-bottom: none; }
        .modern-table .mono { font-family: 'SF Mono', 'Roboto Mono', monospace; letter-spacing: -0.02em; }
        .modern-table .highlight-row { background-color: var(--section-header-bg); font-weight: 600; }
        .modern-table .accent { color: var(--primary); font-weight: 600; }
        .modern-table .gold-row { background-color: #fffbeb; }
        [data-theme='dark'] .modern-table .gold-row { background-color: #78350f; color: white !important; }
        [data-theme='dark'] .modern-table .gold-row td { color: #fef3c7; }
        .modern-table .info-row { color: var(--text-muted); font-style: italic; font-size: 0.85rem; }

        /* DASHBOARD STATS */
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: var(--section-header-bg); padding: 16px; border-radius: 10px; border: 1px solid var(--border); }
        .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .stat-value { font-size: 1.4rem; font-weight: 700; color: var(--text-main); font-family: 'SF Mono', monospace; letter-spacing: -0.03em; }
        .stat-card.primary { background: var(--primary); border-color: var(--primary); }
        .stat-card.primary .stat-label { color: rgba(255,255,255,0.8); }
        .stat-card.primary .stat-value { color: white; }

        /* OPTIMISATION CARDS */
        .opt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; }
        .opt-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 20px; transition: transform 0.2s; display: flex; flex-direction: column; justify-content: space-between; }
        .opt-card:hover { transform: translateY(-2px); border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .opt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .opt-icon { font-size: 1.5rem; background: var(--section-header-bg); padding: 8px; border-radius: 8px; }
        .opt-title { font-weight: 700; color: var(--text-main); font-size: 1rem; }
        .opt-value { font-family: 'SF Mono', monospace; color: var(--accent-success); font-weight: 700; font-size: 1.1rem; }
        .opt-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px; }
        .opt-sub { font-size: 0.75rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .opt-btn { width: 100%; padding: 10px; margin-top: 15px; background: var(--section-header-bg); border: 1px solid var(--border); color: var(--text-main); font-size: 0.85rem; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .opt-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }

        /* INSIGHT BOX */
        .insight-card {
          background: var(--insight-bg);
          border: 1px solid var(--insight-border);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--insight-text);
          font-size: 0.85rem;
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* SECTION HEADER */
        .section-header { 
          background: var(--section-header-bg); 
          padding: 10px 14px; 
          border-radius: 6px; 
          font-size: 0.75rem; 
          font-weight: 700; 
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 24px 0 12px 0;
        }

        @media (max-width: 600px) {
          .controls-grid { grid-template-columns: 1fr; }
          .segmented-control { display: flex; width: 100%; margin-right: 0; }
          .segment-btn { flex: 1; text-align: center; }
          .modern-table th, .modern-table td { padding: 10px 8px; }
        }
      `}</style>

      <div className="app-container">
        <header>
          <h1>Contractor Tax Calculator</h1>
          {/* MINIMALIST FINTECH TOGGLE */}
          <div className="toggle-switch" onClick={toggleTheme} title="Toggle Theme">
             <div className="toggle-knob">
                {/* SVG ICONS INSIDE KNOB */}
                <svg className="toggle-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="5"></circle>
                   <line x1="12" y1="1" x2="12" y2="3"></line>
                   <line x1="12" y1="21" x2="12" y2="23"></line>
                   <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                   <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                   <line x1="1" y1="12" x2="3" y2="12"></line>
                   <line x1="21" y1="12" x2="23" y2="12"></line>
                   <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                   <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <svg className="toggle-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
             </div>
          </div>
        </header>

        {/* CONTROLS BAR */}
        <div className="controls-bar">
          <div className="segmented-control">
            <button className={`segment-btn ${incomeMode === 'dayRate' ? 'active' : ''}`} onClick={() => setIncomeMode('dayRate')}>Day Rate</button>
            <button className={`segment-btn ${incomeMode === 'annualTurnover' ? 'active' : ''}`} onClick={() => setIncomeMode('annualTurnover')}>Annual Turnover</button>
          </div>
          <div className="segmented-control">
            <button className={`segment-btn ${taxYear === '2025' ? 'active' : ''}`} onClick={() => setTaxYear('2025')}>2025/26</button>
            <button className={`segment-btn ${taxYear === '2026' ? 'active' : ''}`} onClick={() => setTaxYear('2026')}>2026/27</button>
          </div>
        </div>

        {/* MAIN INPUT CARD */}
        <div className="card">
          <div className="controls-grid">
            {isDayRate ? (
              <>
                <div className="input-group">
                  <label>Daily Rate</label>
                  <input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Personal Holidays</label>
                  <input type="number" value={holidays} onChange={(e) => setHolidays(e.target.value)} placeholder="0" />
                  <small>261 - 8BH - {holidays || 0} PTO = {workingDays} Working Days</small>
                </div>
                <div className="input-group">
                  <label>Monthly Pension</label>
                  <input type="number" value={monthlyPension} onChange={(e) => setMonthlyPension(e.target.value)} placeholder="0" />
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label>Annual Turnover</label>
                  <input type="number" value={annualTurnover} onChange={(e) => setAnnualTurnover(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Annual Pension</label>
                  <input type="number" value={annualPension} onChange={(e) => setAnnualPension(e.target.value)} placeholder="0" />
                </div>
              </>
            )}
            <div className="input-group">
              <label>Annual Expenses</label>
              <input type="number" value={yearlyExpenses} onChange={(e) => setYearlyExpenses(e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        {/* RESULTS AREA */}
        <div className="card">
          <div className="tabs-nav">
            {['comparison', 'breakdown', 'pension', 'optimize'].map(tab => {
               let label = tab.charAt(0).toUpperCase() + tab.slice(1);
               if(tab === 'breakdown') label = 'Detailed Breakdown';
               if(tab === 'pension') label = 'Pension Projection';
               if(tab === 'optimize') label = 'Optimise Tax';
               
               // Style object to push the optimise button to the right
               const isOptimize = tab === 'optimize';
               const style = isOptimize ? { marginLeft: 'auto', color: 'var(--accent-success)' } : {};
               
               return (
                <button 
                  key={tab} 
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={style}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* TAB: COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="tab-pane">
              {/* --- DASHBOARD --- */}
              <div className="stat-grid">
                <div className="stat-card primary">
                  <div className="stat-label">Net Annual</div>
                  <div className="stat-value">{formatCurrency(custom.annualNet)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Net Monthly</div>
                  <div className="stat-value">{formatCurrency(custom.monthlyNet)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Annual Pension</div>
                  <div className="stat-value">{formatCurrency(custom.pension)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Effective Tax</div>
                  <div className="stat-value">{formatPercentage(custom.effectiveTaxRate)}</div>
                </div>
              </div>

              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Pension (Yr)</th>
                    <th style={{textAlign:'right'}}>Net Monthly</th>
                    <th style={{textAlign:'right'}}>Net Annual</th>
                    <th style={{textAlign:'right'}}>Total Value</th>
                    <th style={{textAlign:'right'}}>Eff. Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'No Pension', data: scenarios.s0 },
                    { label: '£1.5k / mo', data: scenarios.s1500 },
                    { label: '£2.0k / mo', data: scenarios.s2000 },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>{row.label}</td>
                      <td className="mono">{formatCurrency(row.data.pension)}</td>
                      <td className="mono accent" style={{textAlign:'right'}}>{formatCurrency(row.data.monthlyNet)}</td>
                      <td className="mono" style={{textAlign:'right'}}>{formatCurrency(row.data.annualNet)}</td>
                      <td className="mono" style={{textAlign:'right'}}>{formatCurrency(row.data.totalValue)}</td>
                      <td className="mono" style={{textAlign:'right'}}>{formatPercentage(row.data.effectiveTaxRate)}</td>
                    </tr>
                  ))}
                  <tr className="highlight-row">
                    <td>Your Input</td>
                    <td className="mono">{formatCurrency(currentAnnualPension)}</td>
                    <td className="mono accent" style={{textAlign:'right'}}>{formatCurrency(custom.monthlyNet)}</td>
                    <td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.annualNet)}</td>
                    <td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.totalValue)}</td>
                    <td className="mono" style={{textAlign:'right'}}>{formatPercentage(custom.effectiveTaxRate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: OPTIMISE (NEW) */}
          {activeTab === 'optimize' && (
             <div className="tab-pane">
                 <div className="section-header">
                   Efficiency Opportunities
                   <span style={{float:'right', color: 'var(--text-muted)', fontWeight:'normal'}}>Based on Marginal Rate: {(custom.marginalRate*100).toFixed(1)}%</span>
                 </div>
                 <div className="opt-grid">
                    {strategies.map(s => (
                       <div key={s.id} className="opt-card">
                          <div>
                            <div className="opt-header">
                               <div>
                                  <div className="opt-title">{s.title}</div>
                                  <div className="opt-desc" style={{marginTop:'4px', marginBottom:0}}>{s.desc}</div>
                               </div>
                               <div className="opt-icon">{s.icon}</div>
                            </div>
                            <div style={{borderTop:'1px solid var(--border)', paddingTop:'12px', marginTop:'12px'}}>
                               <div className="opt-sub">{s.subtext}</div>
                               <div className="opt-value">+{formatCurrency(s.value)}</div>
                            </div>
                          </div>
                          {s.canApply && (
                             <button className="opt-btn" onClick={() => {
                                if(isDayRate) setMonthlyPension(Math.round(s.applyValue/12)); 
                                else setAnnualPension(Math.round(s.applyValue));
                                setActiveTab('comparison');
                             }}>
                                Apply to Calculator
                             </button>
                          )}
                       </div>
                    ))}
                 </div>
                 <div className="insight-card" style={{marginTop:'30px'}}>
                   <span className="insight-icon">ℹ️</span>
                   <div>
                      <strong>How this works:</strong> These figures are calculated dynamically based on your specific profit band. The "value" shown is the total tax saved (Corporation + Personal) compared to taking the money as dividends.
                   </div>
                </div>
             </div>
          )}

          {/* TAB: BREAKDOWN */}
          {activeTab === 'breakdown' && (
            <div className="tab-pane">
              <div className="section-header">Inputs</div>
              <table className="modern-table">
                 <tbody>
                  {isDayRate && (
                    <>
                      <tr><td>Total Working Days Available</td><td className="mono" style={{textAlign:'right'}}>{TOTAL_DAYS}</td></tr>
                      <tr><td>Holidays Taken</td><td className="mono" style={{textAlign:'right'}}>{holidays || 0}</td></tr>
                      <tr><td>Actual Days Worked</td><td className="mono" style={{textAlign:'right', fontWeight:'bold'}}>{workingDays}</td></tr>
                      <tr><td>Daily Rate</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(parseFloat(dailyRate)||0)}</td></tr>
                    </>
                  )}
                  <tr>
                    <td><strong>Annual Turnover</strong></td>
                    <td className="mono" style={{textAlign:'right', fontWeight:'bold'}}>{formatCurrency(custom.turnover)}</td>
                  </tr>
                 </tbody>
              </table>

              <div className="section-header">Company Calculations</div>
              <table className="modern-table">
                <tbody>
                  <tr><td>Annual Turnover</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.turnover)}</td></tr>
                  <tr><td>Less: Director Salary</td><td className="mono" style={{textAlign:'right'}}>-{formatCurrency(SALARY)}</td></tr>
                  <tr><td>Less: Employer NI</td><td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.employerNI)}</td></tr>
                  <tr><td>Less: Employer Pension</td><td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.pension)}</td></tr>
                  <tr><td>Less: Expenses</td><td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.yearlyExpenses)}</td></tr>
                  <tr className="highlight-row">
                    <td>Taxable Company Profit</td>
                    <td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.profit)}</td>
                  </tr>
                  {custom.profit > 50000 && (
                     <tr className="info-row">
                        <td>Corporation Tax @ 25% (Comparison Only)</td>
                        <td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.profit * 0.25)}</td>
                     </tr>
                  )}
                  <tr>
                    <td>{getCTLabel(custom.profit, custom.ctRate)}</td>
                    <td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.ct)}</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>Profit After Tax (Dividends)</td>
                    <td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.afterCt)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="section-header">Personal Taxation</div>
              <table className="modern-table">
                <tbody>
                   <tr><td>Director Salary</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(SALARY)}</td></tr>
                   <tr><td>Income Tax</td><td className="mono" style={{textAlign:'right'}}>£0</td></tr>
                   <tr><td>Employee NI</td><td className="mono" style={{textAlign:'right'}}>£0</td></tr>
                   <tr className="highlight-row"><td>Net Salary</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(SALARY)}</td></tr>
                </tbody>
              </table>

              <div className="section-header">Dividend Taxation</div>
              <table className="modern-table">
                <tbody>
                   <tr><td>Dividend Available</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.afterCt)}</td></tr>
                   <tr><td>Dividend Allowance</td><td className="mono" style={{textAlign:'right'}}>£500</td></tr>
                   <tr><td>Taxable in Basic Band</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.basicDiv)}</td></tr>
                   <tr><td>Basic Tax @ {(custom.BASIC_DIV*100).toFixed(2)}%</td><td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.basicTax)}</td></tr>
                   <tr><td>Taxable in Higher Band</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.higherDiv)}</td></tr>
                   <tr><td>Higher Tax @ {(custom.HIGHER_DIV*100).toFixed(2)}%</td><td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.higherTax)}</td></tr>
                   <tr className="highlight-row"><td>Total Dividend Tax</td><td className="mono" style={{textAlign:'right'}}>-{formatCurrency(custom.totalDivTax)}</td></tr>
                   <tr className="highlight-row"><td>Net Dividend</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.netDiv)}</td></tr>
                </tbody>
              </table>

              <div className="section-header">Final Summary</div>
              <table className="modern-table">
                <tbody>
                   <tr><td>Net Salary</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(SALARY)}</td></tr>
                   <tr><td>Net Dividend</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.netDiv)}</td></tr>
                   <tr className="highlight-row"><td>Total Annual Net (Cash)</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.annualNet)}</td></tr>
                   <tr className="highlight-row"><td>Total Monthly Net (Cash)</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.monthlyNet)}</td></tr>
                   <tr><td>Plus: Annual Pension</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.pension)}</td></tr>
                   <tr className="highlight-row"><td>Total Annual Value</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.totalValue)}</td></tr>
                </tbody>
              </table>

              <div className="section-header">Tax Paid</div>
              <table className="modern-table">
                <tbody>
                  <tr><td>Corporation Tax</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.ct)}</td></tr>
                  <tr><td>Employer NI</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.employerNI)}</td></tr>
                  <tr><td>Dividend Tax</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.totalDivTax)}</td></tr>
                  <tr className="highlight-row"><td>Total Tax & NI</td><td className="mono" style={{textAlign:'right'}}>{formatCurrency(custom.totalTax)}</td></tr>
                  <tr className="highlight-row"><td>Effective Tax Rate</td><td className="mono" style={{textAlign:'right'}}>{formatPercentage(custom.effectiveTaxRate)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: PENSION */}
          {activeTab === 'pension' && (
            <div className="tab-pane">
              <div className="controls-grid">
                <div className="input-group">
                  <label>Current Pot</label>
                  <input type="number" value={pensionStartBalance} onChange={(e) => setPensionStartBalance(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Age</label>
                  <input type="number" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Growth %</label>
                  <input type="number" value={pensionGrowth} onChange={(e) => setPensionGrowth(e.target.value)} placeholder="5" />
                </div>
              </div>

              <div className="section-header">Projection (Contributing {formatCurrency(currentAnnualPension)}/yr)</div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th style={{textAlign:'right'}}>Contribution</th>
                    <th style={{textAlign:'right'}}>Growth</th>
                    <th style={{textAlign:'right'}}>Total Pot</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionData.map((row) => (
                    <tr key={row.year} className={row.isMillionRow ? 'gold-row' : ''}>
                      <td>{row.age}</td>
                      <td className="mono" style={{textAlign:'right'}}>{formatCurrency(row.contrib)}</td>
                      <td className="mono" style={{textAlign:'right'}}>{formatCurrency(row.growth)}</td>
                      <td className="mono" style={{textAlign:'right'}}>{formatCurrency(row.end)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
