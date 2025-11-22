import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  Platform,
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeImage } from '@/components/SafeImage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';

interface OrdinaryImpala4Props {
  title: string;
  description: string;
  imageUri?: string;
  onPress?: () => void;
  ctaText?: string;
  variant?: 'default' | 'compact' | 'featured';
  testID?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  index?: number; // For stagger animations
}

const OrdinaryImpala4: React.FC<OrdinaryImpala4Props> = ({
  title,
  description,
  imageUri,
  onPress,
  ctaText = 'Learn more',
  variant = 'default',
  testID = 'impala-card',
  accessibilityLabel,
  disabled = false,
  index = 0,
}) => {
  // Animation values
  const translateY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.08)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // State
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const { width: screenWidth } = useWindowDimensions();

  // Check for reduced motion preference
  useEffect(() => {
    const checkReduceMotion = async () => {
      try {
        const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotion(isReduceMotionEnabled);
      } catch (error) {
        console.log('Could not check reduce motion preference:', error);
      }
    };

    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => subscription?.remove();
  }, []);

  // Entrance animation with stagger
  useEffect(() => {
    if (reduceMotion) {
      // Skip animations for reduced motion
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    const staggerDelay = index * 80; // 80ms stagger between items
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: DesignTokens.animation.normal,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150 + staggerDelay);

    return () => clearTimeout(timer);
  }, [index, reduceMotion, opacity, translateY]);

  // Hover/Focus animations
  const handlePressIn = useCallback(() => {
    if (disabled || reduceMotion) return;
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {
        // Silently fail on web or if haptics unavailable
      });
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.03,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1.06,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.15,
        duration: DesignTokens.animation.fast,
        useNativeDriver: false,
      }),
    ]).start();
  }, [disabled, reduceMotion, scale, imageScale, shadowOpacity]);

  const handlePressOut = useCallback(() => {
    if (disabled || reduceMotion) return;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(imageScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.08,
        duration: DesignTokens.animation.normal,
        useNativeDriver: false,
      }),
    ]).start();
  }, [disabled, reduceMotion, scale, imageScale, shadowOpacity]);

  // Ripple effect for CTA button
  const handleCtaPress = useCallback((event: any) => {
    if (disabled) return;

    // Get touch position for ripple
    if (event.nativeEvent) {
      const { locationX, locationY } = event.nativeEvent;
      setRipplePosition({ x: locationX, y: locationY });
    }

    if (!reduceMotion) {
      // Reset ripple
      rippleScale.setValue(0);
      rippleOpacity.setValue(0.35);

      // Animate ripple
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Silently fail
      });
    }

    onPress?.();
  }, [disabled, reduceMotion, onPress, rippleScale, rippleOpacity]);

  const cardWidth = screenWidth - (DesignTokens.spacing.md * 2);

  const cardStyle = [
    styles.card,
    { width: cardWidth },
    variant === 'compact' && styles.cardCompact,
    variant === 'featured' && styles.cardFeatured,
    disabled && styles.cardDisabled,
  ];

  const animatedCardStyle = {
    opacity,
    transform: [
      { translateY },
      { scale },
    ],
  };

  const animatedShadowStyle = {
    shadowOpacity,
  };

  const animatedImageStyle = {
    transform: [{ scale: imageScale }],
  };

  const rippleStyle = {
    position: 'absolute' as const,
    left: ripplePosition.x - 20,
    top: ripplePosition.y - 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ scale: rippleScale }],
    opacity: rippleOpacity,
  };

  return (
    <Animated.View
      style={[animatedCardStyle, animatedShadowStyle]}
      testID={testID}
    >
      <Pressable
        style={cardStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${title}. ${description}`}
        accessibilityState={{ disabled }}
        accessibilityHint={onPress ? 'Double tap to open' : undefined}
      >
        {/* Image Section */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Animated.View style={animatedImageStyle}>
              <SafeImage
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors={true}
              />
            </Animated.View>
          </View>
        )}

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>

          {/* CTA Button */}
          <Pressable
            style={styles.ctaButton}
            onPress={handleCtaPress}
            disabled={disabled}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={ctaText}
          >
            <LinearGradient
              colors={Colors.accent.gradient.blue as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{ctaText}</Text>
              
              {/* Ripple Effect */}
              {!reduceMotion && (
                <Animated.View style={rippleStyle} pointerEvents="none" />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card.bg,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.components.card.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'center',
    marginVertical: DesignTokens.spacing.xs,
  },
  cardCompact: {
    padding: DesignTokens.components.card.padding.sm,
    gap: DesignTokens.spacing.sm,
  },
  cardFeatured: {
    padding: DesignTokens.components.card.padding.lg,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  imageContainer: {
    overflow: 'hidden',
    borderRadius: DesignTokens.borderRadius.md,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: DesignTokens.borderRadius.md,
  },
  content: {
    flex: 1,
    gap: DesignTokens.spacing.xs,
  },
  title: {
    ...DesignTokens.typography.title.medium,
    color: Colors.primary.text,
  },
  description: {
    ...DesignTokens.typography.body.medium,
    color: Colors.primary.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
  },
  ctaButton: {
    borderRadius: DesignTokens.borderRadius.sm,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  ctaGradient: {
    paddingHorizontal: DesignTokens.components.button.padding.sm.horizontal,
    paddingVertical: DesignTokens.components.button.padding.sm.vertical,
    borderRadius: DesignTokens.borderRadius.sm,
    position: 'relative',
  },
  ctaText: {
    ...DesignTokens.typography.body.medium,
    color: Colors.primary.text,
    fontWeight: '600',
  },
});

export default OrdinaryImpala4;