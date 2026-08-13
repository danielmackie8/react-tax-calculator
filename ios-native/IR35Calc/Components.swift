import SwiftUI
import UIKit

// MARK: - Card containers

struct Card<Content: View>: View {
    let cornerRadius: CGFloat
    let padding: CGFloat
    let content: Content

    init(cornerRadius: CGFloat = 20, padding: CGFloat = 18, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .background(Color.appCard)
            .cornerRadius(cornerRadius)
            .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 4)
    }
}

struct SmallCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(16)
            .background(Color.appCard)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Hero stat (kicker label, big number, trend/value pill)

struct HeroStat: View {
    let kicker: String
    let value: String
    let pillText: String
    let pillColor: Color
    let pillTint: Color
    var bigFontSize: CGFloat = 38

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(kicker.uppercased())
                .font(.mono(11, .regular))
                .tracking(1.1)
                .foregroundColor(.appTextSecondary)
            HStack(alignment: .lastTextBaseline, spacing: 10) {
                Text(value)
                    .font(.mono(bigFontSize, .bold))
                    .foregroundColor(.appTextPrimary)
                Pill(text: pillText, color: pillColor, tint: pillTint)
            }
        }
    }
}

// MARK: - Segmented pill control (tax year / income mode toggles)

struct SegmentedPill<T: Hashable>: View {
    let options: [SegmentOption<T>]
    @Binding var selection: T

    var body: some View {
        HStack(spacing: 4) {
            ForEach(options) { option in
                Button {
                    selection = option.value
                } label: {
                    Text(option.label)
                        .font(.mono(12.5, .semibold))
                        .foregroundColor(selection == option.value ? .appActiveText : .appTextSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background(
                            Capsule().fill(selection == option.value ? Color.appActiveFill : Color.clear)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Capsule().fill(Color.appTrack))
    }
}

// MARK: - Text field (Setup / Pension inputs)

struct DesignField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = "0"
    var hint: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.mono(11, .regular))
                .foregroundColor(.appTextSecondary)
            TextField(placeholder, text: $text)
                .keyboardType(.decimalPad)
                .font(.mono(15, .regular))
                .foregroundColor(.appTextPrimary)
                .padding(13)
                .background(Color.appBackground)
                .cornerRadius(14)
            if let hint = hint {
                Text(hint)
                    .font(.mono(11, .regular))
                    .foregroundColor(.appTextFaint)
            }
        }
    }
}

// MARK: - Progress bar row (Comparison scenarios, Pension projection)

struct ProgressBarRow: View {
    let label: String
    let value: String
    let percent: Double // 0...100
    var bold: Bool = false
    var labelSize: CGFloat = 13
    var barHeight: CGFloat = 8

    private var clampedPercent: CGFloat {
        CGFloat(max(2, min(100, percent)))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label)
                    .font(.mono(labelSize, bold ? .semibold : .regular))
                    .foregroundColor(.appTextMuted)
                Spacer()
                Text(value)
                    .font(.mono(labelSize, .bold))
                    .foregroundColor(.appTextPrimary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.appTrack)
                    Capsule()
                        .fill(Color.appActiveFill)
                        .frame(width: geo.size.width * clampedPercent / 100)
                }
            }
            .frame(height: barHeight)
        }
    }
}

// MARK: - Plain data line (Breakdown cards)

struct DataLine: View {
    let label: String
    let value: String
    var tint: Color? = nil
    var bold: Bool = false
    var showDivider: Bool = true

    var body: some View {
        HStack {
            Text(label)
                .font(.mono(12.5, bold ? .semibold : .regular))
                .foregroundColor(bold ? .appTextPrimary : .appTextMuted)
            Spacer()
            Text(value)
                .font(.mono(12.5, bold ? .bold : .regular))
                .foregroundColor(tint ?? .appTextPrimary)
        }
        .padding(.vertical, 7)
        .overlay(
            Rectangle()
                .fill(Color.appDivider)
                .frame(height: 1)
                .opacity(showDivider ? 1 : 0),
            alignment: .bottom
        )
    }
}

// MARK: - Small pill badge

struct Pill: View {
    let text: String
    var color: Color = .appSuccess
    var tint: Color = .appSuccessTint
    var font: Font = .mono(12, .semibold)

    var body: some View {
        Text(text)
            .font(font)
            .foregroundColor(color)
            .padding(.horizontal, 11)
            .padding(.vertical, 5)
            .background(Capsule().fill(tint))
    }
}

// MARK: - Keyboard dismissal helper (decimal pad has no Return key)

extension View {
    func dismissKeyboardOnTap() -> some View {
        onTapGesture {
            UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        }
    }
}
