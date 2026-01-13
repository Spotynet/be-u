const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom Metro configuration here
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Better support for environment variables in EAS builds
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Ensure common font assets are treated as assets (important for Expo Web + Google Fonts packages)
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts || []), 'ttf', 'otf'])
);

// Ensure proper module resolution for EAS
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    react: require.resolve("react"),
    "react-dom": require.resolve("react-dom"),
};

module.exports = config;