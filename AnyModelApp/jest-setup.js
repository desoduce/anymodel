import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'AnyModelApp',
      slug: 'anymodel-app',
    },
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MockedIcon');

// Mock FormData for file uploads
global.FormData = class FormData {
  private data: Map<string, any> = new Map();
  
  append(key: string, value: any) {
    this.data.set(key, value);
  }
  
  get(key: string) {
    return this.data.get(key);
  }
  
  has(key: string) {
    return this.data.has(key);
  }
};

// Silence console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Set up fake timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
