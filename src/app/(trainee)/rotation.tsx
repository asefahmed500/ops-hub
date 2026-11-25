import { useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { useMto } from "@/lib/mto";
import { CheckRow, ProgressBar, SectionHeader } from "@/components/mto-bits";
import { ScreenLoading, ScreenError } from "@/components/screen-state";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Modal } from "react-native";

export default function RotationScreen() {
  const { rotations, toggleObjective, ready, error, refresh } = useMto();
  const [openId, setOpenId] = useState<string | null>(null);

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready) return <ScreenLoading label="Loading rotations…" />;

  const open = rotations.find((r) => r.id === openId) ?? null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          12-month programme
        </Text>
        <Heading size="xl" className="mt-0.5 text-foreground">
          Rotation
        </Heading>

        <VStack space="sm" className="mt-4">
          {rotations.map((r, i) => {
            const done = r.objectives.filter((o) => o.done).length;
            const pct = r.objectives.length ? Math.round((done / r.objectives.length) * 100) : 0;
            return (
              <Pressable key={r.id} onPress={() => setOpenId(r.id)} className="active:opacity-80">
                <Card className={r.status === "active" ? "border-l-2 border-l-primary" : ""}>
                  <HStack space="sm" className="justify-between">
                    <Text weight="medium" className="flex-1 text-foreground">
                      {i + 1} · {r.name}
                    </Text>
                    <Badge size="sm" variant={r.status === "done" || r.status === "active" ? "success" : "default"}>
                      {r.status === "done" ? "Done" : r.status === "active" ? "Active" : "Upcoming"}
                    </Badge>
                  </HStack>
                  <Text size="xs" className="mt-1 font-normal text-muted-foreground">
                    {r.window} · {r.objectives.length} objectives
                  </Text>
                  {r.status !== "upcoming" ? <ProgressBar value={pct} className="mt-2.5" /> : null}
                </Card>
              </Pressable>
            );
          })}
        </VStack>
      </Box>

      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpenId(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpenId(null)}>
          <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
            <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            {open ? (
              <>
                <HStack space="sm" className="justify-between">
                  <Heading size="md" className="flex-1 text-foreground">
                    {open.name}
                  </Heading>
                  <Badge size="sm" variant={open.status === "upcoming" ? "default" : "success"}>
                    {open.status}
                  </Badge>
                </HStack>
                <Text size="xs" className="mt-1 font-normal text-muted-foreground">
                  {open.window}
                </Text>
                <VStack space="sm" className="mt-4">
                  {open.objectives.map((o) => (
                    <CheckRow
                      key={o.id}
                      done={o.done}
                      label={o.title}
                      onToggle={() => void toggleObjective(open.id, o.id)}
                    />
                  ))}
                </VStack>
                <Button  onPress={() => setOpenId(null)} className="btn mt-4">
                  <ButtonText className="text-foreground">Close</ButtonText>
                </Button>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
