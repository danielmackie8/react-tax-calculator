# IR35 Calc — Native SwiftUI App

This is a full native rewrite of the calculator: SwiftUI views instead of the
Capacitor/WKWebView wrapper in `../ios/`. Same tax logic, same color palette
(light + dark), swipeable tabs via a native `TabView(.page)` instead of
hand-rolled touch handling.

I can't compile or run Xcode from this environment, so instead of hand-editing
a `.xcodeproj` file blindly (risky — a malformed project file is hard to debug
without Xcode itself), this folder includes a `project.yml` for
[XcodeGen](https://github.com/yonaskolb/XcodeGen), which generates a real
`.xcodeproj` from that spec — no manual "New Project" wizard, no dragging
files in one by one.

## Option A: XcodeGen (recommended — mostly automated)

In Terminal:

```bash
brew install xcodegen
```

```bash
cd react-tax-calculator/ios-native
xcodegen generate
```

```bash
open IR35Calc.xcodeproj
```

That creates and opens a fully-formed Xcode project with all 10 Swift files
already wired into the target, deployment target set to iOS 16.0, and a
generated Info.plist. The only manual step left in Xcode is signing:

1. Click the **IR35Calc** project → **IR35Calc** target → **Signing & Capabilities**
2. Pick your Developer **Team** from the dropdown

Then Cmd+R to build and run.

Don't have Homebrew? Install it first with:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Whenever the Swift files change, just re-run `xcodegen generate` from
`ios-native/` to refresh the project — you never need to touch file
references in Xcode by hand.

## Option B: Manual Xcode wizard (fallback if XcodeGen isn't for you)

1. Open Xcode → **File → New → Project**
2. Choose **iOS → App**, then Next
3. Product Name: `IR35Calc`
4. Interface: **SwiftUI**
5. Language: **Swift**
6. Uncheck "Include Tests" (not needed)
7. Save it anywhere temporarily (e.g. Desktop) — you'll move it into the repo after
8. In the Xcode project navigator, delete the two auto-generated files
   `ContentView.swift` and `IR35CalcApp.swift` (choose "Move to Trash")
9. In Finder, drag every `.swift` file from `ios-native/IR35Calc/` into the
   Xcode project navigator, checking **"Copy items if needed"** and the
   **IR35Calc** target
10. Set **Minimum Deployments** to **iOS 16.0** under the target's General tab
11. Under **Signing & Capabilities**, pick your Developer Team
12. Cmd+R to build and run

## Once you're happy with it

Move the new `IR35Calc.xcodeproj` (and its folder) into this repo, e.g.
`ios-native/IR35Calc.xcodeproj`, and commit it. At that point you can decide
whether to delete the old `ios/` Capacitor project and the `@capacitor/*` npm
dependencies — I've left them untouched for now so nothing is lost if you want
to compare the two or roll back.

## What changed vs. the web app

- No WebView, no JS bridge, no Capacitor — every screen is a real SwiftUI view
- The tab swipe is a native `TabView(.page)` gesture, not hand-rolled touch
  event tracking
- Colors are ported as adaptive `UIColor` values (see `Theme.swift`) matching
  the original CSS custom properties, so light/dark mode looks the same
- The comparison table's mobile "cards" layout was used everywhere (rather
  than the desktop wide-table variant), since this only ever runs on iPhone
- All tax calculation logic in `Models.swift` / `CalculatorViewModel.swift` is
  a direct line-by-line port of `src/App.js` — same constants, same formulas
