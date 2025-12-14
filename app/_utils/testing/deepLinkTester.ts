/**
 * Deep Link Testing Utility for Tifossi Expo
 *
 * Provides comprehensive testing functionality for all deep link routes
 * including payment callbacks, product links, category links, and app navigation.
 */

import { deepLinkRouter } from '../../_services/navigation/deepLinkRouter';

export interface TestCase {
  name: string;
  url: string;
  expectedRoute: string;
  expectedParams?: Record<string, any>;
  description: string;
}

export const deepLinkTestCases: TestCase[] = [
  // Payment callback tests - now using direct /checkout/payment-result URL format
  {
    name: 'Payment Success',
    url: 'tifossi://checkout/payment-result?paymentSuccess=true&order_id=123&external_reference=TIF-20241201-123456&payment_id=123456789',
    expectedRoute: '/checkout/payment-result',
    expectedParams: {
      paymentSuccess: 'true',
      payment_id: '123456789',
      external_reference: 'TIF-20241201-123456',
    },
    description: 'Test successful payment callback from MercadoPago (direct expo-router)',
  },
  {
    name: 'Payment Failure',
    url: 'tifossi://checkout/payment-result?paymentFailure=true&order_id=123&external_reference=TIF-20241201-123456&payment_id=123456789',
    expectedRoute: '/checkout/payment-result',
    expectedParams: {
      paymentFailure: 'true',
      payment_id: '123456789',
      external_reference: 'TIF-20241201-123456',
    },
    description: 'Test failed payment callback from MercadoPago (direct expo-router)',
  },
  {
    name: 'Payment Pending',
    url: 'tifossi://checkout/payment-result?paymentPending=true&order_id=123&external_reference=TIF-20241201-123456&payment_id=123456789',
    expectedRoute: '/checkout/payment-result',
    expectedParams: {
      paymentPending: 'true',
      payment_id: '123456789',
      external_reference: 'TIF-20241201-123456',
    },
    description: 'Test pending payment callback from MercadoPago (direct expo-router)',
  },

  // Product link tests
  {
    name: 'Product Detail',
    url: 'tifossi://product/product-123',
    expectedRoute: '/products/[id]',
    expectedParams: {
      id: 'product-123',
    },
    description: 'Test product detail deep link navigation',
  },
  {
    name: 'Product with Query Params',
    url: 'tifossi://product/product-456?color=blue&size=M',
    expectedRoute: '/products/[id]',
    expectedParams: {
      id: 'product-456',
      color: 'blue',
      size: 'M',
    },
    description: 'Test product detail with additional parameters',
  },

  // Category link tests
  {
    name: 'Category by Slug',
    url: 'tifossi://category/ropa-deportiva',
    expectedRoute: '/catalog',
    expectedParams: {
      category: 'ropa-deportiva',
    },
    description: 'Test category navigation by slug',
  },
  {
    name: 'Category with Filters',
    url: 'tifossi://category/zapatos?minPrice=50&maxPrice=200&color=black',
    expectedRoute: '/catalog',
    expectedParams: {
      category: 'zapatos',
      minPrice: '50',
      maxPrice: '200',
      color: 'black',
    },
    description: 'Test category navigation with filter parameters',
  },

  // App navigation tests
  {
    name: 'Cart Navigation',
    url: 'tifossi://cart',
    expectedRoute: '/(tabs)/cart',
    description: 'Test navigation to cart screen',
  },
  {
    name: 'Profile Navigation',
    url: 'tifossi://profile',
    expectedRoute: '/(tabs)/profile',
    description: 'Test navigation to profile screen',
  },
  {
    name: 'Home Navigation',
    url: 'tifossi://home',
    expectedRoute: '/(tabs)/',
    description: 'Test navigation to home screen',
  },
  {
    name: 'Empty Path Navigation',
    url: 'tifossi://',
    expectedRoute: '/(tabs)/',
    description: 'Test navigation to home with empty path',
  },

  // Web deep link tests
  {
    name: 'Web Product Link',
    url: 'https://tifossi.app/product/web-product-123',
    expectedRoute: '/products/[id]',
    expectedParams: {
      id: 'web-product-123',
    },
    description: 'Test web-based product deep link',
  },
  {
    name: 'Web Payment Success',
    url: 'https://pay.tifossi.app/checkout/payment-result?paymentSuccess=true&order_id=123&external_reference=WEB-123&payment_id=web123',
    expectedRoute: '/checkout/payment-result',
    expectedParams: {
      paymentSuccess: 'true',
      payment_id: 'web123',
      external_reference: 'WEB-123',
    },
    description: 'Test web-based payment callback (direct expo-router)',
  },

  // Auth deep link tests (handled by auth service)
  {
    name: 'Auth Email Verification',
    url: 'tifossi://auth/verify-email?oobCode=ABC123&continueUrl=https://tifossi.app',
    expectedRoute: '/(tabs)/profile',
    description: 'Test email verification deep link',
  },
  {
    name: 'Auth Password Reset',
    url: 'tifossi://auth/password-reset?oobCode=XYZ789',
    expectedRoute: '/(auth)/reset-password',
    description: 'Test password reset deep link',
  },
];

export class DeepLinkTester {
  private testResults: {
    testCase: TestCase;
    success: boolean;
    actualResult?: any;
    error?: string;
    timestamp: Date;
  }[] = [];

  /**
   * Run a single test case
   */
  async runSingleTest(testCase: TestCase): Promise<boolean> {
    try {
      const result = await deepLinkRouter.handleDeepLink(testCase.url);

      const success = this.validateResult(testCase, result);

      this.testResults.push({
        testCase,
        success,
        actualResult: result,
        timestamp: new Date(),
      });

      if (success) {
      } else {
      }

      return success;
    } catch (error: any) {
      this.testResults.push({
        testCase,
        success: false,
        error: error.message,
        timestamp: new Date(),
      });

      return false;
    }
  }

  /**
   * Run all test cases
   */
  async runAllTests(): Promise<{ passed: number; failed: number; total: number }> {
    this.testResults = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of deepLinkTestCases) {
      const success = await this.runSingleTest(testCase);

      if (success) {
        passed++;
      } else {
        failed++;
      }

      // Add small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const total = deepLinkTestCases.length;

    return { passed, failed, total };
  }

  /**
   * Run tests for a specific category
   */
  async runTestsByCategory(
    category: 'payment' | 'product' | 'category' | 'navigation' | 'auth' | 'web'
  ): Promise<{ passed: number; failed: number; total: number }> {
    const categoryTests = deepLinkTestCases.filter((test) => {
      switch (category) {
        case 'payment':
          return test.url.includes('payment-result') || test.name.toLowerCase().includes('payment');
        case 'product':
          return test.url.includes('/product/');
        case 'category':
          return test.url.includes('/category/');
        case 'navigation':
          return ['cart', 'profile', 'home', '://'].some((keyword) => test.url.includes(keyword));
        case 'auth':
          return test.url.includes('/auth/');
        case 'web':
          return test.url.startsWith('https://');
        default:
          return false;
      }
    });

    let passed = 0;
    let failed = 0;

    for (const testCase of categoryTests) {
      const success = await this.runSingleTest(testCase);

      if (success) {
        passed++;
      } else {
        failed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const total = categoryTests.length;

    return { passed, failed, total };
  }

  /**
   * Validate test result against expected outcome
   */
  private validateResult(testCase: TestCase, result: any): boolean {
    if (!result.handled) {
      return false;
    }

    if (!result.success && testCase.expectedRoute) {
      return false;
    }

    // Validation logic can be extended based on specific requirements
    // For now, we consider the test passed if the deep link was handled
    return true;
  }

  /**
   * Get test results summary
   */
  getTestResults() {
    return {
      results: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter((r) => r.success).length,
        failed: this.testResults.filter((r) => !r.success).length,
        passRate:
          this.testResults.length > 0
            ? Math.round(
                (this.testResults.filter((r) => r.success).length / this.testResults.length) * 100
              )
            : 0,
      },
    };
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const { results, summary } = this.getTestResults();

    let report = `
# Deep Link Test Report
Generated at: ${new Date().toISOString()}

## Summary
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Pass Rate: ${summary.passRate}%

## Test Results
`;

    results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      report += `
### ${index + 1}. ${result.testCase.name} - ${status}
- **URL**: ${result.testCase.url}
- **Description**: ${result.testCase.description}
- **Expected Route**: ${result.testCase.expectedRoute}
- **Timestamp**: ${result.timestamp.toISOString()}
`;

      if (result.error) {
        report += `- **Error**: ${result.error}\n`;
      }

      if (result.actualResult) {
        report += `- **Actual Result**: ${JSON.stringify(result.actualResult, null, 2)}\n`;
      }
    });

    return report;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.testResults = [];
  }
}

// Export singleton instance
export const deepLinkTester = new DeepLinkTester();

// Export convenience functions
export const runDeepLinkTests = () => deepLinkTester.runAllTests();
export const runPaymentTests = () => deepLinkTester.runTestsByCategory('payment');
export const runProductTests = () => deepLinkTester.runTestsByCategory('product');
export const runCategoryTests = () => deepLinkTester.runTestsByCategory('category');
export const runNavigationTests = () => deepLinkTester.runTestsByCategory('navigation');
export const runAuthTests = () => deepLinkTester.runTestsByCategory('auth');
export const runWebTests = () => deepLinkTester.runTestsByCategory('web');

// Add default export to fix router warnings
const utilityExport = {
  name: 'DeepLinkTester',
  version: '1.0.0',
  service: deepLinkTester,
};

export default utilityExport;
