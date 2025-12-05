"use client";

/**
 * VolumeControl Component
 * Ses seviyesi slider'ı
 */

import { Slider } from "@/components/ui/slider";

interface VolumeControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function VolumeControl({ value, onChange, disabled }: VolumeControlProps) {
  return (
    <Slider
      value={[value * 100]}
      onValueChange={([val]) => onChange(val / 100)}
      max={100}
      step={1}
      className="w-24"
      disabled={disabled}
    />
  );
}
