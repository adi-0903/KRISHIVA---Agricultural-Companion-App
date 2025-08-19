// Type definitions for the app

// Define your route parameters
type RootStackParamList = {
  '/': undefined;
  '/login': undefined;
  '/signup': undefined;
  '/profile': undefined;
  '/crop-details': undefined;
};

// Export route name type
type RouteName = keyof RootStackParamList;

// Export link href type
type LinkHref<T extends RouteName> = 
  | T 
  | {
      pathname: T;
      params?: RootStackParamList[T];
    };

// Simple type for navigation props
interface NavigationProps<T extends RouteName> {
  navigation: {
    navigate: (route: T, params?: RootStackParamList[T]) => void;
    goBack: () => void;
  };
  route: {
    params: RootStackParamList[T];
  };
}

// Extend the global React Navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Export types for use in components
export type { RootStackParamList, RouteName, LinkHref, NavigationProps };

// Add a default export to satisfy the route requirement
const AppTypes = {
  // This is just a placeholder to satisfy the default export requirement
  version: '1.0.0'
};

export default AppTypes;
