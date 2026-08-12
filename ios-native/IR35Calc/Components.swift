import SwiftUI
import UIKit

// MARK: - Segmented control (matches .seg / .seg-btn)

struct SegmentedControl<T: Hashable>: View {
    let options: [SegmentOption<T>]
    @Binding var selection: T

    var body: some View {
        HStack(spacing: 2) {
            ForEach(options) { option in
                Button {
                    selection = option.value
                } label: {
                    Text(option.label)
                        .font(.system(size: 13, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 7)
                        .background(selection == option.value ? Color.appBackground : Color.clear)
                        .foregroundColor(selection == option.value ? Color.appText : Color.appTextSecondary)
                        .cornerRadius(5)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(Color.appBackgroundMuted)
        .cornerRadius(8)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appBorderStrong, lineWidth: 1))
    }
}

// MARK: - Labeled text field (matches .field / .input-wrap)

struct LabeledField: View {
    let label: String
    @Binding var text: String
    var prefix: String? = nil
    var suffix: String? = nil
    var placeholder: String = "0"
    var hint: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .bold))
                .tracking(0.5)
                .foregroundColor(Color.appTextSecondary)

            HStack(spacing: 0) {
                if let prefix = prefix {
                    Text(prefix)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color.appTextSecondary)
                        .padding(.horizontal, 10)
                        .frame(height: 36)
                        .background(Color.appBackgroundMuted)
                }
                TextField(placeholder, text: $text)
                    .keyboardType(.decimalPad)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(Color.appText)
                    .padding(.horizontal, 10)
                    .frame(height: 36)
                if let suffix = suffix {
                    Text(suffix)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color.appTextSecondary)
                        .padding(.horizontal, 10)
                        .frame(height: 36)
                        .background(Color.appBackgroundMuted)
                }
            }
            .background(Color.appBackground)
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.appBorderStrong, lineWidth: 1))

            if let hint = hint {
                Text(hint)
                    .font(.system(size: 11))
                    .foregroundColor(Color.appTextTertiary)
            }
        }
    }
}

// MARK: - Stat card (matches .stat-card)

struct StatCard: View {
    let label: String
    let value: String
    var isPrimary: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .bold))
                .tracking(0.5)
                .foregroundColor(isPrimary ? Color.appPrimaryForeground.opacity(0.6) : Color.appTextSecondary)
            Text(value)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(isPrimary ? Color.appPrimaryForeground : Color.appText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(isPrimary ? Color.appPrimary : Color.appBackgroundSubtle)
        .cornerRadius(10)
    }
}

// MARK: - Section header (matches .section-header)

struct SectionHeader: View {
    let title: String
    var trailing: String? = nil

    var body: some View {
        HStack {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .bold))
                .tracking(0.6)
                .foregroundColor(Color.appTextSecondary)
            Spacer()
            if let trailing = trailing {
                Text(trailing)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
            }
        }
        .padding(.top, 16)
        .padding(.bottom, 6)
    }
}

// MARK: - Data row (label / value line used throughout the Breakdown tab)

struct DataRow: View {
    let label: String
    let value: String
    var tint: Color? = nil
    var bold: Bool = false
    var highlight: Bool = false

    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.system(size: 14, weight: bold ? .bold : .regular))
                .foregroundColor(Color.appText)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: bold ? .bold : .regular, design: .monospaced))
                .foregroundColor(tint ?? Color.appText)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 10)
        .padding(.horizontal, highlight ? 10 : 0)
        .background(highlight ? Color.appBackgroundMuted : Color.clear)
        .cornerRadius(highlight ? 6 : 0)
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
