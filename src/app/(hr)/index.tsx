import { Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useMto } from "@/lib/mto";
import { ProgressBar, StatCard } from "@/components/mto-bits";
import { ScreenLoading, ScreenError } from "@/components/screen-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";

export default function HrOverview() {
  const { me, trainees, reviews, reports, ready, error, refresh } = useMto();

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready || !me) return <ScreenLoading label="Loading overview…" />;

  const pending = reviews.filter((r) => r.status === "pending").length;
  const active = trainees.filter((t) => t.active);
  const avg = active.length ? Math.round(active.reduce((s, t) => s + t.progress, 0) / active.length) : 0;
  const maxLog = Math.max(1, ...(reports?.weeklyLogs ?? []).map((w) => w.count));
  const lowProgress = active.filter((t) => t.progress < 30);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          HR · MTO programme · {me.companyName}
        </Text>
        <Heading size="xl" className="mt-0.5 text-foreground">
          Overview
        </Heading>

        <HStack space="md" className="mt-4">
          <StatCard label="Active trainees" value={active.length} />
          <StatCard label="Logs this week" value={reports?.logsThisWeek ?? 0} />
        </HStack>
        <HStack space="md" className="mt-3">
          <Pressable className="flex-1" onPress={() => router.push("/(hr)/reviews" as never)}>
            <StatCard label="Reviews pending" value={pending} tone={pending ? "warn" : undefined} />
          </Pressable>
          <StatCard label="Avg progress" value={`${avg}%`} />
        </HStack>

        <Card className="mt-3">
          <Text weight="medium" className="text-foreground">
            Weekly logging
          </Text>
          <HStack className="mt-3 h-20 items-end gap-2">
            {(reports?.weeklyLogs ?? []).map((w, i, arr) => (
              <Box
                key={w.label}
                className={`flex-1 rounded-t-md ${i === arr.length - 1 ? "bg-primary" : "bg-accent"}`}
                style={{ height: `${Math.max(8, Math.round((w.count / maxLog) * 100))}%` }}
              />
            ))}
          </HStack>
          <HStack className="mt-2 justify-between">
            {(reports?.weeklyLogs ?? []).filter((_, i, a) => i === 0 || i === a.length - 1).map((w) => (
              <Text key={w.label} size="2xs" className="font-normal text-muted-foreground">
                {w.label}
              </Text>
            ))}
          </HStack>
        </Card>

        {lowProgress.length > 0 ? (
          <Pressable onPress={() => router.push("/(hr)/trainees" as never)} className="mt-3 active:opacity-80">
            <Card>
              <HStack space="sm" className="justify-between">
                <Text className="flex-1 text-foreground">
                  {lowProgress.length} trainee{lowProgress.length > 1 ? "s" : ""} with low progress
                </Text>
                <Badge size="sm" variant="warning">
                  Review
                </Badge>
              </HStack>
            </Card>
          </Pressable>
        ) : null}
      </Box>
    </ScrollView>
  );
}
