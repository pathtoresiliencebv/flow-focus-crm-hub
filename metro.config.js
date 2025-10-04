const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript path aliases
config.resolver.alias = {
  '@': './src',
};

// Add support for additional file extensions
config.resolver.sourceExts.push('sql', 'db');

// Enable web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = withNativeWind(config, { input: './src/index.css' });