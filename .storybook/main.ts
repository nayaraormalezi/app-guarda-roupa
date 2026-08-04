import type { StorybookConfig } from "@storybook/react-native-web-vite";
import { mergeConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-native-web-vite",
    options: {
      modulesToTranspile: [
        "react-native-reanimated",
        "react-native-worklets",
        "lucide-react-native",
        "@expo-google-fonts/playfair-display",
        "@expo-google-fonts/inter",
        "expo-font",
      ],
      pluginReactOptions: {
        babel: {
          plugins: ["react-native-reanimated/plugin"],
        },
      },
    },
  },
  async viteFinal(config) {
    const base = process.env.STORYBOOK_BASE || "/";
    return mergeConfig(config, {
      base,
      resolve: {
        alias: {
          "@": path.resolve(dirname, "../src"),
        },
      },
      define: {
        global: "globalThis",
        __DEV__: JSON.stringify(true),
      },
    });
  },
  staticDirs: [],
};

export default config;
