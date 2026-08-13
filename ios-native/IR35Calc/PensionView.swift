import SwiftUI

struct PensionView: View {
    @ObservedObject var vm: CalculatorViewModel

    private var maxBalance: Double {
        max(1, vm.projectionData.map { $0.end }.max() ?? 1)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HeroStat(
                kicker: "Pot at year 25",
                value: Fmt.currency(vm.potAt25),
                pillText: "\(Fmt.currency(vm.currentAnnualPension))/yr in",
                pillColor: .appSuccess,
                pillTint: .appSuccessTint,
                bigFontSize: 34
            )

            Card {
                VStack(spacing: 12) {
                    DesignField(label: "Current pot (£)", text: $vm.pensionStartBalance, placeholder: "0")
                    HStack(spacing: 12) {
                        DesignField(label: "Age", text: $vm.currentAge, placeholder: "35")
                        DesignField(label: "Growth (%)", text: $vm.pensionGrowth, placeholder: "5")
                    }
                }
            }
            .dismissKeyboardOnTap()

            Card {
                VStack(alignment: .leading, spacing: 14) {
                    Text("25-year projection")
                        .font(.fraunces(16))
                        .foregroundColor(.appTextPrimary)

                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(vm.projectionData) { row in
                                ProgressBarRow(
                                    label: "Age \(Fmt.roundedString(row.age))",
                                    value: Fmt.currency(row.end),
                                    percent: row.end / maxBalance * 100,
                                    bold: row.isMillionRow,
                                    labelSize: 12,
                                    barHeight: 6
                                )
                            }
                        }
                    }
                    .frame(maxHeight: 280)
                }
            }
        }
    }
}
