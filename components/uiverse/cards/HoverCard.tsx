import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeImage } from '@/components/SafeImage';
import Colors from '@/constants/colors';
import { DesignTokens } from '@/constants/designTokens';
import { AnimatedCardProps } from '../utils/types';
import {
  createScaleAnimation,
  triggerHaptic,
  checkReducedMotion,
  calculateStaggerDelay,
  createFadeAnimation,
  createSlideAnimation,
} from '../utils/animations';

export const HoverCard: React.FC<AnimatedCardProps> = ({
  title,
  description,
  imageUri,
  onPress,
  variant = 'default',
  children,
  index = 0,
  disabled = false,
  style,
  testID = 'hover-card',
  accessibilityLabel,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.08)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    checkReducedMotion().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    const staggerDelay = calculateStaggerDelay(index);
    const timer = setTimeout(() => {
      Animated.parallel([
        createFadeAnimation(opacity, { toValue: 1 }),
        createSlideAnimation(translateY, { toValue: 0 }),
      ]).start();
    }, 150 + staggerDelay);

    return () => clearTimeout(timer);
  }, [index, reduceMotion, opacity, translateY]);

  const handlePressIn = useCallback(() => {
    if (disabled || reduceMotion) return;
    
    triggerHaptic('light');
    
    Animated.parallel([
      createScaleAnimation(scale, { toValue: 1.02 }),
      createScaleAnimation(imageScale, { toValue: 1.08 }),
      Animated.timing(shadowOpacity, {
        toValue: 0.15,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [disabled, reduceMotion, scale, imageScale, shadowOpacity]);

  const handlePressOut = useCallback(() => {
    if (disabled || reduceMotion) return;
    
    Animated.parallel([
      createScaleAnimation(scale, { toValue: 1 }),
      createScaleAnimation(imageScale, { toValue: 1 }),
      Animated.timing(shadowOpacity, {
        toValue: 0.08,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [disabled, reduceMotion, scale, imageScale, shadowOpacity]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    triggerHaptic('medium');
    onPress?.();
  }, [disabled, onPress]);

  const cardWidth = screenWidth - (DesignTokens.spacing.md * 2);

  const cardStyles = [
    styles.card,
    { width: cardWidth },
    variant === 'compact' && styles.cardCompact,
    variant === 'featured' && styles.cardFeatured,
    variant === 'elevated' && styles.cardElevated,
    disabled && styles.cardDisabled,
    style,
  ];

  const animatedCardStyle = {
    opacity,
    transform: [{ translateY }, { scale: reduceMotion ? 1 : scale }],
    shadowOpacity: reduceMotion ? 0.08 : shadowOpacity,
  };

  const animatedImageStyle = {
    transform: [{ scale: reduceMotion ? 1 : imageScale }],
  };

  return (
    <Animated.View style={[animatedCardStyle, styles.animatedContainer]}>
      <Pressable
        style={cardStyles}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || !onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${title}. ${description || ''}`}
        accessibilityState={{ disabled }}
        testID={testID}
      >
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

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}
          {children}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    marginVertical: DesignTokens.spacing.xs,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: Colors.card.bg,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.components.card.padding.md,
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  cardCompact: {
    padding: DesignTokens.components.card.padding.sm,
  },
  cardFeatured: {
    padding: DesignTokens.components.card.padding.lg,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
  },
  cardElevated: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 16,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  imageContainer: {
    overflow: 'hidden',
    borderRadius: DesignTokens.borderRadius.md,
    marginBottom: DesignTokens.spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: DesignTokens.borderRadius.md,
  },
  content: {
    gap: DesignTokens.spacing.xs,
  },
  title: {
    ...DesignTokens.typography.title.medium,
    color: Colors.primary.text,
  },
  description: {
    ...DesignTokens.typography.body.medium,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
  },
});

export default HoverCard;
