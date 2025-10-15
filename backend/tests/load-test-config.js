/**
 * Load Testing Configuration for Tifossi Backend Migration
 *
 * This module provides comprehensive configuration for load testing scenarios,
 * including Artillery configurations, test data management, and performance
 * monitoring setup for the Tifossi backend migration.
 */

const path = require('path');
const { TestDataGenerator } = require('./test-data-generator');

/**
 * Load Test Configuration Manager
 * Manages different load testing scenarios and their configurations
 */
class LoadTestConfig {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.baseUrls = {
      development: 'http://localhost:1337',
      staging: 'https://staging-api.tifossi.com',
      production: 'https://api.tifossi.com',
    };

    this.testDataGenerator = new TestDataGenerator();
    this.scenarios = this.initializeScenarios();
  }

  /**
   * Initialize all load testing scenarios
   */
  initializeScenarios() {
    return {
      baseline: this.createBaselineScenario(),
      normalLoad: this.createNormalLoadScenario(),
      peakLoad: this.createPeakLoadScenario(),
      stressTest: this.createStressTestScenario(),
      enduranceTest: this.createEnduranceTestScenario(),
      spikeTest: this.createSpikeTestScenario(),
      blackFridaySimulation: this.createBlackFridayScenario(),
      mobileAppLoad: this.createMobileAppLoadScenario(),
    };
  }

  /**
   * Get configuration for specific scenario
   */
  getScenarioConfig(scenarioName) {
    const scenario = this.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    return {
      ...scenario,
      config: {
        ...scenario.config,
        target: this.baseUrls[this.environment],
      },
    };
  }

  /**
   * Baseline Performance Testing Scenario
   * Single user operations to establish performance baselines
   */
  createBaselineScenario() {
    return {
      name: 'baseline_performance',
      description: 'Baseline performance testing with single user operations',
      duration: '5m',
      config: {
        phases: [
          { duration: '1m', arrivalRate: 1, name: 'Warm up' },
          { duration: '3m', arrivalRate: 1, name: 'Baseline measurement' },
          { duration: '1m', arrivalRate: 1, name: 'Cool down' },
        ],
        payload: {
          path: path.join(__dirname, 'fixtures/csv/users.csv'),
          fields: ['email', 'password', 'jwt_token'],
        },
      },
      scenarios: [
        {
          name: 'Product Catalog Operations',
          weight: 40,
          flow: [
            {
              get: {
                url: '/api/products?_limit=20',
                expect: {
                  statusCode: 200,
                  contentType: 'json',
                },
                capture: {
                  json: '$.data[0].id',
                  as: 'firstProductId',
                },
              },
            },
            {
              get: {
                url: '/api/products/{{ firstProductId }}?_populate=*',
                expect: {
                  statusCode: 200,
                },
              },
            },
            { think: 2 },
          ],
        },
        {
          name: 'Category Browsing',
          weight: 30,
          flow: [
            {
              get: {
                url: '/api/categories',
                expect: {
                  statusCode: 200,
                },
              },
            },
            {
              get: {
                url: '/api/products?category=football&_limit=10',
                expect: {
                  statusCode: 200,
                },
              },
            },
            { think: 3 },
          ],
        },
        {
          name: 'Search Operations',
          weight: 20,
          flow: [
            {
              get: {
                url: '/api/products?_q=camiseta&_limit=10',
                expect: {
                  statusCode: 200,
                },
              },
            },
            {
              get: {
                url: '/api/products?_q={{ $randomWord() }}&_limit=10',
                expect: {
                  statusCode: 200,
                },
              },
            },
            { think: 2 },
          ],
        },
        {
          name: 'User Authentication',
          weight: 10,
          flow: [
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                expect: {
                  statusCode: 200,
                },
                capture: {
                  json: '$.jwt',
                  as: 'authToken',
                },
              },
            },
            {
              get: {
                url: '/api/users/me',
                headers: {
                  Authorization: 'Bearer {{ authToken }}',
                },
                expect: {
                  statusCode: 200,
                },
              },
            },
            { think: 1 },
          ],
        },
      ],
    };
  }

  /**
   * Normal Load Testing Scenario
   * Typical business hours traffic simulation
   */
  createNormalLoadScenario() {
    return {
      name: 'normal_load',
      description: 'Normal business hours traffic simulation',
      duration: '20m',
      config: {
        phases: [
          { duration: '2m', arrivalRate: 5, name: 'Morning warm up' },
          { duration: '5m', arrivalRate: 15, name: 'Morning traffic' },
          { duration: '8m', arrivalRate: 25, name: 'Peak hours' },
          { duration: '3m', arrivalRate: 20, name: 'Afternoon traffic' },
          { duration: '2m', arrivalRate: 10, name: 'Evening wind down' },
        ],
        payload: {
          path: path.join(__dirname, 'fixtures/csv/users.csv'),
          fields: ['email', 'password', 'jwt_token', 'user_id'],
        },
      },
      scenarios: [
        {
          name: 'Product Browsers',
          weight: 50,
          flow: [
            {
              get: {
                url: '/api/products?_limit=20&_sort=createdAt:desc',
                expect: { statusCode: 200 },
              },
            },
            {
              get: {
                url: '/api/categories',
                expect: { statusCode: 200 },
              },
            },
            {
              get: {
                url: '/api/products?category={{ $randomPickone(["football", "basketball", "running"]) }}&_limit=10',
                expect: { statusCode: 200 },
              },
            },
            { think: 5 },
          ],
        },
        {
          name: 'Active Shoppers',
          weight: 30,
          flow: [
            // Authentication
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                capture: {
                  json: '$.jwt',
                  as: 'authToken',
                },
              },
            },
            // Browse products
            {
              get: {
                url: '/api/products?_limit=20',
                headers: { Authorization: 'Bearer {{ authToken }}' },
              },
            },
            // Search for specific item
            {
              get: {
                url: '/api/products?_q={{ $randomPickone(["camiseta", "pantalon", "zapatillas"]) }}&_limit=5',
                headers: { Authorization: 'Bearer {{ authToken }}' },
              },
            },
            // View user profile
            {
              get: {
                url: '/api/users/me',
                headers: { Authorization: 'Bearer {{ authToken }}' },
              },
            },
            { think: 8 },
          ],
        },
        {
          name: 'Order Processors',
          weight: 15,
          flow: [
            // Authentication
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                capture: {
                  json: '$.jwt',
                  as: 'authToken',
                },
              },
            },
            // Create order
            {
              post: {
                url: '/api/orders',
                headers: { Authorization: 'Bearer {{ authToken }}' },
                json: {
                  items: [
                    {
                      product: '{{ $randomInt(1, 100) }}',
                      quantity: '{{ $randomInt(1, 3) }}',
                      size: '{{ $randomPickone(["S", "M", "L"]) }}',
                      color: '{{ $randomPickone(["Negro", "Blanco", "Azul"]) }}',
                    },
                  ],
                  total: '{{ $randomInt(1000, 5000) }}',
                  currency: 'UYU',
                },
                expect: { statusCode: [200, 201] },
              },
            },
            { think: 10 },
          ],
        },
        {
          name: 'Mobile App Users',
          weight: 5,
          flow: [
            // Simulate mobile-specific endpoints
            {
              get: {
                url: '/api/products?_limit=10&_sort=popularity:desc',
                headers: {
                  'User-Agent': 'TifossiApp/1.0 (iOS)',
                  'X-App-Version': '1.0.0',
                },
              },
            },
            {
              get: {
                url: '/api/stores?city=Montevideo',
                headers: {
                  'User-Agent': 'TifossiApp/1.0 (iOS)',
                },
              },
            },
            { think: 3 },
          ],
        },
      ],
    };
  }

  /**
   * Peak Load Testing Scenario
   * High traffic periods (promotions, launches)
   */
  createPeakLoadScenario() {
    return {
      name: 'peak_load',
      description: 'Peak traffic simulation for promotions and product launches',
      duration: '15m',
      config: {
        phases: [
          { duration: '2m', arrivalRate: 20, name: 'Pre-promotion warm up' },
          { duration: '1m', arrivalRate: 50, name: 'Promotion announcement' },
          { duration: '5m', arrivalRate: 100, name: 'Peak shopping period' },
          { duration: '4m', arrivalRate: 150, name: 'Maximum load' },
          { duration: '2m', arrivalRate: 80, name: 'Sustained high load' },
          { duration: '1m', arrivalRate: 30, name: 'Traffic decline' },
        ],
        payload: {
          path: path.join(__dirname, 'fixtures/csv/users.csv'),
          fields: ['email', 'password', 'jwt_token'],
        },
      },
      scenarios: [
        {
          name: 'Deal Hunters',
          weight: 40,
          flow: [
            {
              get: {
                url: '/api/products?status=SALE&_limit=20&_sort=price:asc',
                expect: { statusCode: 200 },
              },
            },
            {
              get: {
                url: '/api/products?status=FEATURED&_limit=10',
                expect: { statusCode: 200 },
              },
            },
            {
              get: {
                url: '/api/products?price_lte=2000&_limit=15',
                expect: { statusCode: 200 },
              },
            },
            { think: 3 },
          ],
        },
        {
          name: 'Quick Buyers',
          weight: 35,
          flow: [
            // Fast authentication
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                capture: { json: '$.jwt', as: 'authToken' },
              },
            },
            // Quick product search
            {
              get: {
                url: '/api/products?_q=oferta&_limit=5',
                headers: { Authorization: 'Bearer {{ authToken }}' },
              },
            },
            // Rapid order creation
            {
              post: {
                url: '/api/orders',
                headers: { Authorization: 'Bearer {{ authToken }}' },
                json: {
                  items: [
                    {
                      product: '{{ $randomInt(1, 50) }}',
                      quantity: 1,
                      size: 'M',
                    },
                  ],
                  total: '{{ $randomInt(500, 2000) }}',
                },
              },
            },
            { think: 1 },
          ],
        },
        {
          name: 'Mobile Rush Users',
          weight: 25,
          flow: [
            {
              get: {
                url: '/api/products?status=NEW&_limit=10',
                headers: {
                  'User-Agent': 'TifossiApp/1.0 (Android)',
                  'X-Device-Type': 'mobile',
                },
              },
            },
            {
              get: {
                url: '/api/categories?_populate=products',
                headers: {
                  'User-Agent': 'TifossiApp/1.0 (Android)',
                },
              },
            },
            { think: 2 },
          ],
        },
      ],
    };
  }

  /**
   * Stress Testing Scenario
   * Beyond normal capacity to find breaking points
   */
  createStressTestScenario() {
    return {
      name: 'stress_test',
      description: 'Stress testing to find system breaking points',
      duration: '20m',
      config: {
        phases: [
          { duration: '2m', arrivalRate: 50, name: 'Initial load' },
          { duration: '3m', arrivalRate: 100, name: 'Building pressure' },
          { duration: '5m', arrivalRate: 200, name: 'High stress' },
          { duration: '5m', arrivalRate: 300, name: 'Maximum stress' },
          { duration: '3m', arrivalRate: 400, name: 'Breaking point' },
          { duration: '2m', arrivalRate: 50, name: 'Recovery period' },
        ],
        payload: {
          path: path.join(__dirname, 'fixtures/csv/users.csv'),
          fields: ['email', 'password', 'jwt_token'],
        },
      },
      scenarios: [
        {
          name: 'Heavy Database Operations',
          weight: 30,
          flow: [
            {
              get: {
                url: '/api/products?_populate=*&_limit=50',
                expect: { statusCode: [200, 500, 503] },
              },
            },
            {
              get: {
                url: '/api/products?category=football&color=Negro&size=M&status=SALE&_sort=price:asc&_limit=20',
                expect: { statusCode: [200, 500, 503] },
              },
            },
            { think: 1 },
          ],
        },
        {
          name: 'Concurrent Authentication',
          weight: 25,
          flow: [
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                expect: { statusCode: [200, 400, 500, 503] },
              },
            },
            { think: 0.5 },
          ],
        },
        {
          name: 'Order Creation Flood',
          weight: 25,
          flow: [
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                capture: { json: '$.jwt', as: 'authToken' },
              },
            },
            {
              post: {
                url: '/api/orders',
                headers: { Authorization: 'Bearer {{ authToken }}' },
                json: {
                  items: [
                    {
                      product: '{{ $randomInt(1, 100) }}',
                      quantity: '{{ $randomInt(1, 5) }}',
                    },
                  ],
                  total: '{{ $randomInt(1000, 10000) }}',
                },
                expect: { statusCode: [200, 201, 400, 500, 503] },
              },
            },
            { think: 0.5 },
          ],
        },
        {
          name: 'Search Intensive',
          weight: 20,
          flow: [
            {
              get: {
                url: '/api/products?_q={{ $randomWord() }}&_limit=30',
                expect: { statusCode: [200, 500, 503] },
              },
            },
            {
              get: {
                url: '/api/products?_q={{ $randomString(3) }}&_limit=20',
                expect: { statusCode: [200, 500, 503] },
              },
            },
            { think: 0.3 },
          ],
        },
      ],
    };
  }

  /**
   * Endurance Testing Scenario
   * Long-running test to detect memory leaks and degradation
   */
  createEnduranceTestScenario() {
    return {
      name: 'endurance_test',
      description: 'Long-running endurance test for stability validation',
      duration: '2h',
      config: {
        phases: [
          { duration: '5m', arrivalRate: 10, name: 'Initial warm up' },
          { duration: '110m', arrivalRate: 30, name: 'Sustained load' },
          { duration: '5m', arrivalRate: 10, name: 'Cool down' },
        ],
        payload: {
          path: path.join(__dirname, 'fixtures/csv/users.csv'),
          fields: ['email', 'password', 'jwt_token'],
        },
      },
      scenarios: [
        {
          name: 'Typical User Journey',
          weight: 60,
          flow: [
            // Browse products
            {
              get: {
                url: '/api/products?_limit=20',
                expect: { statusCode: 200 },
              },
            },
            { think: 5 },
            // Search
            {
              get: {
                url: '/api/products?_q={{ $randomPickone(["camiseta", "short", "zapatillas"]) }}&_limit=10',
                expect: { statusCode: 200 },
              },
            },
            { think: 8 },
            // View categories
            {
              get: {
                url: '/api/categories',
                expect: { statusCode: 200 },
              },
            },
            { think: 10 },
          ],
        },
        {
          name: 'Authenticated Sessions',
          weight: 40,
          flow: [
            // Login
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                capture: { json: '$.jwt', as: 'authToken' },
              },
            },
            { think: 2 },
            // User activities
            {
              get: {
                url: '/api/users/me',
                headers: { Authorization: 'Bearer {{ authToken }}' },
              },
            },
            { think: 5 },
            // Browse with personalization
            {
              get: {
                url: '/api/products?_limit=15&_sort=popularity:desc',
                headers: { Authorization: 'Bearer {{ authToken }}' },
              },
            },
            { think: 15 },
          ],
        },
      ],
    };
  }

  /**
   * Spike Testing Scenario
   * Sudden traffic spikes to test elasticity
   */
  createSpikeTestScenario() {
    return {
      name: 'spike_test',
      description: 'Sudden traffic spikes to test system elasticity',
      duration: '10m',
      config: {
        phases: [
          { duration: '2m', arrivalRate: 10, name: 'Normal baseline' },
          { duration: '30s', arrivalRate: 200, name: 'Traffic spike' },
          { duration: '2m', arrivalRate: 10, name: 'Back to normal' },
          { duration: '1m', arrivalRate: 300, name: 'Larger spike' },
          { duration: '2m', arrivalRate: 10, name: 'Recovery' },
          { duration: '30s', arrivalRate: 500, name: 'Maximum spike' },
          { duration: '2m', arrivalRate: 10, name: 'Final recovery' },
        ],
      },
      scenarios: [
        {
          name: 'Spike Traffic Pattern',
          weight: 100,
          flow: [
            {
              get: {
                url: '/api/products?_limit=10',
                expect: { statusCode: [200, 429, 503] },
              },
            },
            {
              get: {
                url: '/api/categories',
                expect: { statusCode: [200, 429, 503] },
              },
            },
            { think: 1 },
          ],
        },
      ],
    };
  }

  /**
   * Black Friday Simulation
   * Realistic e-commerce peak event simulation
   */
  createBlackFridayScenario() {
    return {
      name: 'black_friday_simulation',
      description: 'Black Friday traffic simulation with realistic shopping patterns',
      duration: '30m',
      config: {
        phases: [
          { duration: '2m', arrivalRate: 20, name: 'Pre-event traffic' },
          { duration: '1m', arrivalRate: 80, name: 'Event announcement' },
          { duration: '5m', arrivalRate: 200, name: 'Initial rush' },
          { duration: '10m', arrivalRate: 300, name: 'Peak shopping' },
          { duration: '8m', arrivalRate: 250, name: 'Sustained high traffic' },
          { duration: '3m', arrivalRate: 150, name: 'Traffic decline' },
          { duration: '1m', arrivalRate: 50, name: 'Post-event normalization' },
        ],
        payload: {
          path: path.join(__dirname, 'fixtures/csv/users.csv'),
          fields: ['email', 'password', 'jwt_token'],
        },
      },
      scenarios: [
        {
          name: 'Bargain Hunters',
          weight: 45,
          flow: [
            {
              get: {
                url: '/api/products?status=SALE&_sort=price:asc&_limit=30',
                expect: { statusCode: [200, 429] },
              },
            },
            {
              get: {
                url: '/api/products?price_lte=1500&status=SALE&_limit=20',
                expect: { statusCode: [200, 429] },
              },
            },
            { think: 2 },
          ],
        },
        {
          name: 'Quick Purchase Users',
          weight: 30,
          flow: [
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                capture: { json: '$.jwt', as: 'authToken' },
              },
            },
            {
              post: {
                url: '/api/orders',
                headers: { Authorization: 'Bearer {{ authToken }}' },
                json: {
                  items: [
                    {
                      product: '{{ $randomInt(1, 50) }}',
                      quantity: '{{ $randomInt(1, 3) }}',
                      size: '{{ $randomPickone(["S", "M", "L"]) }}',
                    },
                  ],
                  total: '{{ $randomInt(800, 3000) }}',
                },
                expect: { statusCode: [200, 201, 429, 503] },
              },
            },
            { think: 1 },
          ],
        },
        {
          name: 'Mobile Shoppers',
          weight: 25,
          flow: [
            {
              get: {
                url: '/api/products?status=OPPORTUNITY&_limit=15',
                headers: {
                  'User-Agent': 'TifossiApp/1.0 (iPhone)',
                  'X-Device-Type': 'mobile',
                },
                expect: { statusCode: [200, 429] },
              },
            },
            { think: 3 },
          ],
        },
      ],
    };
  }

  /**
   * Mobile App Specific Load Testing
   * Testing mobile app specific endpoints and behaviors
   */
  createMobileAppLoadScenario() {
    return {
      name: 'mobile_app_load',
      description: 'Mobile app specific load testing with realistic usage patterns',
      duration: '15m',
      config: {
        phases: [
          { duration: '2m', arrivalRate: 15, name: 'Morning app opens' },
          { duration: '4m', arrivalRate: 35, name: 'Lunch break shopping' },
          { duration: '6m', arrivalRate: 50, name: 'Evening peak usage' },
          { duration: '2m', arrivalRate: 25, name: 'Night browsing' },
          { duration: '1m', arrivalRate: 10, name: 'Late night users' },
        ],
        payload: {
          path: path.join(__dirname, 'fixtures/csv/users.csv'),
          fields: ['email', 'password', 'jwt_token', 'device_id'],
        },
        defaults: {
          headers: {
            'User-Agent': 'TifossiApp/1.0.0',
            'X-App-Version': '1.0.0',
            'X-Platform': '{{ $randomPickone(["iOS", "Android"]) }}',
            'X-Device-Model': '{{ $randomPickone(["iPhone 15", "Pixel 7", "Samsung S23"]) }}',
          },
        },
      },
      scenarios: [
        {
          name: 'App Launch Sequence',
          weight: 25,
          flow: [
            // App initialization
            {
              get: {
                url: '/api/health',
                expect: { statusCode: 200 },
              },
            },
            // Load initial data
            {
              get: {
                url: '/api/products?_limit=10&featured=true',
                expect: { statusCode: 200 },
              },
            },
            {
              get: {
                url: '/api/categories',
                expect: { statusCode: 200 },
              },
            },
            { think: 3 },
          ],
        },
        {
          name: 'Product Browse on Mobile',
          weight: 40,
          flow: [
            {
              get: {
                url: '/api/products?_limit=20&_sort=popularity:desc',
                expect: { statusCode: 200 },
              },
            },
            {
              get: {
                url: '/api/products?category={{ $randomPickone(["football", "basketball", "casual"]) }}&_limit=15',
                expect: { statusCode: 200 },
              },
            },
            // Mobile-specific image loading
            {
              get: {
                url: '/api/products/{{ $randomInt(1, 100) }}?_populate=images',
                expect: { statusCode: [200, 404] },
              },
            },
            { think: 5 },
          ],
        },
        {
          name: 'Mobile Search and Filter',
          weight: 20,
          flow: [
            {
              get: {
                url: '/api/products?_q={{ $randomPickone(["nike", "adidas", "camiseta"]) }}&_limit=12',
                expect: { statusCode: 200 },
              },
            },
            {
              get: {
                url: '/api/products?size=M&color=Negro&_limit=10',
                expect: { statusCode: 200 },
              },
            },
            { think: 4 },
          ],
        },
        {
          name: 'Mobile Purchase Flow',
          weight: 15,
          flow: [
            // Quick mobile auth
            {
              post: {
                url: '/api/auth/local',
                json: {
                  identifier: '{{ email }}',
                  password: '{{ password }}',
                },
                capture: { json: '$.jwt', as: 'authToken' },
              },
            },
            // Mobile order creation
            {
              post: {
                url: '/api/orders',
                headers: { Authorization: 'Bearer {{ authToken }}' },
                json: {
                  items: [
                    {
                      product: '{{ $randomInt(1, 50) }}',
                      quantity: 1,
                      size: '{{ $randomPickone(["S", "M", "L"]) }}',
                    },
                  ],
                  total: '{{ $randomInt(1500, 4000) }}',
                  device_info: {
                    type: 'mobile',
                    platform: '{{ $randomPickone(["iOS", "Android"]) }}',
                  },
                },
              },
            },
            { think: 8 },
          ],
        },
      ],
    };
  }

  /**
   * Generate test data for load testing
   */
  generateTestData(scenario, count = 1000) {
    const config = this.getScenarioConfig(scenario);
    const data = this.testDataGenerator.generateCompleteDataset({
      products: Math.min(count, 1000),
      users: Math.min(count, 500),
      orders: Math.min(count * 2, 2000),
    });

    // Export to CSV for Artillery
    this.testDataGenerator.exportToCSV(data);

    return data;
  }

  /**
   * Get Artillery CLI command for scenario
   */
  getArtilleryCommand(scenario, options = {}) {
    const config = this.getScenarioConfig(scenario);
    const configFile = path.join(__dirname, `artillery-${scenario}.yml`);

    let command = `artillery run ${configFile}`;

    if (options.output) {
      command += ` --output ${options.output}`;
    }

    if (options.environment) {
      command += ` --environment ${options.environment}`;
    }

    if (options.variables) {
      const vars = Object.entries(options.variables)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');
      command += ` --variables ${vars}`;
    }

    return command;
  }

  /**
   * Save Artillery configuration file
   */
  saveArtilleryConfig(scenario, outputPath = null) {
    const config = this.getScenarioConfig(scenario);
    const yaml = require('js-yaml');

    const artilleryConfig = {
      config: config.config,
      scenarios: config.scenarios.map((s) => ({
        name: s.name,
        weight: s.weight,
        flow: s.flow,
      })),
    };

    const yamlContent = yaml.dump(artilleryConfig, { indent: 2 });

    if (!outputPath) {
      outputPath = path.join(__dirname, `artillery-${scenario}.yml`);
    }

    require('fs').writeFileSync(outputPath, yamlContent);
    console.log(`Artillery config saved: ${outputPath}`);

    return outputPath;
  }

  /**
   * Get performance thresholds for scenario
   */
  getPerformanceThresholds(scenario) {
    const thresholds = {
      baseline: {
        'http.response_time.p95': 500,
        'http.response_time.p99': 1000,
        'http.request_rate': 10,
        'http.codes.200': 0.99,
      },
      normalLoad: {
        'http.response_time.p95': 800,
        'http.response_time.p99': 2000,
        'http.request_rate': 100,
        'http.codes.200': 0.95,
      },
      peakLoad: {
        'http.response_time.p95': 1500,
        'http.response_time.p99': 3000,
        'http.request_rate': 400,
        'http.codes.200': 0.9,
      },
      stressTest: {
        'http.response_time.p95': 5000,
        'http.response_time.p99': 10000,
        'http.request_rate': 1000,
        'http.codes.200': 0.7,
      },
    };

    return thresholds[scenario] || thresholds.baseline;
  }

  /**
   * Get all available scenarios
   */
  listScenarios() {
    return Object.keys(this.scenarios).map((name) => ({
      name,
      description: this.scenarios[name].description,
      duration: this.scenarios[name].duration,
    }));
  }
}

module.exports = {
  LoadTestConfig,
};

// Export default instance
module.exports.default = LoadTestConfig;

// CLI usage
if (require.main === module) {
  const loadTestConfig = new LoadTestConfig(process.env.NODE_ENV || 'staging');
  const scenario = process.argv[2] || 'baseline';

  if (scenario === 'list') {
    console.log('Available load test scenarios:');
    loadTestConfig.listScenarios().forEach((s) => {
      console.log(`  ${s.name}: ${s.description} (${s.duration})`);
    });
  } else {
    try {
      const configPath = loadTestConfig.saveArtilleryConfig(scenario);
      const command = loadTestConfig.getArtilleryCommand(scenario, {
        output: `reports/${scenario}-results.json`,
      });

      console.log(`Configuration saved: ${configPath}`);
      console.log(`Run command: ${command}`);

      // Generate test data
      loadTestConfig.generateTestData(scenario);
      console.log('Test data generated');
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
}
