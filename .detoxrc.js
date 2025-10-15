/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/tifossi.app',
      build:
        'xcodebuild -workspace ios/tifossi.xcworkspace -scheme tifossi -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/tifossi.app',
      build:
        'xcodebuild -workspace ios/tifossi.xcworkspace -scheme tifossi -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    'ios.sim.debug': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
      apps: ['ios.debug'],
    },
    'ios.sim.release': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
      apps: ['ios.release'],
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33',
      },
    },
    'android.emu.debug': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33',
      },
      apps: ['android.debug'],
    },
    'android.emu.release': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33',
      },
      apps: ['android.release'],
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'ios.sim.debug',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'ios.sim.release',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'android.emu.debug',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'android.emu.release',
      app: 'android.release',
    },
  },
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: false,
    },
    cleanup: {
      shutdownDevice: false,
    },
  },
  artifacts: {
    rootDir: './e2e/artifacts',
    pathBuilder: './e2e/config/pathBuilder.js',
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: true,
          testDone: true,
          appNotReady: true,
        },
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
        android: {
          bitRate: 4000000,
        },
        simulator: {
          codec: 'h264',
        },
      },
      timeline: {
        enabled: true,
      },
      uiHierarchy: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
    },
  },
  logger: {
    level: 'info',
    overrideConsole: true,
    options: {
      showLoggerName: true,
      showLevel: true,
      showTimestamp: true,
    },
  },
};
