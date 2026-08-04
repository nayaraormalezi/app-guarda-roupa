const { getDefaultConfig } = require("expo/metro-config");
const { withStorybook } = require("@storybook/react-native/metro/withStorybook");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withStorybook(config, {
  // Keep Storybook out of production bundles unless explicitly enabled.
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true" || process.env.NODE_ENV !== "production",
  configPath: "./.rnstorybook",
});
