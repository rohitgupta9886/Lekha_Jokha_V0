// ==============================================================================
// Lekha Jokha - Dedicated Independent Android Mobile Frontend Entry Point
// ==============================================================================

import React from 'react';
import { I18nProvider } from './i18n/i18nContext';
import { AppNavigator } from './navigation/AppNavigator';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppNavigator />
    </I18nProvider>
  );
};

export default App;
