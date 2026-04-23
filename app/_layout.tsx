import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { LibraryProvider } from "../context/LibraryContext";
import { ActivityIndicator, View } from "react-native";

function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <AppLayout />
      </LibraryProvider>
    </AuthProvider>
  );
}
