const { withPodfile } = require("expo/config-plugins");

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    // Add use_modular_headers! after prepare_react_native_project! if not already present
    if (!podfile.includes("use_modular_headers!")) {
      config.modResults.contents = podfile.replace(
        "prepare_react_native_project!",
        "prepare_react_native_project!\n\nuse_modular_headers!"
      );
    }

    return config;
  });
};
