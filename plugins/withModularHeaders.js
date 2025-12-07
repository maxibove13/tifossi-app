const { withPodfile } = require("expo/config-plugins");

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    // Use static frameworks for Firebase (recommended by React Native Firebase)
    // This avoids Swift header generation issues with modular headers
    if (!podfile.includes('$RNFirebaseAsStaticFramework')) {
      config.modResults.contents =
        "$RNFirebaseAsStaticFramework = true\n\n" + podfile;
    }

    return config;
  });
};
