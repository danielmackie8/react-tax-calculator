import SwiftUI
import Foundation

struct PensionView: View {
    @ObservedObject var vm: CalculatorViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(spacing: 12) {
                LabeledField(label: "Current Pot", text: $vm.pensionStartBalance, prefix: "£", placeholder: "0")
                LabeledField(label: "Current Age", text: $vm.currentAge, suffix: "yrs", placeholder: "35")
                LabeledField(label: "Annual Growth", text: $vm.pensionGrowth, suffix: "%", placeholder: "5")
            }
            .padding(.bottom, 8)

            SectionHeader(title: "25-Year Projection", trailing: "Contributing \(Fmt.currency(vm.currentAnnualPension)) / yr")

            VStack(spacing: 0) {
                HStack {
                    Text("AGE").frame(width: 40, alignment: .leading)
                    Spacer()
                    Text("CONTRIB.").frame(width: 68, alignment: .trailing)
                    Text("GROWTH").frame(width: 68, alignment: .trailing)
                    Text("TOTAL POT").frame(width: 88, alignment: .trailing)
                }
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color.appTextSecondary)
                .padding(.vertical, 8)

                ForEach(vm.projectionData) { row in
                    HStack {
                        Text(Fmt.roundedString(row.age)).frame(width: 40, alignment: .leading)
                        Spacer()
                        Text(Fmt.currency(row.contrib)).frame(width: 68, alignment: .trailing)
                        Text(Fmt.currency(row.growth)).frame(width: 68, alignment: .trailing)
                        Text(Fmt.currency(row.end))
                            .fontWeight(row.isMillionRow ? .bold : .regular)
                            .frame(width: 88, alignment: .trailing)
                    }
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundColor(Color.appText)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 6)
                    .background(row.isMillionRow ? Color.appGold : Color.clear)
                    .cornerRadius(row.isMillionRow ? 4 : 0)
                }
            }
        }
    }
}
