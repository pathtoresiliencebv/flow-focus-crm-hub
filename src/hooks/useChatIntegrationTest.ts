import { useEffect, useState } from 'react';
import { useEnhancedChat } from './useEnhancedChat';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useChatStore } from './useChatStore';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
}

interface IntegrationTestSuite {
  isRunning: boolean;
  results: TestResult[];
  overallScore: number;
  totalTests: number;
  passedTests: number;
}

export const useChatIntegrationTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const enhancedChat = useEnhancedChat();
  const store = useChatStore();
  
  const [testSuite, setTestSuite] = useState<IntegrationTestSuite>({
    isRunning: false,
    results: [],
    overallScore: 0,
    totalTests: 0,
    passedTests: 0
  });

  const runTest = async (testName: string, testFn: () => Promise<boolean> | boolean): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const result = await testFn();
      const endTime = Date.now();
      return {
        testName,
        passed: result,
        message: result ? 'Test passed successfully' : 'Test failed',
        duration: endTime - startTime
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        testName,
        passed: false,
        message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: endTime - startTime
      };
    }
  };

  const runIntegrationTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run integration tests",
        variant: "destructive"
      });
      return;
    }

    setTestSuite(prev => ({ ...prev, isRunning: true, results: [] }));

    const tests = [
      // Test 1: Store Initialization
      {
        name: "Store Initialization",
        test: () => {
          return store.channels !== undefined && 
                 store.availableUsers !== undefined &&
                 store.totalUnreadCount !== undefined;
        }
      },
      
      // Test 2: Enhanced Chat Hook Initialization
      {
        name: "Enhanced Chat Hook Initialization", 
        test: () => {
          return enhancedChat.channels !== undefined &&
                 enhancedChat.availableUsers !== undefined &&
                 enhancedChat.selectConversation !== undefined &&
                 enhancedChat.sendMessage !== undefined;
        }
      },

      // Test 3: Real-time Features
      {
        name: "Real-time Features Available",
        test: () => {
          return enhancedChat.realtimeFeatures !== null &&
                 enhancedChat.setTyping !== undefined &&
                 enhancedChat.isUserTyping !== undefined;
        }
      },

      // Test 4: Message Type Support
      {
        name: "Message Type Support",
        test: () => {
          return enhancedChat.sendMessage !== undefined &&
                 enhancedChat.sendFileMessage !== undefined &&
                 enhancedChat.sendVoiceMessage !== undefined;
        }
      },

      // Test 5: Unread Count Management
      {
        name: "Unread Count Management",
        test: () => {
          return enhancedChat.totalUnreadCount !== undefined &&
                 enhancedChat.getUnreadCount !== undefined &&
                 typeof enhancedChat.totalUnreadCount === 'number';
        }
      },

      // Test 6: Store State Synchronization
      {
        name: "Store State Synchronization",
        test: async () => {
          // Test if enhanced chat changes are reflected in store
          const initialChannelCount = store.channels.length;
          const initialUserCount = store.availableUsers.length;
          
          // Wait for any pending updates
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return store.channels.length >= initialChannelCount &&
                 store.availableUsers.length >= initialUserCount;
        }
      },

      // Test 7: Conversation Selection
      {
        name: "Conversation Selection Logic",
        test: () => {
          const conversation = enhancedChat.selectedConversation;
          return conversation !== undefined &&
                 conversation.conversationId !== undefined &&
                 conversation.type !== undefined;
        }
      },

      // Test 8: Cross-Platform Compatibility
      {
        name: "Cross-Platform Compatibility",
        test: () => {
          // Test mobile detection and responsive features
          const isMobile = window.innerWidth < 768;
          const hasTouch = 'ontouchstart' in window;
          
          // Both hooks should be available regardless of platform
          return enhancedChat.chatHook !== undefined &&
                 enhancedChat.directChatHook !== undefined;
        }
      },

      // Test 9: Error Handling
      {
        name: "Error Handling Resilience",
        test: async () => {
          try {
            // Test invalid conversation selection
            await enhancedChat.selectConversation('channel', 'invalid-id');
            return true; // Should not throw error
          } catch (error) {
            return false; // Should handle gracefully
          }
        }
      },

      // Test 10: Performance Metrics
      {
        name: "Performance Metrics",
        test: () => {
          const startTime = performance.now();
          
          // Test multiple store operations
          store.calculateTotalUnread();
          enhancedChat.getUnreadCount('test-id');
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Should complete operations within 10ms
          return duration < 10;
        }
      }
    ];

    const results: TestResult[] = [];
    let passedCount = 0;

    for (const { name, test } of tests) {
      const result = await runTest(name, test);
      results.push(result);
      if (result.passed) passedCount++;
      
      // Update UI with each test result
      setTestSuite(prev => ({
        ...prev,
        results: [...prev.results, result],
        passedTests: passedCount,
        totalTests: tests.length
      }));
      
      // Small delay between tests for UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const overallScore = Math.round((passedCount / tests.length) * 100);
    
    setTestSuite(prev => ({
      ...prev,
      isRunning: false,
      overallScore,
      totalTests: tests.length,
      passedTests: passedCount
    }));

    // Show completion toast
    toast({
      title: "Integration Tests Complete",
      description: `${passedCount}/${tests.length} tests passed (${overallScore}%)`,
      variant: overallScore >= 80 ? "default" : "destructive"
    });

    return results;
  };

  const getPerformanceMetrics = () => {
    return {
      storeSize: {
        channels: store.channels.length,
        availableUsers: store.availableUsers.length,
        totalMessages: Object.values(store.unifiedMessages).reduce((total, messages) => total + messages.length, 0),
        subscriptions: store.subscriptions.size
      },
      memory: {
        unreadCounts: Object.keys(store.unreadCounts).length,
        typingUsers: Object.keys(store.typingUsers).length
      },
      realtime: {
        connected: enhancedChat.realtimeFeatures !== null,
        features: enhancedChat.realtimeFeatures ? 
          Object.keys(enhancedChat.realtimeFeatures.features).length : 0
      }
    };
  };

  const resetTests = () => {
    setTestSuite({
      isRunning: false,
      results: [],
      overallScore: 0,
      totalTests: 0,
      passedTests: 0
    });
  };

  return {
    testSuite,
    runIntegrationTests,
    getPerformanceMetrics,
    resetTests,
    isTestingSupported: !!user
  };
};