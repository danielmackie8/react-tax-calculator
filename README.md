# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## iOS App

This project is wrapped as a native iOS app using [Capacitor](https://capacitorjs.com/). The web app itself is unchanged — Capacitor packages the production build into a real Xcode project (`ios/`) that runs in a native WKWebView.

### Requirements

- A Mac with [Xcode](https://apps.apple.com/us/app/xcode/id497799835) installed (Xcode's iOS Simulator and device deployment only work on macOS)
- [CocoaPods](https://cocoapods.org/) (`sudo gem install cocoapods`)
- An [Apple Developer account](https://developer.apple.com/) (free for Simulator testing; paid, $99/yr, required to install on a physical device or submit to the App Store)

### Building and running

```bash
npm install
npm run ios:open
```

This builds the React app, copies it into the native project (`npx cap sync ios`), and opens `ios/App/App.xcworkspace` in Xcode. From Xcode:

1. Select a Simulator (or your connected iPhone) as the run target
2. Under **Signing & Capabilities**, select your Apple Developer team (needed for a physical device)
3. Press ▶ (Cmd+R) to build and run

Whenever you change the React app, re-run `npm run ios:sync` (or `npm run ios:open`) to pull the latest web build into the iOS project before rebuilding in Xcode.

### App identity

- Bundle ID: `com.danielmackie.ltdtaxcalculator`
- Display name: `IR35 Calc`

Change these in `ios/App/App.xcodeproj` (via Xcode's Signing & Capabilities / General tabs) if you need a different bundle ID for your own Apple Developer account, and update `capacitor.config.ts` (`appId`/`appName`) to match.

### App Store submission

Once you're happy with the build: in Xcode, `Product > Archive`, then use the Organizer window to upload to App Store Connect. You'll need an active Apple Developer Program membership for this step.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
