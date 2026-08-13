import SwiftUI

struct ContentView: View {
    @StateObject private var vm = CalculatorViewModel()
    @State private var selectedTab: CalcTab = .setup

    var body: some View {
        VStack(spacing: 0) {
            header

            // .page style gives buttery-smooth native swipe between tabs for
            // free — no manual gesture handling needed.
            TabView(selection: $selectedTab) {
                ScrollView {
                    SetupView(vm: vm)
                        .padding(16)
                }
                .scrollDismissesKeyboard(.interactively)
                .tag(CalcTab.setup)

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

            BottomNav(selection: $selectedTab)
        }
        .background(Color.appBackground.ignoresSafeArea())
    }

    // The design spec calls for a fixed 58pt top inset baked in for the
    // notch; native SwiftUI already reserves the correct safe-area inset
    // per device automatically, so this adds modest breathing room on top
    // of that instead of stacking a second, redundant offset.
    private var header: some View {
        HStack {
            Text(selectedTab.title)
                .font(.fraunces(28))
                .foregroundColor(.appTextPrimary)
            Spacer()
            Text(vm.taxYearBadge)
                .font(.mono(12, .semibold))
                .foregroundColor(.appActiveText)
                .frame(width: 36, height: 36)
                .background(Circle().fill(Color.appActiveFill))
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }
}

struct BottomNav: View {
    @Binding var selection: CalcTab

    var body: some View {
        HStack(spacing: 4) {
            ForEach(CalcTab.allCases) { tab in
                Button {
                    selection = tab
                } label: {
                    VStack(spacing: 2) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 18, weight: .regular))
                        Text(tab.navLabel)
                            .font(.mono(8.5, .regular))
                    }
                    .foregroundColor(selection == tab ? .appTextPrimary : .appTextSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(selection == tab ? Color.appNavActiveBg : Color.clear)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.top, 8)
        .padding(.bottom, 8)
        .background(
            Color.appCard
                .overlay(Rectangle().fill(Color.appDivider).frame(height: 1), alignment: .top)
                .ignoresSafeArea(edges: .bottom)
        )
    }
}
