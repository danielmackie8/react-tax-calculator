import SwiftUI

struct ContentView: View {
    @StateObject private var vm = CalculatorViewModel()
    @State private var selectedTab: CalcTab = .comparison

    var body: some View {
        VStack(spacing: 0) {
            Text("IR35 Calc")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(Color.appText)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 12)

            InputsPanel(vm: vm)
                .padding(.horizontal, 16)
                .dismissKeyboardOnTap()

            TabSelector(selection: $selectedTab)
                .padding(.horizontal, 16)
                .padding(.top, 12)

            // .page style gives buttery-smooth native swipe between tabs for
            // free — no manual gesture handling needed, unlike the WebView
            // version.
            TabView(selection: $selectedTab) {
                ScrollView {
                    ComparisonView(vm: vm)
                        .padding(16)
                }
                .scrollDismissesKeyboard(.interactively)
                .tag(CalcTab.comparison)

                ScrollView {
                    BreakdownView(vm: vm)
                        .padding(16)
                }
                .scrollDismissesKeyboard(.interactively)
                .tag(CalcTab.breakdown)

                ScrollView {
                    PensionView(vm: vm)
                        .padding(16)
                }
                .scrollDismissesKeyboard(.interactively)
                .tag(CalcTab.pension)

                ScrollView {
                    OptimizeView(vm: vm, selectedTab: $selectedTab)
                        .padding(16)
                }
                .scrollDismissesKeyboard(.interactively)
                .tag(CalcTab.optimize)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.appBackground.ignoresSafeArea())
    }
}

struct TabSelector: View {
    @Binding var selection: CalcTab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(CalcTab.allCases) { tab in
                Button {
                    selection = tab
                } label: {
                    Text(tab.title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(selection == tab ? (tab == .optimize ? Color.appSuccess : Color.appText) : Color.appTextSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .overlay(
                            Rectangle()
                                .fill(selection == tab ? (tab == .optimize ? Color.appSuccess : Color.appText) : Color.clear)
                                .frame(height: 2),
                            alignment: .bottom
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .overlay(Rectangle().fill(Color.appBorderStrong).frame(height: 1), alignment: .bottom)
    }
}

struct InputsPanel: View {
    @ObservedObject var vm: CalculatorViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SegmentedControl(
                options: TaxYear.allCases.map { SegmentOption($0, $0.segmentLabel) },
                selection: $vm.taxYear
            )
            SegmentedControl(
                options: IncomeMode.allCases.map { SegmentOption($0, $0.rawValue) },
                selection: $vm.incomeMode
            )

            if vm.isDayRate {
                LabeledField(label: "Daily Rate", text: $vm.dailyRate, prefix: "£", placeholder: "600")
                LabeledField(
                    label: "Personal Holidays", text: $vm.holidays, suffix: "days", placeholder: "25",
                    hint: "261 − 8 BH − \(vm.holidays.isEmpty ? "0" : vm.holidays) = \(Fmt.roundedString(vm.workingDays)) working days"
                )
                LabeledField(label: "Monthly Pension", text: $vm.monthlyPension, prefix: "£", suffix: "/mo", placeholder: "0")
            } else {
                LabeledField(label: "Annual Turnover", text: $vm.annualTurnover, prefix: "£", placeholder: "0")
                LabeledField(label: "Annual Pension", text: $vm.annualPension, prefix: "£", placeholder: "0")
            }

            LabeledField(label: "Annual Expenses", text: $vm.yearlyExpenses, prefix: "£", placeholder: "0")
        }
        .padding(14)
        .background(Color.appBackgroundSubtle)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorderStrong, lineWidth: 1))
    }
}
