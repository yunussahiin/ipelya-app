/**
 * ShadowProfileEditor Component
 *
 * Shadow profil bilgilerini düzenlemek için form. Username, display name, bio ve avatar upload.
 *
 * Özellikler:
 * - Form validation (react-hook-form + Zod)
 * - Avatar upload
 * - Error handling
 * - Loading state
 * - Success feedback
 *
 * Kullanım:
 * ```tsx
 * <ShadowProfileEditor onSaveComplete={() => console.log('Saved')} />
 * ```
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Shadow Profile Form Schema
 */
const shadowProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscore, and dash"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters"),
  bio: z.string().max(200, "Bio must be at most 200 characters").optional().nullable()
});

type ShadowProfileFormData = z.infer<typeof shadowProfileSchema>;

interface ShadowProfileEditorProps {
  initialData?: Partial<ShadowProfileFormData>;
  onSaveComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * ShadowProfileEditor Component
 *
 * Shadow profil düzenleme formu
 */
export function ShadowProfileEditor({
  initialData,
  onSaveComplete,
  onError
}: ShadowProfileEditorProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ShadowProfileFormData>({
    resolver: zodResolver(shadowProfileSchema),
    defaultValues: {
      username: initialData?.username || "",
      displayName: initialData?.displayName || "",
      bio: initialData?.bio || ""
    },
    mode: "onBlur"
  });

  /**
   * Form submit handler
   */
  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // TODO: Implement shadow profile update API call
      // const response = await updateShadowProfile({
      //   ...data,
      //   avatarUri,
      // });

      console.log("✅ Shadow profile updated:", data);
      onSaveComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  });

  /**
   * Avatar picker handler
   */
  const handlePickAvatar = async () => {
    try {
      // TODO: Implement image picker
      // const result = await ImagePicker.launchImageLibraryAsync({
      //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
      //   allowsEditing: true,
      //   aspect: [1, 1],
      //   quality: 0.8,
      // });
      // if (!result.canceled) {
      //   setAvatarUri(result.assets[0].uri);
      // }
    } catch (error) {
      console.error("❌ Avatar picker error:", error);
    }
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Edit Shadow Profile</Text>
        <Text style={styles.subtitle}>Customize your anonymous identity</Text>
      </View>

      {/* Avatar Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Avatar</Text>
        <Pressable
          onPress={handlePickAvatar}
          disabled={loading}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarButtonPressed]}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarPlaceholder}>📷</Text>
          )}
        </Pressable>
        <Text style={styles.helperText}>Tap to change avatar</Text>
      </View>

      {/* Username Field */}
      <View style={styles.section}>
        <Text style={styles.label}>Username</Text>
        <Controller
          control={control}
          name="username"
          render={({ field: { value, onChange, onBlur } }) => (
            <View>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="shadow_username"
                placeholderTextColor={colors.mutedForeground}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
                maxLength={30}
              />
              {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
            </View>
          )}
        />
      </View>

      {/* Display Name Field */}
      <View style={styles.section}>
        <Text style={styles.label}>Display Name</Text>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { value, onChange, onBlur } }) => (
            <View>
              <TextInput
                style={[styles.input, errors.displayName && styles.inputError]}
                placeholder="Your Display Name"
                placeholderTextColor={colors.mutedForeground}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
                maxLength={50}
              />
              {errors.displayName && (
                <Text style={styles.errorText}>{errors.displayName.message}</Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Bio Field */}
      <View style={styles.section}>
        <Text style={styles.label}>Bio</Text>
        <Controller
          control={control}
          name="bio"
          render={({ field: { value, onChange, onBlur } }) => (
            <View>
              <TextInput
                style={[styles.input, styles.bioInput, errors.bio && styles.inputError]}
                placeholder="Tell us about your shadow self..."
                placeholderTextColor={colors.mutedForeground}
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
                maxLength={200}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.charCount}>{(value || "").length}/200</Text>
              {errors.bio && <Text style={styles.errorText}>{errors.bio.message}</Text>}
            </View>
          )}
        />
      </View>

      {/* Save Button */}
      <Pressable
        onPress={onSubmit}
        disabled={loading || !isValid}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.saveButtonPressed,
          (loading || !isValid) && styles.saveButtonDisabled
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </Pressable>

      {/* Spacing */}
      <View style={styles.spacing} />
    </ScrollView>
  );
}

/**
 * Styles for ShadowProfileEditor component
 */
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 24
    },
    header: {
      marginBottom: 24
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground
    },
    section: {
      marginBottom: 24
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 12
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 8
    },
    avatarButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8
    },
    avatarButtonPressed: {
      opacity: 0.7
    },
    avatar: {
      width: "100%",
      height: "100%",
      borderRadius: 60
    },
    avatarPlaceholder: {
      fontSize: 48
    },
    helperText: {
      fontSize: 12,
      color: colors.mutedForeground
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.foreground
    },
    bioInput: {
      textAlignVertical: "top",
      paddingTop: 12,
      minHeight: 100
    },
    inputError: {
      borderColor: "#ef4444"
    },
    errorText: {
      fontSize: 12,
      color: "#dc2626",
      marginTop: 4
    },
    charCount: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 4,
      textAlign: "right"
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 24
    },
    saveButtonPressed: {
      opacity: 0.7
    },
    saveButtonDisabled: {
      opacity: 0.5
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.background
    },
    spacing: {
      height: 24
    }
  });
