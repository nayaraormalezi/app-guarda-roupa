const appJson = require("./app.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins ?? []),
    "expo-secure-store",
    "expo-apple-authentication",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#1A1714",
      },
    ],
  ],
  extra: {
    ...(appJson.expo.extra ?? {}),
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "",
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    useServerAi: process.env.EXPO_PUBLIC_USE_SERVER_AI !== "0",
    eas: {
      projectId: process.env.EAS_PROJECT_ID || appJson.expo?.extra?.eas?.projectId,
    },
  },
  ios: {
    ...(appJson.expo.ios ?? {}),
    usesAppleSignIn: true,
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
      ],
    },
  },
};
