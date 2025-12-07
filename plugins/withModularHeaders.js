const { withPodfile } = require("expo/config-plugins");

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    // Use static frameworks for Firebase (recommended by React Native Firebase)
    if (!podfile.includes('$RNFirebaseAsStaticFramework')) {
      podfile = "$RNFirebaseAsStaticFramework = true\n\n" + podfile;
    }

    // Add modular headers for Firebase Swift dependencies
    const modularHeadersPods = `
  # Firebase pods need modular headers for Swift compatibility
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseAuth', :modular_headers => true
  pod 'FirebaseAuthInterop', :modular_headers => true
  pod 'FirebaseAppCheckInterop', :modular_headers => true
  pod 'FirebaseCoreExtension', :modular_headers => true
  pod 'RecaptchaInterop', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
`;

    // Insert after 'target ... do' line
    if (!podfile.includes("pod 'FirebaseCore', :modular_headers => true")) {
      podfile = podfile.replace(
        /(target ['"].*['"] do)/,
        `$1\n${modularHeadersPods}`
      );
    }

    config.modResults.contents = podfile;
    return config;
  });
};
