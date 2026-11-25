import { Modal, Pressable, Text as RNText } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { MtoNotification } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <Box className={`h-1.5 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
      <Box className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </Box>
  );
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <HStack space="sm" className="mb-2 mt-5 justify-between">
      <Heading size="md" className="text-foreground">
        {title}
      </Heading>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text size="sm" className="text-primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </HStack>
  );
}

export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <HStack space="xs">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange?.(n)}
          disabled={!onChange}
          className="px-0.5"
          accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
        >
          <RNText style={{ fontSize: 26, lineHeight: 32, color: n <= value ? "rgb(var(--destructive))" : "rgb(var(--border))" }}>
            ★
          </RNText>
        </Pressable>
      ))}
    </HStack>
  );
}

export function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: "warn" | "accent" }) {
  return (
    <Card>
      <Heading size="2xl" className={tone === "warn" ? "text-amber" : tone === "accent" ? "text-primary" : "text-foreground"}>
        {value}
      </Heading>
      <Text size="xs" className="mt-0.5 font-normal text-muted-foreground">
        {label}
      </Text>
    </Card>
  );
}


export function CheckRow({ done, label, onToggle, sub }: { done: boolean; label: string; onToggle?: () => void; sub?: string }) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3.5 active:opacity-80">
      <Box
        className={`h-5.5 w-5.5 items-center justify-center rounded-md border ${
          done ? "border-primary bg-primary" : "border-input bg-card"
        }`}
        style={{ width: 22, height: 22 }}
      >
        {done ? (
          <RNText style={{ color: "rgb(var(--primary-foreground))", fontSize: 13, lineHeight: 16 }}>✓</RNText>
        ) : null}
      </Box>
      <VStack space="xs" className="flex-1">
        <Text className={done ? "text-muted-foreground" : "text-foreground"} numberOfLines={2}>
          {label}
        </Text>
        {sub ? (
          <Text size="xs" className="font-normal text-muted-foreground">
            {sub}
          </Text>
        ) : null}
      </VStack>
    </Pressable>
  );
}

export function NotificationSheet({
  visible,
  items,
  onClose,
  onRead,
  onReadAll,
}: {
  visible: boolean;
  items: MtoNotification[];
  onClose: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const unread = items.filter((n) => !n.read).length;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
          <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
          <HStack space="sm" className="mb-3 justify-between">
            <Heading size="md" className="text-foreground">
              Notifications
            </Heading>
            {unread > 0 ? (
              <Pressable onPress={onReadAll} hitSlop={8}>
                <Text size="sm" className="text-primary">
                  Mark all read
                </Text>
              </Pressable>
            ) : null}
          </HStack>
          <VStack space="sm" className="max-h-96">
            {items.length === 0 ? (
              <Text size="sm" className="py-6 text-center font-normal text-muted-foreground">
                Nothing yet.
              </Text>
            ) : (
              items.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => onRead(n.id)}
                  className={`rounded-xl border border-border bg-card p-3.5 active:opacity-80 ${n.read ? "" : "border-l-2 border-l-primary"}`}
                >
                  <HStack space="sm" className="justify-between">
                    <Text weight="medium" className="text-foreground">
                      {n.title}
                    </Text>
                    <Text size="2xs" className="font-normal text-muted-foreground">
                      {timeAgo(n.at)}
                    </Text>
                  </HStack>
                  <Text size="xs" className="mt-1 font-normal text-muted-foreground">
                    {n.message}
                  </Text>
                </Pressable>
              ))
            )}
          </VStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

