import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { Colors } from './src/theme';
import Mapbox from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from './src/config';

// Initialize Mapbox
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;

