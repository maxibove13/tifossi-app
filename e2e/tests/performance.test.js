const { device, expect, element, by, waitFor } = require('detox');

describe('Performance Testing', () => {
  let performanceMetrics = {};

  beforeEach(async () => {
    // Reset performance metrics for each test
    performanceMetrics = {};
    
    await device.launchApp({ 
      newInstance: true,
      permissions: { 
        notifications: 'YES',
        location: 'inuse'
      }
    });
  });

  afterEach(async () => {
    // Log performance metrics for analysis
    if (Object.keys(performanceMetrics).length > 0) {
      console.log('Performance Metrics:', JSON.stringify(performanceMetrics, null, 2));
    }
  });

  describe('App Startup Performance', () => {
    it('should meet cold start performance benchmarks', async () => {
      await device.terminateApp();
      
      const startTime = Date.now();
      
      await device.launchApp({ newInstance: true });
      
      // Measure time to splash screen
      await waitFor(element(by.id('splash-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      const splashTime = Date.now() - startTime;
      
      // Measure time to interactive content
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);
      
      const interactiveTime = Date.now() - startTime;
      
      // Measure time to full content load
      await waitFor(element(by.id('product-grid')))
        .toBeVisible()
        .withTimeout(20000);
      
      const fullLoadTime = Date.now() - startTime;
      
      performanceMetrics.coldStart = {
        splashTime,
        interactiveTime,
        fullLoadTime
      };
      
      // Performance thresholds
      expect(splashTime).toBeLessThan(3000); // Splash should appear within 3s
      expect(interactiveTime).toBeLessThan(10000); // App should be interactive within 10s
      expect(fullLoadTime).toBeLessThan(15000); // Full content within 15s
      
      await testUtils.takeScreenshot('cold-start-performance');
    });

    it('should meet warm start performance benchmarks', async () => {
      // First ensure app is running
      await testUtils.waitForApp();
      
      // Background the app
      await device.sendToHome();
      await device.sleep(3000);
      
      const startTime = Date.now();
      
      // Return to foreground
      await device.launchApp({ newInstance: false });
      
      // Measure time to restore
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      const resumeTime = Date.now() - startTime;
      
      performanceMetrics.warmStart = {
        resumeTime
      };
      
      // Warm start should be very fast
      expect(resumeTime).toBeLessThan(2000); // Should resume within 2s
    });

    it('should handle multiple rapid restarts efficiently', async () => {
      const restartTimes = [];
      
      for (let i = 0; i < 5; i++) {
        await device.terminateApp();
        
        const startTime = Date.now();
        await device.launchApp({ newInstance: true });
        
        await waitFor(element(by.id('home-screen')))
          .toBeVisible()
          .withTimeout(15000);
        
        const restartTime = Date.now() - startTime;
        restartTimes.push(restartTime);
        
        // Quick interaction to ensure stability
        await element(by.id('product-card-0')).tap();
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);
        await device.pressBack();
      }
      
      performanceMetrics.rapidRestarts = {
        restartTimes,
        averageTime: restartTimes.reduce((a, b) => a + b, 0) / restartTimes.length,
        maxTime: Math.max(...restartTimes),
        minTime: Math.min(...restartTimes)
      };
      
      // All restarts should be reasonable
      restartTimes.forEach(time => {
        expect(time).toBeLessThan(20000); // Each restart under 20s
      });
      
      // Performance should not degrade significantly
      const firstRestart = restartTimes[0];
      const lastRestart = restartTimes[restartTimes.length - 1];
      expect(lastRestart).toBeLessThan(firstRestart * 1.5); // Max 50% degradation
    });
  });

  describe('Navigation Performance', () => {
    beforeEach(async () => {
      await testUtils.waitForApp();
    });

    it('should meet tab navigation performance benchmarks', async () => {
      const navigationTimes = {};
      const tabs = ['home-tab', 'search-tab', 'cart-tab', 'favorites-tab', 'profile-tab'];
      
      for (const tab of tabs) {
        const startTime = Date.now();
        
        await element(by.id(tab)).tap();
        
        // Wait for tab content to load
        const expectedScreen = tab.replace('-tab', '-screen');
        await waitFor(element(by.id(expectedScreen)))
          .toBeVisible()
          .withTimeout(5000);
        
        const navigationTime = Date.now() - startTime;
        navigationTimes[tab] = navigationTime;
        
        // Each tab navigation should be fast
        expect(navigationTime).toBeLessThan(1000); // Under 1 second
      }
      
      performanceMetrics.tabNavigation = navigationTimes;
    });

    it('should meet screen transition performance benchmarks', async () => {
      const transitionTimes = {};
      
      // Test various screen transitions
      const transitions = [
        {
          action: () => element(by.id('product-card-0')).tap(),
          target: 'product-detail-screen',
          name: 'product-detail'
        },
        {
          action: () => device.pressBack(),
          target: 'home-screen',
          name: 'back-to-home'
        },
        {
          action: () => element(by.id('search-bar')).tap(),
          target: 'search-screen',
          name: 'search'
        },
        {
          action: () => device.pressBack(),
          target: 'home-screen',
          name: 'back-from-search'
        },
        {
          action: () => element(by.id('category-clothing')).tap(),
          target: 'category-screen',
          name: 'category'
        }
      ];
      
      for (const transition of transitions) {
        const startTime = Date.now();
        
        await transition.action();
        
        await waitFor(element(by.id(transition.target)))
          .toBeVisible()
          .withTimeout(5000);
        
        const transitionTime = Date.now() - startTime;
        transitionTimes[transition.name] = transitionTime;
        
        // All transitions should be smooth
        expect(transitionTime).toBeLessThan(2000); // Under 2 seconds
      }
      
      performanceMetrics.screenTransitions = transitionTimes;
    });

    it('should handle deep navigation stacks efficiently', async () => {
      const navigationStack = [];
      
      // Build a deep navigation stack
      const navSteps = [
        () => element(by.id('category-clothing')).tap(),
        () => element(by.id('product-card-0')).tap(),
        () => element(by.id('size-selector')).tap(),
        () => element(by.id('color-selector')).tap(),
        () => element(by.id('reviews-tab')).tap(),
        () => element(by.id('review-0')).tap()
      ];
      
      for (let i = 0; i < navSteps.length; i++) {
        const startTime = Date.now();
        await navSteps[i]();
        
        // Wait for any visible change (new screen or modal)
        await device.sleep(1000);
        
        const stepTime = Date.now() - startTime;
        navigationStack.push(stepTime);
        
        // Each step should remain responsive
        expect(stepTime).toBeLessThan(3000);
      }
      
      // Test backing out of deep stack
      const backTimes = [];
      for (let i = 0; i < navSteps.length; i++) {
        const startTime = Date.now();
        await device.pressBack();
        await device.sleep(500);
        const backTime = Date.now() - startTime;
        backTimes.push(backTime);
      }
      
      performanceMetrics.deepNavigation = {
        forwardTimes: navigationStack,
        backTimes: backTimes
      };
    });
  });

  describe('List and Grid Performance', () => {
    beforeEach(async () => {
      await testUtils.waitForApp();
    });

    it('should handle large product grids smoothly', async () => {
      // Test home product grid scrolling
      const scrollMetrics = {
        frameDrops: 0,
        scrollTimes: []
      };
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        await element(by.id('product-grid')).scroll(300, 'down');
        
        // Wait for scroll to complete and content to load
        await device.sleep(200);
        
        const scrollTime = Date.now() - startTime;
        scrollMetrics.scrollTimes.push(scrollTime);
        
        // Each scroll should be smooth
        expect(scrollTime).toBeLessThan(500);
      }
      
      performanceMetrics.productGridScroll = scrollMetrics;
      
      // Test smooth scroll back to top
      const startTime = Date.now();
      await element(by.id('product-grid')).scrollTo('top');
      const scrollToTopTime = Date.now() - startTime;
      
      expect(scrollToTopTime).toBeLessThan(2000);
    });

    it('should handle infinite scroll efficiently', async () => {
      // Navigate to a list with infinite scroll
      await element(by.id('category-clothing')).tap();
      
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      let loadedItems = 0;
      const infiniteScrollMetrics = [];
      
      // Trigger infinite scroll multiple times
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        // Scroll to trigger loading more items
        await element(by.id('category-product-list')).scroll(500, 'down');
        
        // Wait for loading indicator
        await waitFor(element(by.id('infinite-loading-indicator')))
          .toBeVisible()
          .withTimeout(3000);
        
        // Wait for loading to complete
        await waitFor(element(by.id('infinite-loading-indicator')))
          .not.toBeVisible()
          .withTimeout(10000);
        
        const loadTime = Date.now() - startTime;
        infiniteScrollMetrics.push(loadTime);
        
        // Each load should be reasonable
        expect(loadTime).toBeLessThan(8000);
        
        // Count loaded items (approximate)
        loadedItems += 10; // Assume 10 items per page
      }
      
      performanceMetrics.infiniteScroll = {
        loadTimes: infiniteScrollMetrics,
        totalItemsLoaded: loadedItems
      };
    });

    it('should handle search results rendering efficiently', async () => {
      await element(by.id('search-bar')).tap();
      
      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      const searchQueries = ['shirt', 'shoes', 'jacket', 'accessories'];
      const searchMetrics = {};
      
      for (const query of searchQueries) {
        await element(by.id('search-input')).clearText();
        
        const startTime = Date.now();
        
        await element(by.id('search-input')).typeText(query);
        await element(by.id('search-submit')).tap();
        
        // Wait for search results
        await waitFor(element(by.id('search-results')))
          .toBeVisible()
          .withTimeout(10000);
        
        const searchTime = Date.now() - startTime;
        searchMetrics[query] = searchTime;
        
        // Search should be fast
        expect(searchTime).toBeLessThan(5000);
        
        // Test scrolling through results
        await element(by.id('search-results')).scroll(300, 'down');
        await device.sleep(200);
      }
      
      performanceMetrics.searchPerformance = searchMetrics;
    });
  });

  describe('Image Loading Performance', () => {
    beforeEach(async () => {
      await testUtils.waitForApp();
    });

    it('should load product images efficiently', async () => {
      const imageLoadMetrics = [];
      
      // Test loading multiple product images
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await element(by.id(`product-card-${i}`)).tap();
        
        // Wait for product detail screen
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);
        
        // Wait for main product image to load
        await waitFor(element(by.id('product-main-image')))
          .toBeVisible()
          .withTimeout(8000);
        
        const imageLoadTime = Date.now() - startTime;
        imageLoadMetrics.push(imageLoadTime);
        
        // Images should load reasonably fast
        expect(imageLoadTime).toBeLessThan(6000);
        
        await device.pressBack();
        
        // Wait before next iteration
        await device.sleep(500);
      }
      
      performanceMetrics.imageLoading = {
        loadTimes: imageLoadMetrics,
        averageTime: imageLoadMetrics.reduce((a, b) => a + b, 0) / imageLoadMetrics.length
      };
    });

    it('should handle image gallery smoothly', async () => {
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Test swiping through image gallery
      const galleryMetrics = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await element(by.id('product-image-gallery')).swipe('left', 'fast');
        
        // Wait for new image to load
        await device.sleep(300);
        
        const swipeTime = Date.now() - startTime;
        galleryMetrics.push(swipeTime);
        
        // Gallery swipes should be smooth
        expect(swipeTime).toBeLessThan(1000);
      }
      
      performanceMetrics.imageGallery = galleryMetrics;
    });

    it('should handle high-resolution images efficiently', async () => {
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Test zooming into high-res image
      const startTime = Date.now();
      
      await element(by.id('product-main-image')).pinch(2.0, 'outward');
      
      // Wait for high-res image to load
      await waitFor(element(by.id('high-res-image-loaded')))
        .toBeVisible()
        .withTimeout(10000);
      
      const highResLoadTime = Date.now() - startTime;
      
      performanceMetrics.highResImageLoad = highResLoadTime;
      
      // High-res images should load within reasonable time
      expect(highResLoadTime).toBeLessThan(8000);
      
      // Test pinch-to-zoom performance
      const zoomStartTime = Date.now();
      
      await element(by.id('product-main-image')).pinch(0.5, 'inward');
      await device.sleep(200);
      
      const zoomTime = Date.now() - zoomStartTime;
      
      // Zoom should be responsive
      expect(zoomTime).toBeLessThan(500);
    });
  });

  describe('Memory Performance', () => {
    beforeEach(async () => {
      await testUtils.waitForApp();
    });

    it('should handle memory-intensive operations efficiently', async () => {
      // Simulate memory-intensive usage pattern
      const memoryTestSteps = [
        // Load many product images
        async () => {
          for (let i = 0; i < 10; i++) {
            await element(by.id(`product-card-${i}`)).tap();
            await waitFor(element(by.id('product-detail-screen')))
              .toBeVisible()
              .withTimeout(3000);
            await device.pressBack();
          }
        },
        
        // Perform many searches
        async () => {
          await element(by.id('search-bar')).tap();
          const queries = ['a', 'ab', 'abc', 'abcd', 'shirt', 'shoes', 'jacket'];
          for (const query of queries) {
            await element(by.id('search-input')).clearText();
            await element(by.id('search-input')).typeText(query);
            await device.sleep(500);
          }
          await device.pressBack();
        },
        
        // Navigate through many screens
        async () => {
          const tabs = ['cart-tab', 'favorites-tab', 'profile-tab', 'home-tab'];
          for (let i = 0; i < 3; i++) {
            for (const tab of tabs) {
              await element(by.id(tab)).tap();
              await device.sleep(200);
            }
          }
        }
      ];
      
      for (let i = 0; i < memoryTestSteps.length; i++) {
        const startTime = Date.now();
        
        try {
          await memoryTestSteps[i]();
          
          const stepTime = Date.now() - startTime;
          
          // App should remain responsive
          expect(stepTime).toBeLessThan(30000);
          
          // Verify app is still functional
          await expect(element(by.id('home-screen'))).toBeVisible();
          
        } catch (error) {
          throw new Error(`Memory test step ${i + 1} failed: ${error.message}`);
        }
      }
      
      performanceMetrics.memoryStressTest = 'completed';
    });

    it('should recover from memory pressure gracefully', async () => {
      // Simulate memory pressure by rapid navigation
      for (let i = 0; i < 20; i++) {
        await element(by.id('search-bar')).tap();
        await element(by.id('search-input')).typeText(`query${i}`);
        await device.pressBack();
        
        await element(by.id('product-card-0')).tap();
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(3000);
        await device.pressBack();
      }
      
      // App should still be responsive
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Test basic functionality
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('cart-screen'))).toBeVisible();
      
      performanceMetrics.memoryRecovery = 'passed';
    });
  });

  describe('Network Performance', () => {
    beforeEach(async () => {
      await testUtils.waitForApp();
    });

    it('should handle slow network conditions gracefully', async () => {
      // Set slow network condition
      await testUtils.setNetworkCondition('slow');
      
      const slowNetworkMetrics = {};
      
      // Test search with slow network
      let startTime = Date.now();
      
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shirts');
      await element(by.id('search-submit')).tap();
      
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(20000); // Longer timeout for slow network
      
      slowNetworkMetrics.searchTime = Date.now() - startTime;
      
      // Test product loading with slow network
      startTime = Date.now();
      
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);
      
      slowNetworkMetrics.productLoadTime = Date.now() - startTime;
      
      performanceMetrics.slowNetwork = slowNetworkMetrics;
      
      // Should show loading states appropriately
      // Restore normal network
      await testUtils.setNetworkCondition('good');
    });

    it('should handle network interruption recovery', async () => {
      // Start a network operation
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shoes');
      await element(by.id('search-submit')).tap();
      
      // Wait for loading to start
      await waitFor(element(by.id('search-loading')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Interrupt network
      await testUtils.setNetworkCondition('offline');
      
      // Should handle gracefully
      await waitFor(element(by.id('offline-indicator')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Restore network
      await testUtils.setNetworkCondition('good');
      
      // Should retry and complete operation
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(10000);
      
      performanceMetrics.networkRecovery = 'passed';
    });
  });

  describe('Animation Performance', () => {
    beforeEach(async () => {
      await testUtils.waitForApp();
    });

    it('should maintain smooth animations under load', async () => {
      const animationMetrics = [];
      
      // Test various animations
      const animationTests = [
        {
          name: 'tab-transition',
          action: async () => {
            await element(by.id('cart-tab')).tap();
            await device.sleep(300);
            await element(by.id('home-tab')).tap();
            await device.sleep(300);
          }
        },
        {
          name: 'modal-animation',
          action: async () => {
            await element(by.id('filter-button')).tap();
            await device.sleep(300);
            await device.pressBack();
            await device.sleep(300);
          }
        },
        {
          name: 'card-press',
          action: async () => {
            await element(by.id('product-card-0')).tap();
            await device.sleep(300);
            await device.pressBack();
            await device.sleep(300);
          }
        }
      ];
      
      // Run multiple animation cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const test of animationTests) {
          const startTime = Date.now();
          
          await test.action();
          
          const animationTime = Date.now() - startTime;
          animationMetrics.push({
            name: test.name,
            cycle,
            time: animationTime
          });
          
          // Animations should remain smooth
          expect(animationTime).toBeLessThan(2000);
        }
      }
      
      performanceMetrics.animations = animationMetrics;
    });

    it('should handle complex gesture animations smoothly', async () => {
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Test pinch-to-zoom animation
      const startTime = Date.now();
      
      await element(by.id('product-main-image')).pinch(2.0, 'outward', 75);
      await device.sleep(200);
      await element(by.id('product-main-image')).pinch(0.5, 'inward', 75);
      
      const gestureTime = Date.now() - startTime;
      
      performanceMetrics.gestureAnimation = gestureTime;
      
      // Gesture animations should be responsive
      expect(gestureTime).toBeLessThan(1500);
    });
  });
});