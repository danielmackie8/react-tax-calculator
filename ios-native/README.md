# IR35 Calc — Native SwiftUI App

This is a full native rewrite of the calculator: SwiftUI views instead of the
Capacitor/WKWebView wrapper in `../ios/`. Same tax logic as the web app,
swipeable tabs via a native `TabView(.page)` instead of hand-rolled touch
handling.

## Design

The visual design follows the "Studio Dashboard" handoff (a locked,
high-fidelity spec — colors/type/spacing were not up for interpretation):

- **Fixed light palette** — `#f5f5f3` background, white cards, `#14151a`
  primary text. No dark mode variant was specified in the handoff, so unlike
  a typical iOS app this one doesn't adapt to the system appearance.
- **Two custom fonts**: Fraunces (serif, titles only) and JetBrains Mono
  (everything else — labels, numbers, inputs, buttons, nav). Both are
  open-source (SIL Open Font License) and bundled as static `.ttf` files in
  `IR35Calc/Fonts/`, registered via `UIAppFonts` in `project.yml`. Fraunces
  ships upstream as a variable font; I instantiated a static SemiBold cut
  from it with `fonttools` rather than relying on iOS resolving a named
  instance at runtime, since I can't test that here — see
  `IR35Calc/Fonts/*-OFL.txt` for license text and attribution.
- **One known deviation**: the bottom nav icons use SF Symbols
  (`gearshape`, `chart.line.uptrend.xyaxis`, `rectangle.grid.1x2`, `clock`,
  `sparkles`) rather than the exact Lucide icon paths in the handoff. The
  Lucide paths (especially the Setup gear and Optimise sparkle) are dense
  arc-heavy SVG data I couldn't safely hand-transcribe into SwiftUI `Path`
  without a way to visually verify the result. SF Symbols read the same at
  a glance but aren't pixel-identical to the spec.
- 5 tabs instead of the previous 4 — **Setup** is now its own swipeable tab
  (holding the tax year/income inputs) rather than a panel pinned above the
  others, matching the handoff's bottom-nav structure.

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

That creates and opens a fully-formed Xcode project with all 11 Swift files
and the 5 bundled font files already wired into the target, deployment
target set to iOS 16.0, and a generated Info.plist. The only manual step
left in Xcode is signing:

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

XcodeGen handles font registration automatically via `project.yml`; going
this route means doing that part by hand too (steps 9–10 below).

1. Open Xcode → **File → New → Project**
2. Choose **iOS → App**, then Next
3. Product Name: `IR35Calc`
4. Interface: **SwiftUI**
5. Language: **Swift**
6. Uncheck "Include Tests" (not needed)
7. Save it anywhere temporarily (e.g. Desktop) — you'll move it into the repo after
8. In the Xcode project navigator, delete the two auto-generated files
   `ContentView.swift` and `IR35CalcApp.swift` (choose "Move to Trash")
9. In Finder, drag every `.swift` file **and the `Fonts` folder** from
   `ios-native/IR35Calc/` into the Xcode project navigator, checking
   **"Copy items if needed"** and the **IR35Calc** target
10. Open **Info.plist**, add a **Fonts provided by application**
    (`UIAppFonts`) array with 5 items: `Fraunces-SemiBold.ttf`,
    `JetBrainsMono-Regular.ttf`, `JetBrainsMono-Medium.ttf`,
    `JetBrainsMono-SemiBold.ttf`, `JetBrainsMono-Bold.ttf`
11. Set **Minimum Deployments** to **iOS 16.0** under the target's General tab
12. Under **Signing & Capabilities**, pick your Developer Team
13. Cmd+R to build and run

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
- The visual design (colors, type, layout, copy) follows the Studio Dashboard
  handoff described above rather than the web app's own look — see that
  section for what's locked vs. adapted
- All tax calculation logic in `Models.swift` / `CalculatorViewModel.swift` is
  a direct line-by-line port of `src/App.js` — same constants, same formulas
