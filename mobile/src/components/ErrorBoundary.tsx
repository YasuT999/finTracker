import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message ?? "Unknown error"}</Text>
          <Text style={styles.hint}>All data is stored locally (expo-sqlite). Killing and reopening the app will not lose data. If the error persists, use Settings → Clear all data.</Text>
          <Pressable onPress={this.reset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  message: { fontSize: 13, opacity: 0.7, textAlign: "center" },
  hint: { fontSize: 11, opacity: 0.5, textAlign: "center", marginTop: 8 },
  button: { marginTop: 12, backgroundColor: "#111", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
