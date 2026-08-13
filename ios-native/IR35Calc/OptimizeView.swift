import SwiftUI
import Foundation

struct OptimizeView: View {
    @ObservedObject var vm: CalculatorViewModel
    @Binding var selectedTab: CalcTab

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .lastTextBaseline) {
                Text("Opportunities")
                    .font(.fraunces(20))
                    .foregroundColor(.appTextPrimary)
                Spacer()
                Pill(text: "Marginal \(String(format: "%.1f", vm.custom.marginalRate * 100))%")
            }

            VStack(spacing: 12) {
                ForEach(vm.strategies) { strategy in
                    StrategyCard(strategy: strategy) {
                        vm.apply(strategy)
                        selectedTab = .comparison
                    }
                }
            }
        }
    }
}

private struct StrategyCard: View {
    let strategy: CalculatorViewModel.Strategy
    let onApply: () -> Void

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                Text(strategy.title)
                    .font(.fraunces(15))
                    .foregroundColor(.appTextPrimary)
                Text(strategy.desc)
                    .font(.mono(12.5, .regular))
                    .foregroundColor(.appTextMuted)
                    .lineSpacing(3)

                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(strategy.subtext.uppercased())
                            .font(.mono(9, .regular))
                            .tracking(0.7)
                            .foregroundColor(.appTextFaint)
                        Text("+\(Fmt.currency(strategy.value))")
                            .font(.mono(16, .bold))
                            .foregroundColor(.appSuccess)
                    }
                    Spacer()
                    if strategy.canApply {
                        Button(action: onApply) {
                            Text("Apply")
                                .font(.mono(12, .semibold))
                                .foregroundColor(.appActiveText)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(Capsule().fill(Color.appActiveFill))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.top, 10)
                .overlay(Rectangle().fill(Color.appDivider).frame(height: 1), alignment: .top)
            }
        }
    }
}
