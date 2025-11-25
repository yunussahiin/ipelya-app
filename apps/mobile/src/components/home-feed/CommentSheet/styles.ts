/**
 * CommentSheet Styles
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  indicator: {
    width: 36,
    height: 5
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center"
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 200
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14
  },
  // Mention styles
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12
  },
  mentionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  mentionInfo: {
    flex: 1
  },
  mentionUsername: {
    fontSize: 15,
    fontWeight: "600"
  },
  mentionName: {
    fontSize: 13,
    marginTop: 2
  },
  // Skeleton styles
  skeletonContainer: {
    paddingHorizontal: 16
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  skeletonInfo: {
    flex: 1,
    gap: 8
  },
  skeletonUsername: {
    width: 120,
    height: 14,
    borderRadius: 4
  },
  skeletonName: {
    width: 80,
    height: 12,
    borderRadius: 4
  }
});
