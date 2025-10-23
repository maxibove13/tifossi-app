const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    blockList: [
      // Exclude test files from bundle
      /.*\/__tests__\/.*$/,
      /.*\.test\.[jt]sx?$/,
      /.*\/_tests\/.*$/,
      // Exclude mock files from bundle
      /.*\/__mocks__\/.*$/,
      // Exclude backend directory (Strapi) from React Native bundle
      /^.*\/backend\/.*$/,
    ],
  };

  return config;
})();
