import SwiftUI

struct SetupView: View {
    @ObservedObject var vm: CalculatorViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HeroStat(
                kicker: "Net monthly",
                value: Fmt.currency(vm.custom.monthlyNet),
                pillText: "\(vm.trendArrow) \(Fmt.percent(vm.custom.effectiveTaxRate)) tax",
                pillColor: vm.trendColor,
                pillTint: vm.trendTint
            )

            Card {
                VStack(spacing: 10) {
                    SegmentedPill(
                        options: TaxYear.allCases.map { SegmentOption($0, $0.segmentLabel) },
                        selection: $vm.taxYear
                    )
                    SegmentedPill(
                        options: [
                            SegmentOption(IncomeMode.dayRate, "Day rate"),
                            SegmentOption(IncomeMode.annualTurnover, "Turnover"),
                        ],
                        selection: $vm.incomeMode
                    )

                    if vm.isDayRate {
                        VStack(spacing: 8) {
                            DesignField(label: "Daily rate (£)", text: $vm.dailyRate, placeholder: "600")
                            DesignField(
                                label: "Personal holidays (days)", text: $vm.holidays, placeholder: "25",
                                hint: "261 − 8 BH − \(vm.holidays.isEmpty ? "0" : vm.holidays) = \(Fmt.roundedString(vm.workingDays)) working days"
                            )
                            DesignField(label: "Monthly pension (£/mo)", text: $vm.monthlyPension, placeholder: "0")
                        }
                    } else {
                        VStack(spacing: 8) {
                            DesignField(label: "Annual turnover (£)", text: $vm.annualTurnover, placeholder: "0")
                            DesignField(label: "Annual pension (£)", text: $vm.annualPension, placeholder: "0")
                        }
                    }

                    DesignField(label: "Annual expenses (£)", text: $vm.yearlyExpenses, placeholder: "0")
                }
            }
            .dismissKeyboardOnTap()

            HStack(spacing: 10) {
                SmallCard {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("NET ANNUAL")
                            .font(.mono(10, .regular))
                            .tracking(0.8)
                            .foregroundColor(.appTextSecondary)
                        HStack {
                            Text(Fmt.currency(vm.custom.annualNet))
                                .font(.mono(17, .bold))
                                .foregroundColor(.appTextPrimary)
                            Spacer()
                            Text(vm.trendArrow)
                                .font(.mono(12, .regular))
                                .foregroundColor(vm.trendColor)
                        }
                    }
                }
                SmallCard {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("EFFECTIVE TAX")
                            .font(.mono(10, .regular))
                            .tracking(0.8)
                            .foregroundColor(.appTextSecondary)
                        Text(Fmt.percent(vm.custom.effectiveTaxRate))
                            .font(.mono(17, .bold))
                            .foregroundColor(.appTextPrimary)
                    }
                }
            }
        }
    }
}
