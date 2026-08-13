import SwiftUI

struct ComparisonView: View {
    @ObservedObject var vm: CalculatorViewModel

    private struct Row: Identifiable {
        let id: String
        let label: String
        let monthly: Double
        let bold: Bool
    }

    private var rows: [Row] {
        [
            Row(id: "none", label: "No pension", monthly: vm.scenarioNoPension.monthlyNet, bold: false),
            Row(id: "1k", label: "£1k / mo pension", monthly: vm.scenario1000.monthlyNet, bold: false),
            Row(id: "user", label: "Your input", monthly: vm.custom.monthlyNet, bold: true),
        ]
    }

    private var maxMonthly: Double {
        max(1, rows.map { max(0, $0.monthly) }.max() ?? 1)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HeroStat(
                kicker: "Net monthly · your input",
                value: Fmt.currency(vm.custom.monthlyNet),
                pillText: "\(vm.trendArrow) \(Fmt.percent(vm.custom.effectiveTaxRate)) tax",
                pillColor: vm.trendColor,
                pillTint: vm.trendTint
            )

            Card {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Scenarios")
                        .font(.fraunces(16))
                        .foregroundColor(.appTextPrimary)

                    VStack(spacing: 16) {
                        ForEach(rows) { row in
                            ProgressBarRow(
                                label: row.label,
                                value: Fmt.currency(row.monthly),
                                percent: max(0, row.monthly) / maxMonthly * 100,
                                bold: row.bold
                            )
                        }
                    }
                }
            }
        }
    }
}
