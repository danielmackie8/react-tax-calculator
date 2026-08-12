import SwiftUI
import Foundation

struct ComparisonView: View {
    @ObservedObject var vm: CalculatorViewModel

    private struct Row: Identifiable {
        let id: String
        let label: String
        let data: ScenarioResult
        let isUser: Bool
    }

    private var rows: [Row] {
        let pension = vm.currentAnnualPension
        let monthlyK = pension / 12 / 1000
        let userLabel: String
        if pension > 0 {
            let isWhole = monthlyK.truncatingRemainder(dividingBy: 1) == 0
            let kStr = isWhole ? String(format: "%.0f", monthlyK) : String(format: "%.1f", monthlyK)
            userLabel = "Your input — \(kStr)k / mo"
        } else {
            userLabel = "Your input"
        }
        return [
            Row(id: "none", label: "No Pension", data: vm.scenarioNoPension, isUser: false),
            Row(id: "1k", label: "£1k / mo pension", data: vm.scenario1000, isUser: false),
            Row(id: "user", label: userLabel, data: vm.custom, isUser: true),
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                StatCard(label: "Net Annual", value: Fmt.currency(vm.custom.annualNet), isPrimary: true)
                StatCard(label: "Net Monthly", value: Fmt.currency(vm.custom.monthlyNet))
                StatCard(label: "Annual Pension", value: Fmt.currency(vm.custom.pension))
                StatCard(label: "Effective Tax", value: Fmt.percent(vm.custom.effectiveTaxRate))
            }

            VStack(spacing: 8) {
                ForEach(rows) { row in
                    ScenarioCard(title: row.label, data: row.data, isActive: row.isUser)
                }
            }
        }
    }
}

private struct ScenarioCard: View {
    let title: String
    let data: ScenarioResult
    let isActive: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color.appText)
                .padding(.bottom, 10)

            scenarioRow("Net monthly", Fmt.currency(data.monthlyNet), big: true)
            scenarioRow("Net annual", Fmt.currency(data.annualNet))
            scenarioRow("Eff. tax", Fmt.percent(data.effectiveTaxRate))
        }
        .padding(14)
        .background(isActive ? Color.appBackgroundSubtle : Color.appBackground)
        .cornerRadius(8)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appBorder, lineWidth: 1))
    }

    private func scenarioRow(_ label: String, _ value: String, big: Bool = false) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(Color.appTextSecondary)
            Spacer()
            Text(value)
                .font(.system(size: big ? 17 : 15, weight: big ? .bold : .semibold))
                .foregroundColor(Color.appText)
        }
        .padding(.vertical, 5)
    }
}
