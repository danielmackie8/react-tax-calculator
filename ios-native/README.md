# IR35 Calc — Native SwiftUI App

This is a full native rewrite of the calculator: SwiftUI views instead of the
Capacitor/WKWebView wrapper in `../ios/`. Same tax logic, same color palette
(light + dark), swipeable tabs via a native `TabView(.page)` instead of
hand-rolled touch handling.

I can't compile or run Xcode from this environment, so instead of hand-editing
a `.xcodeproj` file blindly (risky — a malformed project file is hard to debug
without Xcode itself), this folder just contains the Swift source files.
Creating the actual Xcode project takes about 5 minutes:

## 1. Create a fresh Xcode project

1. Open Xcode → **File → New → Project**
2. Choose **iOS → App**, then Next
3. Product Name: `IR35Calc`
4. Interface: **SwiftUI**
5. Language: **Swift**
6. Uncheck "Include Tests" (not needed)
7. Save it anywhere temporarily (e.g. Desktop) — you'll move it into the repo after

## 2. Swap in these files

1. In the Xcode project navigator, delete the two auto-generated files
   `ContentView.swift` and `IR35CalcApp.swift` (choose "Move to Trash")
2. In Finder, drag every `.swift` file from this folder
   (`ios-native/IR35Calc/`) into the Xcode project navigator
3. When prompted, check **"Copy items if needed"** and make sure
   **"IR35Calc" target** is checked

## 3. Project settings

1. Select the project in the navigator → the **IR35Calc** target → **General**
2. Set **Minimum Deployments** to **iOS 16.0**
3. Go to **Signing & Capabilities**:
   - Pick your Developer Team
   - Set **Bundle Identifier** to `com.danielmackie.ltdtaxcalculator` if you
     want this to be recognized as an update to the app already on your phone
     (delete the old wrapper app first if you do this — see the note below)

## 4. Build & run

Cmd+R, pick your Simulator or device, and it should launch showing "IR35 Calc"
with the same inputs panel and swipeable Comparison / Breakdown / Pension /
Optimise tabs as the web version.

## 5. Once you're happy with it

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
