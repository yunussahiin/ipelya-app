// Geçici script: Expo SecureStore ve AsyncStorage'ı temizle
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function clearAllStorage() {
  try {
    console.log("Clearing SecureStore...");
    await SecureStore.deleteItemAsync("supabase_session_token");

    console.log("Clearing AsyncStorage...");
    await AsyncStorage.clear();

    console.log("✅ Storage cleared successfully!");
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
}

clearAllStorage();
