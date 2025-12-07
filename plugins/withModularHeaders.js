const { withPodfile } = require("expo/config-plugins");

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    // Remove global use_modular_headers! if present (causes ReactCommon redefinition)
    let newPodfile = podfile.replace(/\n\nuse_modular_headers!/g, '');
    newPodfile = newPodfile.replace(/use_modular_headers!\n/g, '');

    // Add Firebase-specific modular headers in post_install
    if (!newPodfile.includes(':modular_headers => true')) {
      // Add pod-specific modular headers for Firebase before use_expo_modules!
      const firebasePods = `
  # Firebase pods need modular headers for Swift compatibility
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseAuth', :modular_headers => true
  pod 'FirebaseAuthInterop', :modular_headers => true
  pod 'FirebaseAppCheckInterop', :modular_headers => true
  pod 'FirebaseCoreExtension', :modular_headers => true
  pod 'RecaptchaInterop', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true

`;
      newPodfile = newPodfile.replace(
        "use_expo_modules!",
        firebasePods + "  use_expo_modules!"
      );
    }

    config.modResults.contents = newPodfile;
    return config;
  });
};
