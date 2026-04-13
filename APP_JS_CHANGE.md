/**
 * App.js — ONE LINE CHANGE
 *
 * Find this prop on your <WebView> component:
 *
 *   injectedJavaScriptBeforeContentLoaded={INJECTED_JS}
 *
 * Replace with:
 *
 *   injectedJavaScriptBeforeContentLoaded={`window.API_BASE='https://carecore-api.vercel.app';${INJECTED_JS}`}
 *
 * TODO: replace the URL with your actual Vercel deployment URL after `vercel deploy`.
 *
 * That's the only change needed in App.js. Everything else stays identical.
 */
