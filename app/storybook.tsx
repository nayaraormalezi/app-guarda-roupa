import React from "react";
import { Redirect } from "expo-router";

/**
 * Design-system Storybook — only available in development.
 * Open via Mais → Storybook or /storybook
 */
export default function StorybookScreen() {
  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const StorybookUI = require("../.rnstorybook").default as React.ComponentType;
  return <StorybookUI />;
}
