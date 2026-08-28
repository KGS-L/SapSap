// Polyfills for running unit tests under jsdom (the default Vitest environment).
// Ionic components such as ion-menu and ion-split-pane query `window.matchMedia`,
// which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Polyfill for navigator.geolocation in jsdom
if (typeof navigator !== 'undefined' && !navigator.geolocation) {
  (navigator as any).geolocation = {
    getCurrentPosition: (success: (pos: any) => void, _error?: (err: any) => void) => {
      success({
        coords: {
          latitude: 12.37142,
          longitude: -1.5197,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });
    },
    watchPosition: () => 1,
    clearWatch: () => undefined
  };
}
