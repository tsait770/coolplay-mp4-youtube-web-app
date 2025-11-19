import React from 'react';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { View, StyleSheet } from 'react-native';

type SafeImageProps = ExpoImageProps & {
  fallbackColor?: string;
};

export function SafeImage({ source, fallbackColor = '#1a1a1a', style, ...props }: SafeImageProps) {
  // Comprehensive source validation
  const isValidSource = React.useMemo(() => {
    if (!source) {
      console.warn('[SafeImage] No source provided');
      return false;
    }
    
    // Handle string sources
    if (typeof source === 'string') {
      const trimmed = source.trim();
      if (trimmed.length === 0) {
        console.warn('[SafeImage] Empty string source');
        return false;
      }
      return true;
    }
    
    // Handle object sources with uri
    if (typeof source === 'object' && source !== null && 'uri' in source) {
      const uri = source.uri;
      if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
        console.warn('[SafeImage] Empty or invalid URI in source object:', source);
        return false;
      }
      return true;
    }
    
    // Handle require() sources (number type)
    if (typeof source === 'number') {
      return true;
    }
    
    // Handle array of sources
    if (Array.isArray(source)) {
      return source.length > 0;
    }
    
    console.warn('[SafeImage] Unknown source type:', typeof source);
    return true; // Let expo-image handle other valid formats
  }, [source]);

  if (!isValidSource) {
    return (
      <View 
        style={[
          StyleSheet.flatten(style), 
          { backgroundColor: fallbackColor }
        ]} 
      />
    );
  }

  return (
    <ExpoImage 
      source={source} 
      style={style}
      {...props} 
      onError={(error) => {
        console.warn('[SafeImage] Load error:', error);
        props.onError?.(error);
      }}
    />
  );
}

export default SafeImage;
