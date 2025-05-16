'use client';

import { useState, useEffect } from 'react';

// 为 Viverse SDK 定义类型
declare global {
  interface Window {
    ViverseSDK?: any; // 如果有具体类型定义，请替换 any
  }
}

export function useViverse() {
  const [sdk, setSdk] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (window.ViverseSDK) {
      setSdk(window.ViverseSDK);
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.viverse.com/static-assets/viverse-sdk/1.2.6/viverse-sdk.umd.js';
    script.async = true;
    
    script.onload = () => {
      if (window.ViverseSDK) {
        console.log('Viverse SDK loaded successfully');
        setSdk(window.ViverseSDK);
      } else {
        setError(new Error('Viverse SDK loaded but not available on window object'));
      }
      setIsLoading(false);
    };
    
    script.onerror = () => {
      setError(new Error('Failed to load Viverse SDK'));
      setIsLoading(false);
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Clean up script if component unmounts during loading
      document.body.removeChild(script);
    };
  }, []);
  
  return { sdk, isLoading, error };
}