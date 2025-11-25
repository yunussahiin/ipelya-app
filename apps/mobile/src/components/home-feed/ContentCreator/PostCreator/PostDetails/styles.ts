/**
 * PostDetails Styles
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
  captionInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500"
  },
  menuSection: {
    paddingHorizontal: 16
  }
});

export const mediaPreviewStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    gap: 4
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  thumbFirst: {
    width: 100,
    height: 100,
    borderRadius: 12
  },
  moreOverlay: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  moreText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600"
  }
});

export const pollSectionStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  questionInput: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  optionInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8
  },
  removeButton: {
    padding: 8,
    marginLeft: 8
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500"
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12
  },
  durationLabel: {
    fontSize: 13
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: "500"
  }
});

export const menuItemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    gap: 14
  },
  label: {
    flex: 1,
    fontSize: 16
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  value: {
    fontSize: 15
  }
});
