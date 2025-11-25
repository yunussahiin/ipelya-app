/**
 * ShareMenu Component
 *
 * Amaç: Instagram tarzı share modal - Kullanıcılara ve dışarıya paylaşma
 *
 * Özellikler:
 * - Takip edilen kullanıcılar grid
 * - Arama fonksiyonu
 * - Action butonları (Story, WhatsApp, Link, Paylaş)
 * - DM paylaşımı (API entegrasyonu)
 * - Theme-aware styling
 *
 * Props:
 * - visible: boolean
 * - postId: string (paylaşılacak post)
 * - onDismiss: Dismiss callback
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Share,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Dimensions
} from "react-native";
import { Image } from "expo-image";
import { Search, X, Plus, Link2, Upload, Check } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { sharePost } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AVATAR_SIZE = (SCREEN_WIDTH - 80) / 4;

interface ShareUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface ShareMenuProps {
  visible: boolean;
  postId: string;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function ShareMenu({ visible, postId, onDismiss, onSuccess }: ShareMenuProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<ShareUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ShareUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";
  const postUrl = `https://ipelya.app/post/${postId}`;

  // Fetch following users
  useEffect(() => {
    if (visible) {
      fetchFollowingUsers();
    }
  }, [visible]);

  const fetchFollowingUsers = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to get following users
      const response = await fetch(`${supabaseUrl}/functions/v1/get-following`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.users) {
          setUsers(data.data.users);
          setFilteredUsers(data.data.users);
        }
      }
    } catch (error) {
      console.log("Failed to fetch following users:", error);
      // Mock data for testing
      const mockUsers: ShareUser[] = [
        {
          id: "1",
          username: "yunus_sahin",
          display_name: "Yunus Şahin",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/png?seed=yunus"
        },
        {
          id: "2",
          username: "bostanci_hekimler",
          display_name: "bostancı hekimler",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/png?seed=bostanci"
        },
        {
          id: "3",
          username: "rukiye_aras",
          display_name: "Rukiye Aras ve Beyza Arat",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/png?seed=rukiye"
        },
        {
          id: "4",
          username: "ebru",
          display_name: "Ebru",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/png?seed=ebru"
        },
        {
          id: "5",
          username: "sezen_ozkan",
          display_name: "Sezen Özkan Çetin 🌻🌺",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/png?seed=sezen"
        },
        {
          id: "6",
          username: "tutku_arabaci",
          display_name: "Tutku Arabacı Şenyürek",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/png?seed=tutku"
        }
      ];
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.display_name?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  // Toggle user selection
  const toggleUserSelection = useCallback((userId: string) => {
    Haptics.selectionAsync();
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  // Share to story
  const handleShareStory = async () => {
    try {
      const response = await sharePost(supabaseUrl, accessToken, {
        post_id: postId,
        share_type: "story"
      });
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ Başarılı", "Hikayene eklendi!");
        onSuccess?.();
        onDismiss();
      }
    } catch (error) {
      Alert.alert("❌ Hata", "Bir sorun oluştu");
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(postUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Kopyalandı", "Bağlantı kopyalandı!");
    } catch (error) {
      Alert.alert("❌ Hata", "Kopyalanamadı");
    }
  };

  // Native share
  const handleNativeShare = async () => {
    try {
      await sharePost(supabaseUrl, accessToken, {
        post_id: postId,
        share_type: "external"
      });

      await Share.share({
        message: `İpelya'da bu gönderiyi gör! ${postUrl}`,
        url: postUrl
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.log("Share cancelled");
    }
  };

  // Send to all selected users
  const handleSendToSelected = async () => {
    if (selectedUsers.size === 0) return;

    setLoading(true);
    try {
      for (const userId of selectedUsers) {
        await sharePost(supabaseUrl, accessToken, {
          post_id: postId,
          share_type: "dm",
          recipient_id: userId
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Gönderildi", `${selectedUsers.size} kişiye gönderildi!`);
      setSelectedUsers(new Set());
      onSuccess?.();
      onDismiss();
    } catch (error) {
      Alert.alert("❌ Hata", "Gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  const actionButtons = [
    { id: "story", label: "Hikayene\nekle", icon: Plus, onPress: handleShareStory },
    { id: "link", label: "Bağlantıyı\nkopyala", icon: Link2, onPress: handleCopyLink },
    { id: "share", label: "Paylaş", icon: Upload, onPress: handleNativeShare }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View
          style={[styles.menu, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt }]}>
            <Search size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Ara"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Users Grid */}
          <ScrollView
            style={styles.usersContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersContent}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {searchQuery ? "Kullanıcı bulunamadı" : "Henüz takip ettiğin kimse yok"}
                </Text>
              </View>
            ) : (
              <View style={styles.usersGrid}>
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.has(user.id);

                  return (
                    <Pressable
                      key={user.id}
                      onPress={() => toggleUserSelection(user.id)}
                      style={styles.userItem}
                    >
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{
                            uri:
                              user.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/png?seed=${user.id}`
                          }}
                          style={[
                            styles.avatar,
                            isSelected && { borderColor: colors.accent, borderWidth: 3 }
                          ]}
                        />
                        {isSelected && (
                          <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                            <Check size={12} color="#FFF" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.userName, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {user.display_name || user.username}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionsContainer, { borderTopColor: colors.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsContent}
            >
              {actionButtons.map((action) => {
                const Icon = action.icon;
                return (
                  <Pressable key={action.id} onPress={action.onPress} style={styles.actionButton}>
                    <View style={[styles.actionIcon, { backgroundColor: colors.surfaceAlt }]}>
                      <Icon size={24} color={colors.textPrimary} />
                    </View>
                    <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                      {action.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Send Button (when users selected) */}
          {selectedUsers.size > 0 && (
            <View style={styles.sendContainer}>
              <Pressable
                onPress={handleSendToSelected}
                disabled={loading}
                style={[styles.sendButton, { backgroundColor: colors.accent }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.sendButtonText}>Gönder ({selectedUsers.size})</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  menu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%"
  },
  handleBar: {
    alignItems: "center",
    paddingVertical: 12
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0
  },
  usersContainer: {
    maxHeight: 280
  },
  usersContent: {
    paddingHorizontal: 16
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center"
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center"
  },
  emptyText: {
    fontSize: 14
  },
  usersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start"
  },
  userItem: {
    width: AVATAR_SIZE + 16,
    alignItems: "center",
    marginBottom: 16
  },
  avatarContainer: {
    position: "relative"
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2
  },
  checkBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF"
  },
  sendingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center"
  },
  userName: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 14
  },
  actionsContainer: {
    borderTopWidth: 1,
    paddingVertical: 16
  },
  actionsContent: {
    paddingHorizontal: 16,
    gap: 20
  },
  actionButton: {
    alignItems: "center",
    width: 70
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  actionLabel: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14
  },
  sendContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  sendButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  sendButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600"
  }
});
