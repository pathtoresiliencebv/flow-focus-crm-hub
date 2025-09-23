module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // Support for TypeScript decorators
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      // Support for async/await
      '@babel/plugin-transform-runtime',
      // NativeWind support
      'nativewind/babel',
      // Module resolver for path aliases
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};