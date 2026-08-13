import SwiftUI
import Foundation

struct BreakdownView: View {
    @ObservedObject var vm: CalculatorViewModel

    var body: some View {
        let c = vm.custom
        VStack(spacing: 12) {
            Card {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Company calculations")
                        .font(.fraunces(16))
                        .foregroundColor(.appTextPrimary)
                    VStack(spacing: 0) {
                        DataLine(label: "Annual turnover", value: Fmt.currency(c.turnover))
                        DataLine(label: "Less: salary", value: "−\(Fmt.currency(TaxCalculator.salary))", tint: .appDanger)
                        DataLine(label: "Less: employer NI", value: "−\(Fmt.currency(c.employerNI))", tint: .appDanger)
                        DataLine(label: "Less: employer pension", value: "−\(Fmt.currency(c.pension))", tint: .appDanger)
                        DataLine(label: "Less: expenses", value: "−\(Fmt.currency(c.yearlyExpenses))", tint: .appDanger)
                        DataLine(label: "Taxable profit", value: Fmt.currency(c.profit), bold: true)
                        DataLine(label: ctLabel(profit: c.profit, rate: c.ctRate), value: "−\(Fmt.currency(c.ct))", tint: .appDanger)
                        DataLine(label: "After-tax profit", value: Fmt.currency(c.afterCt), bold: true, showDivider: false)
                    }
                }
            }

            Card {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Personal tax")
                        .font(.fraunces(16))
                        .foregroundColor(.appTextPrimary)
                    VStack(spacing: 0) {
                        DataLine(label: "Salary", value: Fmt.currency(TaxCalculator.salary))
                        DataLine(label: "Basic-band div. tax @ \(String(format: "%.2f", c.basicDivRate * 100))%", value: "−\(Fmt.currency(c.basicTax))", tint: .appDanger)
                        DataLine(label: "Higher-band div. tax @ \(String(format: "%.2f", c.higherDivRate * 100))%", value: "−\(Fmt.currency(c.higherTax))", tint: .appDanger)
                        DataLine(label: "Total dividend tax", value: "−\(Fmt.currency(c.totalDivTax))", tint: .appDanger, bold: true)
                        DataLine(label: "Net dividend", value: Fmt.currency(c.netDiv), bold: true, showDivider: false)
                    }
                }
            }

            Card {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Totals")
                        .font(.fraunces(16))
                        .foregroundColor(.appTextPrimary)
                    VStack(spacing: 0) {
                        DataLine(label: "Total annual net", value: Fmt.currency(c.annualNet), bold: true)
                        DataLine(label: "Total monthly net", value: Fmt.currency(c.monthlyNet), bold: true)
                        DataLine(label: "Total tax & NI", value: Fmt.currency(c.totalTax))
                        DataLine(label: "Effective tax rate", value: Fmt.percent(c.effectiveTaxRate), showDivider: false)
                    }
                }
            }
        }
    }
}
