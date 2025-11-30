/**
 * StoryMediaPicker Component
 *
 * Instagram tarzı hikaye medya seçici
 * - Üstte header: X butonu, "Hikayeye ekle" başlık, ayarlar
 * - Albüm seçici dropdown
 * - Galeri grid (ilk item kamera butonu)
 * - Tek medya seçimi
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Text, FlatList, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import {
  X,
  Camera,
  ChevronDown,
  Clock,
  Video,
  Heart,
  Folder,
  Check,
  Layers
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const GRID_SIZE = SCREEN_WIDTH / GRID_COLUMNS;

interface StoryMediaPickerProps {
  onClose: () => void;
  onCameraPress: () => void;
  onMediaSelect: (media: {
    uri: string;
    type: "photo" | "video";
    width: number;
    height: number;
    duration?: number;
  }) => void;
}

interface MediaAsset {
  id: string;
  uri: string;
  mediaType: "photo" | "video";
  width: number;
  height: number;
  duration?: number;
}

// Sabit albüm kategorileri
const ALBUM_CATEGORIES = [
  { id: "recents", name: "Son Kaydedilenler", icon: Clock },
  { id: "videos", name: "Videolar", icon: Video },
  { id: "favorites", name: "Favoriler", icon: Heart }
];

export function StoryMediaPicker({ onClose, onCameraPress, onMediaSelect }: StoryMediaPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const albumSheetRef = useRef<BottomSheetModal>(null);

  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState("Son Kaydedilenler");
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);

  // Load media from gallery
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === "granted");

      if (status === "granted") {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: ["photo", "video"],
          first: 100,
          sortBy: [MediaLibrary.SortBy.creationTime]
        });

        const assets: MediaAsset[] = media.assets.map((asset) => ({
          id: asset.id,
          uri: asset.uri,
          mediaType: asset.mediaType === "video" ? "video" : "photo",
          width: asset.width,
          height: asset.height,
          duration: asset.duration
        }));

        setMediaAssets(assets);
      }
    })();
  }, []);

  // Load albums
  useEffect(() => {
    (async () => {
      if (hasPermission) {
        const albumList = await MediaLibrary.getAlbumsAsync({
          includeSmartAlbums: true
        });
        setAlbums(albumList);
      }
    })();
  }, [hasPermission]);

  // İlk medyayı önizleme olarak ayarla
  useEffect(() => {
    if (mediaAssets.length > 0 && !previewAsset) {
      setPreviewAsset(mediaAssets[0]);
    }
  }, [mediaAssets, previewAsset]);

  // Handle media selection - sadece önizleme güncelle
  const handleMediaPress = useCallback((asset: MediaAsset) => {
    Haptics.selectionAsync();
    setPreviewAsset(asset);
  }, []);

  // İleri butonuna tıklandığında
  const handleNext = useCallback(() => {
    if (previewAsset) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onMediaSelect({
        uri: previewAsset.uri,
        type: previewAsset.mediaType,
        width: previewAsset.width,
        height: previewAsset.height,
        duration: previewAsset.duration
      });
    }
  }, [previewAsset, onMediaSelect]);

  // Show album picker
  const handleAlbumPress = () => {
    Haptics.selectionAsync();
    albumSheetRef.current?.present();
  };

  // Select album category
  const handleCategorySelect = async (categoryId: string) => {
    Haptics.selectionAsync();
    albumSheetRef.current?.dismiss();

    let mediaType: MediaLibrary.MediaTypeValue[] = ["photo", "video"];
    let albumName = "Son Kaydedilenler";

    if (categoryId === "videos") {
      mediaType = ["video"];
      albumName = "Videolar";
    } else if (categoryId === "recents") {
      albumName = "Son Kaydedilenler";
    } else if (categoryId === "favorites") {
      const favAlbum = albums.find(
        (a) => a.title === "Favorites" || a.title === "Favourites" || a.title === "Favoriler"
      );
      if (favAlbum) {
        loadAlbumMedia(favAlbum);
        setCurrentAlbum("Favoriler");
        return;
      }
      albumName = "Favoriler";
    }

    const media = await MediaLibrary.getAssetsAsync({
      mediaType,
      first: 100,
      sortBy: [MediaLibrary.SortBy.creationTime]
    });

    const assets: MediaAsset[] = media.assets.map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      mediaType: asset.mediaType === "video" ? "video" : "photo",
      width: asset.width,
      height: asset.height,
      duration: asset.duration
    }));

    setMediaAssets(assets);
    setCurrentAlbum(albumName);
  };

  // Select specific album
  const handleAlbumSelect = (album: MediaLibrary.Album) => {
    Haptics.selectionAsync();
    albumSheetRef.current?.dismiss();
    loadAlbumMedia(album);
    setCurrentAlbum(album.title);
  };

  // Load media from specific album
  const loadAlbumMedia = async (album: MediaLibrary.Album | null) => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: ["photo", "video"],
        first: 100,
        sortBy: [MediaLibrary.SortBy.creationTime],
        album: album || undefined
      });

      const assets: MediaAsset[] = media.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        mediaType: asset.mediaType === "video" ? "video" : "photo",
        width: asset.width,
        height: asset.height,
        duration: asset.duration
      }));

      setMediaAssets(assets);
    } catch (error) {
      console.error("Load album error:", error);
    }
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Backdrop render
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Render grid item
  const renderGridItem = ({ item }: { item: MediaAsset | { id: string; type: "camera" } }) => {
    // Kamera butonu
    if ("type" in item && item.type === "camera") {
      return (
        <Pressable
          style={[styles.cameraButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={onCameraPress}
        >
          <Camera size={32} color={colors.textPrimary} />
        </Pressable>
      );
    }

    const asset = item as MediaAsset;
    const isSelected = previewAsset?.id === asset.id;

    return (
      <Pressable style={styles.gridItem} onPress={() => handleMediaPress(asset)}>
        <Image source={{ uri: asset.uri }} style={styles.gridImage} contentFit="cover" />

        {/* Video duration */}
        {asset.mediaType === "video" && asset.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(asset.duration)}</Text>
          </View>
        )}

        {/* Selection overlay */}
        {isSelected && <View style={[styles.selectedOverlay, { borderColor: colors.accent }]} />}
      </Pressable>
    );
  };

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.headerButton} onPress={onClose}>
            <X size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hikayeye ekle</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: colors.textPrimary }]}>
            Galeri erişimi gerekli
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerButton} onPress={onClose}>
          <X size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hikayeye ekle</Text>
        <Pressable style={styles.headerButton} onPress={handleNext} disabled={!previewAsset}>
          <Text
            style={[
              styles.nextButtonText,
              { color: previewAsset ? colors.accent : colors.textMuted }
            ]}
          >
            İleri
          </Text>
        </Pressable>
      </View>

      {/* Album Selector */}
      <Pressable
        style={[styles.albumSelector, { borderBottomColor: colors.border }]}
        onPress={handleAlbumPress}
      >
        <Text style={[styles.albumText, { color: colors.textPrimary }]}>{currentAlbum}</Text>
        <ChevronDown size={20} color={colors.textPrimary} />

        {/* Multi-select toggle */}
        <Pressable style={[styles.multiSelectButton, { backgroundColor: colors.surfaceAlt }]}>
          <Layers size={18} color={colors.textMuted} />
        </Pressable>
      </Pressable>

      {/* Media Grid */}
      <FlatList
        data={[{ id: "camera", type: "camera" as const }, ...mediaAssets]}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
      />

      {/* Album Picker Bottom Sheet */}
      <BottomSheetModal
        ref={albumSheetRef}
        snapPoints={["60%"]}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
        enablePanDownToClose
      >
        <BottomSheetScrollView style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Albüm Seç</Text>

          {/* Kategoriler */}
          {ALBUM_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = currentAlbum === category.name;
            return (
              <Pressable
                key={category.id}
                style={[styles.albumItem, { borderBottomColor: colors.border }]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <View style={[styles.albumIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <Icon size={22} color={colors.textPrimary} />
                </View>
                <Text style={[styles.albumItemText, { color: colors.textPrimary }]}>
                  {category.name}
                </Text>
                {isSelected && <Check size={20} color={colors.accent} />}
              </Pressable>
            );
          })}

          {/* Tüm Albümler */}
          {albums.filter((a) => a.assetCount > 0).length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Albümler</Text>
              {albums
                .filter((album) => album.assetCount > 0)
                .map((album) => (
                  <Pressable
                    key={album.id}
                    style={[styles.albumItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleAlbumSelect(album)}
                  >
                    <View style={[styles.albumIcon, { backgroundColor: colors.surfaceAlt }]}>
                      <Folder size={22} color={colors.textPrimary} />
                    </View>
                    <Text style={[styles.albumItemText, { color: colors.textPrimary }]}>
                      {album.title}
                    </Text>
                    <Text style={[styles.albumCount, { color: colors.textMuted }]}>
                      {album.assetCount}
                    </Text>
                    {currentAlbum === album.title && <Check size={20} color={colors.accent} />}
                  </Pressable>
                ))}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600"
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  permissionText: {
    fontSize: 16
  },
  albumSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 6
  },
  albumText: {
    fontSize: 16,
    fontWeight: "600"
  },
  multiSelectButton: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  gridContent: {
    paddingBottom: 100
  },
  cameraButton: {
    width: GRID_SIZE,
    height: GRID_SIZE * 1.5,
    alignItems: "center",
    justifyContent: "center"
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE * 1.5,
    padding: 1
  },
  gridImage: {
    width: "100%",
    height: "100%"
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  durationText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "500"
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    margin: 1
  },
  // Bottom Sheet styles
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  albumItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12
  },
  albumIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  albumItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500"
  },
  albumCount: {
    fontSize: 14,
    marginRight: 8
  }
});
