import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

export function useRefreshOnFocus(callback: () => void) {
  useFocusEffect(
    useCallback(() => {
      callback();
    }, [callback])
  );
}
