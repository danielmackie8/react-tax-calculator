import SwiftUI
import Foundation

struct OptimizeView: View {
    @ObservedObject var vm: CalculatorViewModel
    @Binding var selectedTab: CalcTab

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Efficiency Opportunities",
                trailing: "Marginal rate: \(String(format: "%.1f", vm.custom.marginalRate * 100))%"
            )

            ForEach(vm.strategies) { strategy in
                StrategyCard(strategy: strategy) {
                    vm.apply(strategy)
                    selectedTab = .comparison
                }
            }

            Text("How this works: Values are calculated dynamically from your profit band. Savings shown are the total tax avoided (Corp Tax + dividend tax) vs. taking the money as dividends.")
                .font(.system(size: 13))
                .foregroundColor(Color.appTextSecondary)
                .padding(14)
                .background(Color.appBackgroundSubtle)
                .cornerRadius(8)
        }
    }
}

private struct StrategyCard: View {
    let strategy: CalculatorViewModel.Strategy
    let onApply: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                Text(strategy.icon)
                    .font(.system(size: 18))
                VStack(alignment: .leading, spacing: 4) {
                    Text(strategy.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color.appText)
                    Text(strategy.desc)
                        .font(.system(size: 13))
                        .foregroundColor(Color.appTextSecondary)
                }
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(strategy.subtext.uppercased())
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Color.appTextTertiary)
                    Text("+\(Fmt.currency(strategy.value))")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(Color.appSuccess)
                }
                Spacer()
                if strategy.canApply {
                    Button(action: onApply) {
                        Text("Apply →")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color.appText)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.appBackgroundMuted)
                            .cornerRadius(5)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(16)
        .background(Color.appBackground)
        .cornerRadius(8)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appBorderStrong, lineWidth: 1))
    }
}
