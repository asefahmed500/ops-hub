import { ColorValue, Pressable, Text as RNText, View } from "react-native";
import { Tabs } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMto } from "@/lib/mto";
import { NotificationSheet } from "@/components/mto-bits";
import { HomeIcon, UsersIcon, CheckIcon, BarChartIcon, SettingsIcon, BellIcon } from "@/components/ui/icon";

function TabBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useMto();
  const unread = notifications.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        className="mr-2 h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
      >
        <BellIcon size={18} color="rgb(var(--foreground))" strokeWidth={1.8} />
        {unread > 0 ? (
          <View className="absolute -right-0.5 -top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1">
            <RNText style={{ color: "#fff", fontSize: 10, fontWeight: "500" }}>{unread > 9 ? "9+" : unread}</RNText>
          </View>
        ) : null}
      </Pressable>
      <NotificationSheet
        visible={open}
        items={notifications}
        onClose={() => setOpen(false)}
        onRead={(id) => void markNotificationRead(id)}
        onReadAll={() => void markAllNotificationsRead()}
      />
    </>
  );
}

function TabIcon({ as: IconComp, focused, color }: { as: React.ComponentType<any>; focused: boolean; color?: ColorValue }) {
  return <IconComp size={21} color={color} strokeWidth={focused ? 2.1 : 1.7} />;
}

export default function HrLayout() {
  const { refresh } = useMto();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "rgb(var(--primary))",
        tabBarInactiveTintColor: "rgb(var(--muted-foreground))",
        headerRight: () => <TabBell />,
        headerTitleStyle: { fontWeight: "500" },
        tabBarStyle: {
          backgroundColor: "rgb(var(--card))",
          borderTopColor: "rgb(var(--border))",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarLabel: "Overview",
          tabBarIcon: ({ color, focused }) => <TabIcon as={HomeIcon} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trainees"
        options={{
          title: "Trainees",
          tabBarIcon: ({ color, focused }) => <TabIcon as={UsersIcon} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: "Reviews",
          tabBarIcon: ({ color, focused }) => <TabIcon as={CheckIcon} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, focused }) => <TabIcon as={BarChartIcon} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => <TabIcon as={SettingsIcon} focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
