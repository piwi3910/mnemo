import { useEffect, Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuthContext } from "../src/contexts/AuthContext";
import { colors, fontSize, spacing, borderRadius } from "../src/lib/theme";
import { APP_VERSION, APP_COMMIT } from "../src/lib/version";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errorStyles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  buttonText: {
    color: "#fff",
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, serverUrl, twoFactorRequired, versionError, logout } =
    useAuthContext();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (twoFactorRequired) {
      if (segments[1] !== "two-factor") {
        router.replace("/(auth)/two-factor");
      }
      return;
    }

    if (!serverUrl) {
      if (!inAuthGroup || segments[1] !== "server") {
        router.replace("/(auth)/server");
      }
      return;
    }

    if (!isAuthenticated) {
      if (!inAuthGroup || segments[1] === "server") {
        router.replace("/(auth)/login");
      }
      return;
    }

    // Authenticated — send to app if still on auth screens
    if (inAuthGroup) {
      router.replace("/(app)/(tabs)/notes");
    }

    // If at root index, redirect to app
    if (!inAuthGroup && !inAppGroup && segments.length === 0) {
      router.replace("/(app)/(tabs)/notes");
    }
  }, [isAuthenticated, isLoading, serverUrl, twoFactorRequired, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (versionError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d1117", justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Ionicons name="warning" size={64} color="#ef4444" />
        <Text style={{ color: "#ef4444", fontSize: 20, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
          Version Incompatible
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 15, marginTop: 12, textAlign: "center", lineHeight: 22 }}>
          {versionError}
        </Text>
        <Text style={{ color: "#475569", fontSize: 13, marginTop: 24 }}>
          App: v{APP_VERSION} · {APP_COMMIT}
        </Text>
        <TouchableOpacity
          onPress={logout}
          style={{ marginTop: 32, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#1e293b", borderRadius: 8 }}
        >
          <Text style={{ color: "#e2e8f0", fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGuard>
          <Slot />
        </AuthGuard>
        <Toast />
      </AuthProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
