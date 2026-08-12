import Foundation
import Combine

final class CalculatorViewModel: ObservableObject {
    @Published var incomeMode: IncomeMode = .dayRate
    @Published var taxYear: TaxYear = .y2026

    @Published var dailyRate: String = "" { didSet { syncFromDayRateInputs() } }
    @Published var holidays: String = "" { didSet { syncFromDayRateInputs() } }
    @Published var monthlyPension: String = "" { didSet { syncFromDayRateInputs() } }
    @Published var yearlyExpenses: String = ""
    @Published var annualTurnover: String = ""
    @Published var annualPension: String = "" { didSet { syncFromAnnualPension() } }

    @Published var pensionStartBalance: String = ""
    @Published var currentAge: String = ""
    @Published var pensionGrowth: String = ""

    // Guards against re-entrancy between the two didSet-driven sync
    // functions below (mirrors the web version's cross-field pre-fill,
    // e.g. typing a daily rate keeps annualTurnover pre-populated so it's
    // there if the user switches to Turnover mode).
    private var isSyncing = false

    private func syncFromDayRateInputs() {
        guard incomeMode == .dayRate, !isSyncing else { return }
        isSyncing = true
        if !dailyRate.isEmpty {
            annualTurnover = Fmt.roundedString((Double(dailyRate) ?? 0) * workingDays)
        }
        if !monthlyPension.isEmpty {
            annualPension = Fmt.roundedString((Double(monthlyPension) ?? 0) * 12)
        }
        isSyncing = false
    }

    private func syncFromAnnualPension() {
        guard incomeMode == .annualTurnover, !isSyncing else { return }
        isSyncing = true
        if !annualPension.isEmpty {
            monthlyPension = Fmt.roundedString((Double(annualPension) ?? 0) / 12)
        }
        isSyncing = false
    }

    var isDayRate: Bool { incomeMode == .dayRate }

    var workingDays: Double {
        guard isDayRate else { return 0 }
        return max(0, TaxCalculator.totalDays - (Double(holidays) ?? 0))
    }

    var currentTurnover: Double {
        isDayRate ? (Double(dailyRate) ?? 0) * workingDays : (Double(annualTurnover) ?? 0)
    }

    var currentAnnualPension: Double {
        isDayRate ? (Double(monthlyPension) ?? 0) * 12 : (Double(annualPension) ?? 0)
    }

    var scenarioNoPension: ScenarioResult {
        TaxCalculator.scenario(turnover: currentTurnover, annualPension: 0, yearlyExpenses: Double(yearlyExpenses) ?? 0, taxYear: taxYear)
    }

    var scenario1000: ScenarioResult {
        TaxCalculator.scenario(turnover: currentTurnover, annualPension: 12000, yearlyExpenses: Double(yearlyExpenses) ?? 0, taxYear: taxYear)
    }

    var custom: ScenarioResult {
        TaxCalculator.scenario(turnover: currentTurnover, annualPension: currentAnnualPension, yearlyExpenses: Double(yearlyExpenses) ?? 0, taxYear: taxYear)
    }

    struct PensionYear: Identifiable {
        let id: Int
        let age: Double
        let contrib: Double
        let start: Double
        let growth: Double
        let end: Double
        let isMillionRow: Bool
    }

    var projectionData: [PensionYear] {
        var data: [PensionYear] = []
        var balance = Double(pensionStartBalance) ?? 0
        let contrib = currentAnnualPension
        let rate = (Double(pensionGrowth) ?? 0) / 100
        let age = Double(currentAge) ?? 0
        var hitMillion = false
        for year in 1...25 {
            let start = balance
            let growth = start * rate
            balance = start + growth + contrib
            var isMillionRow = false
            if !hitMillion && balance >= 1_000_000 {
                hitMillion = true
                isMillionRow = true
            }
            data.append(PensionYear(id: year, age: age + Double(year - 1), contrib: contrib, start: start, growth: growth, end: balance, isMillionRow: isMillionRow))
        }
        return data
    }

    struct Strategy: Identifiable {
        let id: String
        let title: String
        let icon: String
        let desc: String
        let value: Double
        let subtext: String
        let canApply: Bool
        let applyValue: Double
    }

    var strategies: [Strategy] {
        let c = custom
        let mr = c.marginalRate
        let excessProfit = max(0, c.profit - 50_000)
        let evCost = 7200.0
        return [
            Strategy(
                id: "pension", title: "Optimise for 19% Corp Tax", icon: "📉",
                desc: c.profit <= 50_000
                    ? "Great — your profit is already at or below £50,000, paying the lowest Corp Tax rate (19%)."
                    : "Contribute an extra \(Fmt.currency(excessProfit)) to pension to bring profit to £50k and avoid the 26.5% marginal trap.",
                value: excessProfit * mr, subtext: "Corp Tax Saved",
                canApply: c.profit > 50_000, applyValue: excessProfit + c.pension
            ),
            Strategy(
                id: "ev", title: "Company Electric Car", icon: "🚗",
                desc: "Lease an EV (~£600/mo). 100% Corp Tax write-off + negligible BiK = significant tax efficiency.",
                value: evCost * mr + evCost * 0.3375, subtext: "Total Tax Efficiency / yr",
                canApply: false, applyValue: 0
            ),
            Strategy(
                id: "trivial", title: "Trivial Benefits", icon: "🎁",
                desc: "Use your £300 annual director exemption for gift cards. Zero tax, zero NI, zero reporting.",
                value: 300 * mr + 300 * 0.3375, subtext: "Tax-free Extraction",
                canApply: false, applyValue: 0
            ),
            Strategy(
                id: "wfh", title: "Formal Home Rent", icon: "🏠",
                desc: "Switch from £6/wk flat rate (saves \(Fmt.currency(312 * mr))/yr) to a formal rental agreement for greater deduction.",
                value: 2400 * mr - 312 * mr, subtext: "Extra Corp Tax Saved",
                canApply: false, applyValue: 0
            ),
            Strategy(
                id: "party", title: "Annual Party (+1 Guest)", icon: "🥂",
                desc: "£150/head HMRC allowance — use it for a Christmas or Summer event for you and a partner.",
                value: 300 * mr + 300 * 0.3375, subtext: "Tax-free Value",
                canApply: false, applyValue: 0
            ),
        ]
    }

    func apply(_ strategy: Strategy) {
        if isDayRate {
            monthlyPension = Fmt.roundedString(strategy.applyValue / 12)
        } else {
            annualPension = Fmt.roundedString(strategy.applyValue)
        }
    }
}
