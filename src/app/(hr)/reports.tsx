import { useState } from "react";
import { Platform, Pressable, ScrollView, Share } from "react-native";
import { useAuth } from "@/lib/auth";
import { useMto } from "@/lib/mto";
import { api } from "@/lib/api";
import { ProgressBar, StatCard } from "@/components/mto-bits";
import { ScreenLoading, ScreenError } from "@/components/screen-state";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";

export default function ReportsScreen() {
  const { token } = useAuth();
  const { reports, trainees, ready, error, refresh } = useMto();
  const [exporting, setExporting] = useState(false);

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready) return <ScreenLoading label="Loading reports…" />;

  const exportCsv = async () => {
    if (!token || exporting) return;
    setExporting(true);
    try {
      const res = await api<{ filename: string; content: string }>("/reports/export", { token });
      if (Platform.OS === "web") {
        const blob = new Blob([res.content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: res.filename, message: res.content.slice(0, 4000) });
      }
    } finally {
      setExporting(false);
    }
  };

  const maxLog = Math.max(1, ...(reports?.weeklyLogs ?? []).map((w) => w.count));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          Programme insights
        </Text>
        <Heading size="xl" className="mt-0.5 text-foreground">
          Reports
        </Heading>

        <HStack space="md" className="mt-4">
          <StatCard label="Trainees" value={trainees.filter((t) => t.active).length} />
          <StatCard label="Logs this week" value={reports?.logsThisWeek ?? 0} />
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

        <Card className="mt-3">
          <Text weight="medium" className="text-foreground">
            Progress by department
          </Text>
          <VStack space="sm" className="mt-3">
            {(reports?.deptProgress ?? []).map((d) => (
              <VStack key={d.dept} space="xs">
                <HStack space="sm" className="justify-between">
                  <Text size="xs" className="text-muted-foreground">
                    {d.dept}
                  </Text>
                  <Text size="xs" className="text-muted-foreground">
                    {d.progress}%
                  </Text>
                </HStack>
                <ProgressBar value={d.progress} />
              </VStack>
            ))}
          </VStack>
        </Card>

        <Button className="btn mt-5" onPress={() => void exportCsv()} disabled={exporting}>
          <ButtonText>{exporting ? "Preparing…" : "Export logs (CSV)"}</ButtonText>
        </Button>
      </Box>
    </ScrollView>
  );
}
