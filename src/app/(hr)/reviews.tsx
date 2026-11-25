import { useState } from "react";
import { FlatList, Modal, Pressable } from "react-native";
import { useMto } from "@/lib/mto";
import { ScreenLoading, ScreenError } from "@/components/screen-state";
import { Stars } from "@/components/mto-bits";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";

export default function ReviewsScreen() {
  const { reviews, decideReview, ready, error, refresh } = useMto();
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready) return <ScreenLoading label="Loading reviews…" />;

  const list = reviews.filter((r) => (tab === "pending" ? r.status === "pending" : r.status !== "pending"));
  const open = reviews.find((r) => r.id === openId) ?? null;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  const decide = async (outcome: "approved" | "changes_requested") => {
    if (!open || busy) return;
    setBusy(true);
    try {
      await decideReview(open.id, outcome, outcome === "approved" ? rating : null, comment);
      setOpenId(null);
      setRating(0);
      setComment("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="flex-1 bg-background">
      <HStack space="xs" className="mx-4 mt-3 rounded-xl bg-secondary p-1">
        {(["pending", "approved"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} className="flex-1 rounded-lg py-2">
            <Box className={tab === t ? "rounded-lg bg-card shadow-sm" : ""}>
              <Text className={`py-0.5 text-center ${tab === t ? "text-foreground" : "text-muted-foreground"}`}>
                {t === "pending" ? `Pending (${pendingCount})` : "Decided"}
              </Text>
            </Box>
          </Pressable>
        ))}
      </HStack>

      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        contentContainerClassName="p-4 gap-2.5 pb-16"
        renderItem={({ item: r }) => (
          <Card>
            <HStack space="sm" className="justify-between">
              <Text weight="medium" className="flex-1 text-foreground">
                {r.traineeName}
              </Text>
              <Badge size="sm" variant={r.status === "approved" ? "success" : r.status === "changes_requested" ? "warning" : "warning"}>
                {r.status === "pending" ? r.due : r.status === "approved" ? `Done · ${r.rating}/5` : "Changes requested"}
              </Badge>
            </HStack>
            <Text size="xs" className="mt-1 font-normal text-muted-foreground">
              {r.dept} · {r.kind}
            </Text>
            {r.status === "pending" ? (
              <Button
                onPress={() => {
                  setOpenId(r.id);
                  setRating(0);
                  setComment("");
                }}
                className="btn mt-3 self-start px-4"
              >
                <ButtonText>Open review</ButtonText>
              </Button>
            ) : r.comment ? (
              <Text size="xs" className="mt-2 font-normal text-muted-foreground" numberOfLines={2}>
                “{r.comment}”
              </Text>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={
          <Box className="items-center py-16">
            <Text size="sm" className="font-normal text-muted-foreground">
              No items.
            </Text>
          </Box>
        }
      />

      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpenId(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpenId(null)}>
          <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
            <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            {open ? (
              <>
                <Heading size="md" className="text-foreground">
                  {open.traineeName}
                </Heading>
                <Text size="xs" className="mt-1 font-normal text-muted-foreground">
                  {open.dept} · {open.kind} · {open.due}
                </Text>
                <Text size="xs" weight="medium" className="mb-1 mt-4 text-muted-foreground">
                  Rating
                </Text>
                <Stars value={rating} onChange={setRating} />
                <Text size="xs" weight="medium" className="mb-1 mt-4 text-muted-foreground">
                  Comment
                </Text>
                <Input className="min-h-20 items-start py-2.5">
                  <InputField
                    multiline
                    textAlignVertical="top"
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Feedback for the trainee…"
                  />
                </Input>
                <Button onPress={() => void decide("approved")} disabled={busy || !rating} className={`btn mt-5 ${!rating ? "opacity-60" : ""}`}>
                  <ButtonText>{busy ? "Saving…" : "Approve"}</ButtonText>
                </Button>
                <Button  onPress={() => void decide("changes_requested")} disabled={busy} className="btn mt-2">
                  <ButtonText className="text-foreground">Request changes</ButtonText>
                </Button>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Box>
  );
}
