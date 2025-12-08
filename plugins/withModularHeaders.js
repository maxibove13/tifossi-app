const { withPodfile } = require("expo/config-plugins");

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    // $RNFirebaseAsStaticFramework is required by React Native Firebase
    if (!podfile.includes('$RNFirebaseAsStaticFramework')) {
      podfile = "$RNFirebaseAsStaticFramework = true\n\n" + podfile;
    }

    // Add post_install hook to enable modules for Firebase pods
    // This is needed for Swift compatibility without conflicting pod declarations
    const moduleEnablingHook = `
    # Enable modules for Firebase Swift compatibility
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('Firebase') ||
         target.name.start_with?('GoogleUtilities') ||
         target.name == 'RecaptchaInterop' ||
         target.name == 'GTMSessionFetcher'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
          config.build_settings['DEFINES_MODULE'] = 'YES'
        end
      end
    end
`;

    // Insert into existing post_install or create one
    if (podfile.includes('post_install do |installer|')) {
      if (!podfile.includes('CLANG_ENABLE_MODULES')) {
        podfile = podfile.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${moduleEnablingHook}`
        );
      }
    }

    config.modResults.contents = podfile;
    return config;
  });
};
