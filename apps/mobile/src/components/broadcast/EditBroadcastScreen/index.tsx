/**
 * EditBroadcastScreen
 *
 * Amaç: Yayın kanalı düzenleme ekranı
 * Tarih: 2025-12-02
 */

import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useBroadcastStore } from "@/store/messaging";
import { useBroadcastChannels } from "@/hooks/messaging";
import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastAccessType } from "@ipelya/types";

// =============================================
// CONSTANTS
// =============================================

const ACCESS_TYPES: { value: BroadcastAccessType; label: string; icon: string }[] = [
  { value: "public", label: "Herkese Açık", icon: "globe-outline" },
  { value: "subscribers_only", label: "Sadece Aboneler", icon: "lock-closed-outline" },
  { value: "tier_specific", label: "Belirli Tier", icon: "star-outline" }
];

const DEFAULT_REACTIONS = ["❤️", "🔥", "👏", "😍", "🎉", "💯"];

// =============================================
// COMPONENT
// =============================================

export function EditBroadcastScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();

  // Kanalları çek
  useBroadcastChannels();

  // Kanal bilgisi - store'dan
  const storeChannel = useBroadcastStore((s) =>
    [...s.myChannels, ...s.joinedChannels].find((c) => c.id === channelId)
  );

  const [channel, setChannel] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<BroadcastAccessType>("public");
  const [pollsEnabled, setPollsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  // Kanal bilgisini doğrudan Supabase'den al (allowed_reactions için)
  useEffect(() => {
    if (!channelId) return;

    const fetchChannel = async () => {
      const { data } = await supabase
        .from("broadcast_channels")
        .select("*")
        .eq("id", channelId)
        .single();

      if (data) {
        setChannel(data);
      }
    };

    fetchChannel();
  }, [channelId]);

  // Profil fotoğrafını al
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .eq("type", "real")
          .single();
        if (profile?.avatar_url) {
          setProfileAvatarUrl(profile.avatar_url);
        }
      }
    };
    fetchProfile();
  }, []);

  // Kanal bilgilerini yükle
  useEffect(() => {
    if (channel) {
      setName(channel.name || "");
      setDescription(channel.description || "");
      setAvatarUri(channel.avatar_url || null);
      setAccessType(channel.access_type || "public");
      setPollsEnabled(channel.polls_enabled ?? true);
    }
  }, [channel]);

  // Avatar seç - ActionSheet ile
  const handlePickAvatar = useCallback(() => {
    const options = profileAvatarUrl
      ? ["Galeriden Seç", "Profil Fotoğrafımı Kullan", "İptal"]
      : ["Galeriden Seç", "İptal"];
    const cancelIndex = profileAvatarUrl ? 2 : 1;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: [ImagePicker.MediaType.IMAGE],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8
            });
            if (!result.canceled && result.assets[0]) {
              setAvatarUri(result.assets[0].uri);
              setHasChanges(true);
            }
          } else if (buttonIndex === 1 && profileAvatarUrl) {
            setAvatarUri(profileAvatarUrl);
            setHasChanges(true);
          }
        }
      );
    } else {
      Alert.alert("Fotoğraf Seç", "", [
        {
          text: "Galeriden Seç",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: [ImagePicker.MediaType.IMAGE],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8
            });
            if (!result.canceled && result.assets[0]) {
              setAvatarUri(result.assets[0].uri);
              setHasChanges(true);
            }
          }
        },
        ...(profileAvatarUrl
          ? [
              {
                text: "Profil Fotoğrafımı Kullan",
                onPress: () => {
                  setAvatarUri(profileAvatarUrl);
                  setHasChanges(true);
                }
              }
            ]
          : []),
        { text: "İptal", style: "cancel" as const }
      ]);
    }
  }, [profileAvatarUrl]);

  // Kaydet
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Kanal adı gerekli");
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      // Avatar işleme - sadece profil fotoğrafı URL'i gönder
      let avatarUrl: string | undefined;

      if (avatarUri && avatarUri !== channel?.avatar_url) {
        // Avatar değişti ve profil fotoğrafı ise
        if (avatarUri.startsWith("http")) {
          avatarUrl = avatarUri;
        }
        // Local file ise göndermiyoruz (edit ekranında sadece profil fotoğrafı kullan seçeneği var)
      }

      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/update-broadcast-channel`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channel_id: channelId,
          name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl,
          access_type: accessType,
          polls_enabled: pollsEnabled
        })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Kanal güncellenemedi");
      }

      // Store'u güncelle
      useBroadcastStore.getState().updateChannel(channelId || "", result.data);

      Alert.alert("Başarılı", "Kanal güncellendi", [
        { text: "Tamam", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error("Kanal güncelleme hatası:", error);
      Alert.alert("Hata", error.message || "Kanal güncellenemedi");
    } finally {
      setIsSaving(false);
    }
  }, [channelId, name, description, avatarUri, accessType, pollsEnabled, router]);

  if (!channel) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textMuted }]}>İptal</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Kanalı Düzenle</Text>
        <Pressable onPress={handleSave} disabled={isSaving || !name.trim()}>
          <Text
            style={[
              styles.saveText,
              {
                color: name.trim() && !isSaving ? colors.accent : colors.textMuted,
                opacity: isSaving ? 0.5 : 1
              }
            ]}
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Avatar */}
        <Pressable style={styles.avatarContainer} onPress={handlePickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="camera" size={32} color={colors.textMuted} />
            </View>
          )}
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>Fotoğrafı değiştir</Text>
        </Pressable>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Kanal Adı</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Kanal adı girin"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setHasChanges(true);
            }}
            maxLength={50}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.surface, color: colors.textPrimary }
            ]}
            placeholder="Kanal açıklaması (opsiyonel)"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setHasChanges(true);
            }}
            multiline
            maxLength={200}
          />
        </View>

        {/* Access Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Erişim Tipi</Text>
          <View style={styles.accessTypes}>
            {ACCESS_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.accessType,
                  { backgroundColor: colors.surface },
                  accessType === type.value && {
                    borderColor: colors.accent,
                    borderWidth: 2
                  }
                ]}
                onPress={() => {
                  setAccessType(type.value);
                  setHasChanges(true);
                }}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={accessType === type.value ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.accessTypeText,
                    {
                      color: accessType === type.value ? colors.accent : colors.textPrimary
                    }
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Reactions - Kaldırıldı: Tüm emojilere izin veriliyor */}

        {/* Polls */}
        <Pressable
          style={[styles.toggleRow, { backgroundColor: colors.surface }]}
          onPress={() => {
            setPollsEnabled(!pollsEnabled);
            setHasChanges(true);
          }}
        >
          <View style={styles.toggleContent}>
            <Ionicons name="stats-chart-outline" size={22} color={colors.textPrimary} />
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
              Anketleri Etkinleştir
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              { backgroundColor: pollsEnabled ? colors.accent : colors.border }
            ]}
          >
            <View
              style={[styles.toggleThumb, { transform: [{ translateX: pollsEnabled ? 20 : 0 }] }]}
            />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  cancelText: {
    fontSize: 16
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600"
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: 24
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarHint: {
    fontSize: 14,
    marginTop: 8
  },
  inputGroup: {
    paddingHorizontal: 16,
    marginBottom: 20
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  accessTypes: {
    flexDirection: "row",
    gap: 8
  },
  accessType: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4
  },
  accessTypeText: {
    fontSize: 12,
    fontWeight: "500"
  },
  reactions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  reactionEmoji: {
    fontSize: 24
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toggleLabel: {
    fontSize: 16
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff"
  }
});

export default EditBroadcastScreen;
