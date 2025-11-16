import { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";

type PlaceholderScreenProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PlaceholderScreen({ title, description, children }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
        <Text style={styles.todo}>TODO: implement shadow mode flow & gerçek ekran tasarımı.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505"
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center"
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700"
  },
  description: {
    color: "#b0b0b0",
    fontSize: 16
  },
  todo: {
    color: "#eab308",
    marginTop: 32
  }
});
