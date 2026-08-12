import SwiftUI
import Foundation

struct BreakdownView: View {
    @ObservedObject var vm: CalculatorViewModel

    var body: some View {
        let c = vm.custom
        VStack(alignment: .leading, spacing: 0) {
            SectionHeader(title: "Inputs")
            VStack(spacing: 0) {
                if vm.isDayRate {
                    DataRow(label: "Total Working Days Available", value: Fmt.roundedString(TaxCalculator.totalDays))
                    DataRow(label: "Holidays Taken", value: vm.holidays.isEmpty ? "0" : vm.holidays)
                    DataRow(label: "Actual Days Worked", value: Fmt.roundedString(vm.workingDays), bold: true)
                    DataRow(label: "Daily Rate", value: Fmt.currency(Double(vm.dailyRate) ?? 0))
                }
                DataRow(label: "Annual Turnover", value: Fmt.currency(c.turnover), highlight: true)
            }

            SectionHeader(title: "Company Calculations")
            VStack(spacing: 0) {
                DataRow(label: "Annual Turnover", value: Fmt.currency(c.turnover))
                DataRow(label: "Less: Director Salary", value: "−\(Fmt.currency(TaxCalculator.salary))", tint: Color.appDanger)
                DataRow(label: "Less: Employer NI", value: "−\(Fmt.currency(c.employerNI))", tint: Color.appDanger)
                DataRow(label: "Less: Employer Pension", value: "−\(Fmt.currency(c.pension))", tint: Color.appDanger)
                DataRow(label: "Less: Expenses", value: "−\(Fmt.currency(c.yearlyExpenses))", tint: Color.appDanger)
                DataRow(label: "Taxable Company Profit", value: Fmt.currency(c.profit), highlight: true)
                DataRow(label: ctLabel(profit: c.profit, rate: c.ctRate), value: "−\(Fmt.currency(c.ct))", tint: Color.appDanger)
                DataRow(label: "After-Tax Profit (available for dividends)", value: Fmt.currency(c.afterCt), highlight: true)
            }

            SectionHeader(title: "Personal Tax")
            VStack(spacing: 0) {
                DataRow(label: "Director Salary", value: Fmt.currency(TaxCalculator.salary))
                DataRow(label: "Taxable in Basic Band", value: Fmt.currency(c.basicDiv))
                DataRow(label: "Basic Div Tax @ \(String(format: "%.2f", c.basicDivRate * 100))%", value: "−\(Fmt.currency(c.basicTax))", tint: Color.appDanger)
                DataRow(label: "Taxable in Higher Band", value: Fmt.currency(c.higherDiv))
                DataRow(label: "Higher Div Tax @ \(String(format: "%.2f", c.higherDivRate * 100))%", value: "−\(Fmt.currency(c.higherTax))", tint: Color.appDanger)
                DataRow(label: "Total Dividend Tax", value: "−\(Fmt.currency(c.totalDivTax))", tint: Color.appDanger, highlight: true)
                DataRow(label: "Net Dividend", value: Fmt.currency(c.netDiv), highlight: true)
            }

            SectionHeader(title: "Final Summary")
            VStack(spacing: 0) {
                DataRow(label: "Net Salary", value: Fmt.currency(TaxCalculator.salary))
                DataRow(label: "Net Dividend", value: Fmt.currency(c.netDiv))
                DataRow(label: "Total Annual Net (Cash)", value: Fmt.currency(c.annualNet), highlight: true)
                DataRow(label: "Total Monthly Net", value: Fmt.currency(c.monthlyNet), highlight: true)
                DataRow(label: "Plus: Annual Pension", value: "+\(Fmt.currency(c.pension))", tint: Color.appSuccess)
                DataRow(label: "Total Annual Value (incl. pension)", value: Fmt.currency(c.totalValue), highlight: true)
            }

            SectionHeader(title: "Tax Paid")
            VStack(spacing: 0) {
                DataRow(label: "Corporation Tax", value: Fmt.currency(c.ct))
                DataRow(label: "Employer NI", value: Fmt.currency(c.employerNI))
                DataRow(label: "Dividend Tax", value: Fmt.currency(c.totalDivTax))
                DataRow(label: "Total Tax & NI", value: Fmt.currency(c.totalTax), highlight: true)
                DataRow(label: "Effective Tax Rate", value: Fmt.percent(c.effectiveTaxRate), highlight: true)
            }
        }
    }
}
