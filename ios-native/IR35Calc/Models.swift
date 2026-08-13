import Foundation

// MARK: - Core calculation engine (ported 1:1 from the web app's App.js)

enum TaxCalculator {
    static let salary: Double = 12570
    static let basicRateThreshold: Double = 50270
    static let dividendAllowance: Double = 500
    static let totalDays: Double = 253
    static let employerNIThreshold: Double = 5000
    static let employerNIRate: Double = 0.15

    static func dividendRates(for taxYear: TaxYear) -> (basic: Double, higher: Double) {
        taxYear == .y2026 ? (0.1075, 0.3575) : (0.0875, 0.3375)
    }

    static func employerNI(salary: Double) -> Double {
        salary <= employerNIThreshold ? 0 : (salary - employerNIThreshold) * employerNIRate
    }

    static func corpTax(profit: Double) -> Double {
        guard profit > 0 else { return 0 }
        let lower: Double = 50_000
        let upper: Double = 250_000
        let smallRate = 0.19
        let mainRate = 0.25
        let marginalRelief = 3.0 / 200.0
        if profit <= lower { return profit * smallRate }
        if profit >= upper { return profit * mainRate }
        return profit * mainRate - marginalRelief * (upper - profit)
    }

    static func scenario(turnover: Double, annualPension: Double, yearlyExpenses: Double, taxYear: TaxYear) -> ScenarioResult {
        let ni = employerNI(salary: salary)
        let profit = turnover - salary - ni - annualPension - yearlyExpenses
        let ct = profit > 0 ? corpTax(profit: profit) : 0
        let afterCt = profit - ct
        let rates = dividendRates(for: taxYear)
        let basicDiv = min(afterCt, max(0, basicRateThreshold - salary))
        let basicTaxable = max(0, basicDiv - dividendAllowance)
        let basicTax = basicTaxable * rates.basic
        let higherDiv = afterCt - basicDiv
        let higherTax = higherDiv * rates.higher
        let totalDivTax = basicTax + higherTax
        let netDiv = afterCt - totalDivTax
        let annualNet = salary + netDiv
        let monthlyNet = annualNet / 12
        let totalValue = annualNet + annualPension
        let totalTax = ct + ni + totalDivTax
        let effectiveTaxRate = turnover > 0 ? totalTax / turnover : 0
        let ctRate = profit > 0 ? ct / profit : 0
        var marginalRate = 0.19
        if profit > 50_000 && profit < 250_000 { marginalRate = 0.265 }
        if profit >= 250_000 { marginalRate = 0.25 }

        return ScenarioResult(
            turnover: turnover, pension: annualPension, employerNI: ni,
            yearlyExpenses: yearlyExpenses, profit: profit, ct: ct, afterCt: afterCt,
            basicDiv: basicDiv, basicTax: basicTax, higherDiv: higherDiv, higherTax: higherTax,
            totalDivTax: totalDivTax, netDiv: netDiv, annualNet: annualNet, monthlyNet: monthlyNet,
            totalValue: totalValue, totalTax: totalTax, effectiveTaxRate: effectiveTaxRate,
            ctRate: ctRate, marginalRate: marginalRate,
            basicDivRate: rates.basic, higherDivRate: rates.higher
        )
    }
}

struct ScenarioResult {
    let turnover: Double
    let pension: Double
    let employerNI: Double
    let yearlyExpenses: Double
    let profit: Double
    let ct: Double
    let afterCt: Double
    let basicDiv: Double
    let basicTax: Double
    let higherDiv: Double
    let higherTax: Double
    let totalDivTax: Double
    let netDiv: Double
    let annualNet: Double
    let monthlyNet: Double
    let totalValue: Double
    let totalTax: Double
    let effectiveTaxRate: Double
    let ctRate: Double
    let marginalRate: Double
    let basicDivRate: Double
    let higherDivRate: Double
}

func ctLabel(profit: Double, rate: Double) -> String {
    if profit <= 50_000 { return "Corp tax @ \(String(format: "%.1f", rate * 100))%" }
    if profit >= 250_000 { return "Corp tax @ 25%" }
    return "Corp tax (marginal relief) @ \(String(format: "%.2f", rate * 100))%"
}

// MARK: - Enums

enum TaxYear: String, CaseIterable, Identifiable {
    case y2025 = "2025"
    case y2026 = "2026"
    var id: String { rawValue }
    var segmentLabel: String { self == .y2025 ? "2025/26" : "2026/27" }
}

enum IncomeMode: String, CaseIterable, Identifiable {
    case dayRate = "Day Rate"
    case annualTurnover = "Turnover"
    var id: String { rawValue }
}

enum CalcTab: Int, CaseIterable, Identifiable {
    case setup, comparison, breakdown, pension, optimize
    var id: Int { rawValue }

    /// Screen title shown in the header (full words).
    var title: String {
        switch self {
        case .setup: return "Setup"
        case .comparison: return "Comparison"
        case .breakdown: return "Breakdown"
        case .pension: return "Pension"
        case .optimize: return "Optimise"
        }
    }

    /// Shorter label under the bottom nav icon.
    var navLabel: String {
        switch self {
        case .setup: return "Setup"
        case .comparison: return "Compare"
        case .breakdown: return "Breakdown"
        case .pension: return "Pension"
        case .optimize: return "Optimise"
        }
    }

    var icon: String {
        switch self {
        case .setup: return "gearshape"
        case .comparison: return "chart.line.uptrend.xyaxis"
        case .breakdown: return "rectangle.grid.1x2"
        case .pension: return "clock"
        case .optimize: return "sparkles"
        }
    }
}

struct SegmentOption<T: Hashable>: Identifiable {
    let id: T
    let value: T
    let label: String
    init(_ value: T, _ label: String) {
        self.id = value
        self.value = value
        self.label = label
    }
}

// MARK: - Formatting

enum Fmt {
    private static let numberFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        f.groupingSeparator = ","
        return f
    }()

    static func currency(_ value: Double) -> String {
        guard value.isFinite else { return "–" }
        let rounded = value.rounded()
        let str = numberFormatter.string(from: NSNumber(value: rounded)) ?? String(format: "%.0f", rounded)
        return "£\(str)"
    }

    static func percent(_ value: Double) -> String {
        guard value.isFinite else { return "–" }
        return String(format: "%.1f%%", value * 100)
    }

    static func roundedString(_ value: Double) -> String {
        guard value.isFinite else { return "0" }
        return String(format: "%.0f", value.rounded())
    }
}
