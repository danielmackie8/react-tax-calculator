import SwiftUI
import UIKit

// Adaptive colors ported 1:1 from the web app's CSS custom properties
// (:root / [data-theme='dark'] in App.js), so the native app keeps the
// same light/dark palette instead of falling back to generic iOS grays.
extension Color {
    private static func adaptive(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }

    static let appBackground        = adaptive(light: 0xFFFFFF, dark: 0x0F0F0F)
    static let appBackgroundSubtle  = adaptive(light: 0xF0EDE8, dark: 0x1C1C1C)
    static let appBackgroundMuted   = adaptive(light: 0xE8E4DD, dark: 0x262626)
    static let appText              = adaptive(light: 0x111111, dark: 0xEEEEEE)
    static let appTextSecondary     = adaptive(light: 0x6B6B6B, dark: 0x888888)
    static let appTextTertiary      = adaptive(light: 0xAAAAAA, dark: 0x555555)
    static let appBorder            = adaptive(light: 0xD8D3CB, dark: 0x2E2E2E)
    static let appBorderStrong      = adaptive(light: 0xC4BEB5, dark: 0x3A3A3A)
    static let appPrimary           = adaptive(light: 0x111111, dark: 0xEEEEEE)
    static let appPrimaryForeground = adaptive(light: 0xFFFFFF, dark: 0x111111)
    static let appSuccess           = adaptive(light: 0x15803D, dark: 0x22C55E)
    static let appDanger            = adaptive(light: 0xDC2626, dark: 0xF87171)
    static let appGold              = adaptive(light: 0xFFFBEB, dark: 0x3D2700)
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}
