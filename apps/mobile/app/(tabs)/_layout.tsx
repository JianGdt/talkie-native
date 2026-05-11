import { Tabs } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useWebSocketStore } from "@/store/useWebSocketStore";

export default function TabsLayout() {
  const totalUnread = useWebSocketStore((state) =>
    state.conversations.reduce(
      (sum, conv) => sum + (conv.unread_count ?? 0),
      0,
    ),
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f3f4f6",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge:
            totalUnread > 0
              ? totalUnread > 99
                ? "99+"
                : totalUnread
              : undefined,
          tabBarBadgeStyle: { backgroundColor: "#ef4444", fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="message" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="messages/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="channels"
        options={{
          title: "Channels",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
