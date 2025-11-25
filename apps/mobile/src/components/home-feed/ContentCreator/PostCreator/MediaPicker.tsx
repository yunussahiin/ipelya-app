/**
 * MediaPicker Component
 * Adım 1: Fotoğraf/Video seçimi
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Text, FlatList, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { Camera, ChevronRight, Check, Clock, Video, Heart, Folder } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import type { MediaAsset } from "./types";
import { PostHeader } from "./PostHeader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = SCREEN_WIDTH / 4;

interface MediaPickerProps {
  onClose: () => void;
  onNext: (assets: MediaAsset[]) => void;
  maxSelection?: number;
}

// Sabit albüm kategorileri
const ALBUM_CATEGORIES = [
  { id: "recents", name: "Yakındakiler", icon: Clock },
  { id: "videos", name: "Videolar", icon: Video },
  { id: "favorites", name: "Favoriler", icon: Heart }
];

export function MediaPicker({ onClose, onNext, maxSelection = 10 }: MediaPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const albumSheetRef = useRef<BottomSheetModal>(null);

  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState<string>("Son Kaydedilenler");
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
        if (assets.length > 0) {
          setPreviewAsset(assets[0]);
          setSelectedAssets([assets[0]]);
        }
      }
    })();
  }, []);

  // Toggle asset selection - her zaman çoklu seçim aktif
  const toggleAssetSelection = useCallback(
    (asset: MediaAsset) => {
      Haptics.selectionAsync();

      setSelectedAssets((prev) => {
        const isSelected = prev.some((a) => a.id === asset.id);
        if (isSelected) {
          // Seçili ise kaldır (en az 1 seçili kalmalı)
          const newSelection = prev.filter((a) => a.id !== asset.id);
          if (newSelection.length === 0) {
            return prev; // En az 1 seçili kalmalı
          }
          return newSelection;
        } else {
          // Seçili değilse ekle (max kontrolü)
          if (prev.length >= maxSelection) return prev;
          return [...prev, asset];
        }
      });
      setPreviewAsset(asset);
    },
    [maxSelection]
  );

  // Handle next
  const handleNext = () => {
    if (selectedAssets.length > 0) {
      onNext(selectedAssets);
    }
  };

  // Load albums on mount (includeSmartAlbums for Favorites etc.)
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
      albumName = "Yakındakiler";
    } else if (categoryId === "favorites") {
      // Favoriler için smart album bul
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
    if (assets.length > 0) {
      setPreviewAsset(assets[0]);
      setSelectedAssets([assets[0]]);
    }
  };

  // Select specific album
  const handleAlbumSelect = (album: MediaLibrary.Album) => {
    Haptics.selectionAsync();
    albumSheetRef.current?.dismiss();
    loadAlbumMedia(album);
    setCurrentAlbum(album.title);
  };

  // Backdrop render
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Open camera
  const handleCameraPress = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newAsset: MediaAsset = {
        id: `camera_${Date.now()}`,
        uri: asset.uri,
        mediaType: asset.type === "video" ? "video" : "photo",
        width: asset.width,
        height: asset.height,
        duration: asset.duration || undefined
      };
      setSelectedAssets((prev) => {
        if (prev.length >= maxSelection) return prev;
        return [...prev, newAsset];
      });
      setPreviewAsset(newAsset);
    }
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

      if (assets.length > 0) {
        setPreviewAsset(assets[0]);
        setSelectedAssets([assets[0]]);
      }
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

  // Render grid item
  const renderGridItem = ({ item }: { item: MediaAsset }) => {
    const selectionIndex = selectedAssets.findIndex((a) => a.id === item.id);
    const isSelected = selectionIndex !== -1;

    return (
      <Pressable style={styles.gridItem} onPress={() => toggleAssetSelection(item)}>
        <Image source={{ uri: item.uri }} style={styles.gridImage} contentFit="cover" />

        {/* Video duration */}
        {item.mediaType === "video" && item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          </View>
        )}

        {/* Selection indicator - her zaman göster */}
        <View
          style={[
            styles.selectionIndicator,
            isSelected && { backgroundColor: colors.accent, borderColor: colors.accent }
          ]}
        >
          {isSelected && <Text style={styles.selectionNumber}>{selectionIndex + 1}</Text>}
        </View>
      </Pressable>
    );
  };

  if (!hasPermission) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      >
        <PostHeader title="Yeni gönderi" onClose={onClose} />
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: colors.textPrimary }]}>
            Galeri erişimi gerekli
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <PostHeader
        title="Yeni gönderi"
        onClose={onClose}
        rightAction={{
          label: "İleri",
          onPress: handleNext,
          disabled: selectedAssets.length === 0
        }}
      />

      {/* Preview */}
      <View style={styles.previewContainer}>
        {previewAsset && (
          <Image
            source={{ uri: previewAsset.uri }}
            style={styles.previewImage}
            contentFit="cover"
          />
        )}
      </View>

      {/* Album selector */}
      <View style={[styles.albumRow, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.albumSelector} onPress={handleAlbumPress}>
          <Text style={[styles.albumText, { color: colors.textPrimary }]}>{currentAlbum}</Text>
          <ChevronRight size={20} color={colors.textPrimary} />
        </Pressable>

        {/* Seçim sayısı göstergesi */}
        {selectedAssets.length > 1 && (
          <View style={[styles.selectionCount, { backgroundColor: colors.accent }]}>
            <Text style={styles.selectionCountText}>
              {selectedAssets.length}/{maxSelection}
            </Text>
          </View>
        )}
      </View>

      {/* Media Grid with Camera as first item */}
      <FlatList
        data={[{ id: "camera", type: "camera" } as const, ...mediaAssets]}
        renderItem={({ item }) => {
          if (item.id === "camera") {
            return (
              <Pressable
                style={[styles.cameraButton, { backgroundColor: colors.surfaceAlt }]}
                onPress={handleCameraPress}
              >
                <Camera size={28} color={colors.textMuted} />
              </Pressable>
            );
          }
          return renderGridItem({ item: item as MediaAsset });
        }}
        keyExtractor={(item) => item.id}
        numColumns={4}
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

          {/* Tüm Albümler - sadece içeriği olanlar */}
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
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  permissionText: {
    fontSize: 16
  },
  previewContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#000"
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  albumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  albumSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  albumText: {
    fontSize: 16,
    fontWeight: "600"
  },
  selectionCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8
  },
  selectionCountText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700"
  },
  gridContent: {
    paddingBottom: 100
  },
  cameraButton: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    alignItems: "center",
    justifyContent: "center"
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
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
  selectionIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center"
  },
  selectionNumber: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700"
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
