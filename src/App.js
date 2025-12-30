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
  
  // Marginal Relief Calculation
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

  return {
    turnover, pension: annualPension, employerNI, yearlyExpenses, profit, ct, afterCt,
    basicDiv, basicTax, higherDiv, higherTax, totalDivTax, netDiv, annualNet, monthlyNet,
    totalValue, totalTax, effectiveTaxRate, ctRate, BASIC_DIV, HIGHER_DIV
  };
};

export default function App() {
  // --- STATE ---
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
  
  // Determine Corp Tax Label
  const getCTLabel = (profit, rate) => {
     if (profit <= 50000) return `Corporation Tax @ ${(rate*100).toFixed(1)}%`;
     if (profit >= 250000) return `Corporation Tax @ 25%`;
     return `Corporation Tax (Marginal Relief) @ ${(rate*100).toFixed(2)}%`;
  };

  return (
    <>
      <style>{`
        :root {
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
        }

        * { box-sizing: border-box; }
        body { 
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: var(--bg-app);
          color: var(--text-main);
          -webkit-font-smoothing: antialiased;
        }

        .app-container {
          max-width: 1100px;
          margin: 40px auto;
          padding: 0 20px;
        }

        /* HEADER */
        header { margin-bottom: 24px; }
        h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin: 0; color: var(--text-main); }
        
        /* CARDS */
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          padding: 20px;
          margin-bottom: 20px;
        }

        /* INPUTS & CONTROLS */
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
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-group input:focus { outline: none; border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .input-group small { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; }

        /* SEGMENTED CONTROL */
        .segmented-control {
          display: inline-flex;
          background: #f1f5f9;
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
          background: white;
          color: var(--primary);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          font-weight: 600;
        }

        /* TABS */
        .tabs-nav { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 24px; gap: 24px; }
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
        .modern-table .highlight-row { background-color: #f8fafc; font-weight: 600; }
        .modern-table .accent { color: var(--primary); font-weight: 600; }
        .modern-table .gold-row { background-color: #fffbeb; }
        .modern-table .gold-row td { color: #b45309; font-weight: 600; }
        .modern-table .info-row { color: #94a3b8; font-style: italic; font-size: 0.85rem; }

        /* DASHBOARD STATS */
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid var(--border); }
        .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .stat-value { font-size: 1.4rem; font-weight: 700; color: var(--text-main); font-family: 'SF Mono', monospace; letter-spacing: -0.03em; }
        .stat-card.primary { background: var(--primary); border-color: var(--primary); }
        .stat-card.primary .stat-label { color: rgba(255,255,255,0.8); }
        .stat-card.primary .stat-value { color: white; }

        /* INSIGHT BOX */
        .insight-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 12px 16px;
          color: #166534;
          font-size: 0.85rem;
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* SECTION HEADER */
        .section-header { 
          background: #f1f5f9; 
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
            {['comparison', 'breakdown', 'pension'].map(tab => (
              <button 
                key={tab} 
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'breakdown' ? 'Detailed Breakdown' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* TAB: COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="tab-pane">
              {/* --- NEW SUMMARY DASHBOARD --- */}
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
              <div className="insight-card">
                <span className="insight-icon">💡</span>
                <div>
                  <strong>Efficiency Tip:</strong> Increasing employer pension contributions is the most effective way to reduce Corporation Tax while retaining wealth in your name.
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
