/**
 * CrystalExplosion Animation
 * Taç/Crown hediyesi için kristal patlama animasyonu
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PARTICLE_COUNT = 20;

interface CrystalExplosionProps {
  onComplete?: () => void;
}

export function CrystalExplosion({ onComplete }: CrystalExplosionProps) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1)
    }))
  ).current;

  const centralCrown = useRef({
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0)
  }).current;

  useEffect(() => {
    // Central crown animation
    const crownAnimation = Animated.sequence([
      Animated.parallel([
        Animated.spring(centralCrown.scale, {
          toValue: 1.5,
          friction: 4,
          useNativeDriver: true
        }),
        Animated.timing(centralCrown.opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(centralCrown.scale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(centralCrown.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ])
    ]);

    // Particle animations
    const particleAnimations = particles.map((particle, index) => {
      const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 80 + Math.random() * 100;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      return Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(particle.scale, {
            toValue: 0.8 + Math.random() * 0.4,
            friction: 5,
            useNativeDriver: true
          }),
          Animated.timing(particle.translateX, {
            toValue: targetX,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(particle.translateY, {
            toValue: targetY,
            duration: 600,
            useNativeDriver: true
          })
        ]),
        Animated.parallel([
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ])
      ]);
    });

    Animated.parallel([crownAnimation, ...particleAnimations]).start(() => {
      onComplete?.();
    });
  }, []);

  const sparkles = ["✨", "⭐", "💫", "🌟"];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Central Crown */}
      <Animated.Text
        style={[
          styles.crown,
          {
            transform: [{ scale: centralCrown.scale }],
            opacity: centralCrown.opacity
          }
        ]}
      >
        👑
      </Animated.Text>

      {/* Particles */}
      {particles.map((particle, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale }
              ],
              opacity: particle.opacity
            }
          ]}
        >
          {sparkles[index % sparkles.length]}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  crown: {
    position: "absolute",
    fontSize: 64
  },
  particle: {
    position: "absolute",
    fontSize: 24
  }
});
