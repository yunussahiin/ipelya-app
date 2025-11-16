import { StyleSheet, Text, View } from "react-native";

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#111111"
  },
  label: {
    color: "#a1a1aa",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8
  },
  value: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700"
  }
});
