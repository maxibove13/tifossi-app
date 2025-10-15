/**
 * Custom path builder for Detox artifacts
 * Organizes test artifacts in a structured way
 */

const path = require('path');

class CustomPathBuilder {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
  }

  buildPathForTestArtifact(artifactName, testSummary) {
    const platform = testSummary.invocations[0]?.deviceId?.includes('android') ? 'android' : 'ios';
    const testName = testSummary.title.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_');

    // Create directory structure: platform/date/test_name/
    const dateDir = new Date().toISOString().slice(0, 10);
    const testDir = `${testName}_${timestamp}`;

    return path.join(this.rootDir, platform, dateDir, testDir, artifactName);
  }
}

module.exports = CustomPathBuilder;
