import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_HEIGHT = 60;
const THUMB_SIZE = 52;
const PADDING = 4;

interface SlideToActionProps {
  label: string;
  sublabel?: string;
  onSlideComplete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function SlideToAction({
  label,
  sublabel,
  onSlideComplete,
  isLoading = false,
  disabled = false,
}: SlideToActionProps) {
  const sliderWidth = SCREEN_WIDTH - Spacing.lg * 2;
  const maxSlide = sliderWidth - THUMB_SIZE - PADDING * 2;
  const translateX = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Shimmer animation
  React.useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !isLoading,
      onMoveShouldSetPanResponder: () => !disabled && !isLoading,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        completedRef.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (completedRef.current) return;
        const newX = Math.max(0, Math.min(gestureState.dx, maxSlide));
        translateX.setValue(newX);

        // Haptic at threshold
        if (newX >= maxSlide * 0.9 && !completedRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (completedRef.current) return;

        if (gestureState.dx >= maxSlide * 0.85) {
          completedRef.current = true;
          Animated.spring(translateX, {
            toValue: maxSlide,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }).start(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSlideComplete();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const thumbOpacity = translateX.interpolate({
    inputRange: [0, maxSlide],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const textOpacity = translateX.interpolate({
    inputRange: [0, maxSlide * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-sliderWidth, sliderWidth],
  });

  const progressWidth = translateX.interpolate({
    inputRange: [0, maxSlide],
    outputRange: [THUMB_SIZE + PADDING * 2, sliderWidth],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.containerLoading]}>
        <ActivityIndicator size="small" color={Colors.white} />
        <Text style={styles.loadingText}>Placing your order...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      {/* Track background */}
      <View style={styles.track}>
        {/* Progress fill */}
        <Animated.View
          style={[
            styles.progressFill,
            { width: progressWidth },
          ]}
        />

        {/* Shimmer */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />

        {/* Label text */}
        <Animated.View style={[styles.labelContainer, { opacity: textOpacity }]}>
          <Text style={styles.label}>{label}</Text>
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </Animated.View>

        {/* Arrow hints */}
        <Animated.View style={[styles.arrowHints, { opacity: textOpacity }]}>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
        </Animated.View>

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              opacity: thumbOpacity,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Ionicons name="arrow-forward" size={22} color={Colors.primary} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SLIDER_HEIGHT,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  containerLoading: {
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.full,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  labelContainer: {
    position: 'absolute',
    left: THUMB_SIZE + PADDING * 2 + Spacing.md,
    right: Spacing.xl,
  },
  label: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  sublabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 1,
  },
  arrowHints: {
    position: 'absolute',
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    position: 'absolute',
    left: PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
});
