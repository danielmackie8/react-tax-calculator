import SwiftUI

// Design tokens ported 1:1 from the "Studio Dashboard" design handoff.
// Fixed light palette only — the handoff locks final colors, no dark
// mode variant was specified.
extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }

    static let appBackground   = Color(hex: 0xF5F5F3)
    static let appCard         = Color(hex: 0xFFFFFF)
    static let appTextPrimary  = Color(hex: 0x14151A)
    static let appTextSecondary = Color(hex: 0x98999F)
    static let appTextMuted    = Color(hex: 0x5C5D63)
    static let appTextFaint    = Color(hex: 0xB4B5BA)
    static let appDivider      = Color(hex: 0xF0F0EE)
    static let appSuccess      = Color(hex: 0x2F9E44)
    static let appSuccessTint  = Color(hex: 0xE6F6EA)
    static let appDanger       = Color(hex: 0xE03131)
    static let appDangerTint   = Color(hex: 0xFDECEC)
    static let appTrack        = Color(hex: 0xEEEEEC)
    static let appActiveFill   = Color(hex: 0x14151A)
    static let appActiveText   = Color(hex: 0xFFFFFF)
    static let appNavActiveBg  = Color(hex: 0xF0F0EE)
}

// Fraunces (serif) for titles only; JetBrains Mono for everything else —
// both bundled as static instances in Fonts/ and registered via
// project.yml's UIAppFonts. See ios-native/README.md for provenance.
extension Font {
    static func fraunces(_ size: CGFloat) -> Font {
        .custom("FrauncesRoman-SemiBold", size: size)
    }

    enum MonoWeight {
        case regular, medium, semibold, bold

        var postScriptName: String {
            switch self {
            case .regular: return "JetBrainsMono-Regular"
            case .medium: return "JetBrainsMono-Medium"
            case .semibold: return "JetBrainsMono-SemiBold"
            case .bold: return "JetBrainsMono-Bold"
            }
        }
    }

    static func mono(_ size: CGFloat, _ weight: MonoWeight = .regular) -> Font {
        .custom(weight.postScriptName, size: size)
    }
}
