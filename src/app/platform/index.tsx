import { useCallback, useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ScreenError, ScreenLoading } from "@/components/screen-state";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { ChevronRightIcon, BuildingIcon } from "@/components/ui/icon";
import { ConfirmModal } from "@/components/confirm-modal";

interface PlatformOverview {
  tenants: { total: number; active: number; suspended: number };
  users: number;
  logs: number;
  rotations: number;
  reviews: number;
  pendingReviews: number;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex-1 p-3.5">
      <Text size="xs" className="font-normal text-muted-foreground">
        {label}
      </Text>
      <Heading size="xl" className="mt-1 text-foreground">
        {value}
      </Heading>
    </Card>
  );
}

export default function PlatformOverviewScreen() {
  const { token, signOut } = useAuth();
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setData(await api<PlatformOverview>("/platform/overview", { token }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load platform data");
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setConfirmSignOut(true)} hitSlop={8} className="mr-3">
              <Text size="sm" weight="medium" className="text-destructive">
                Sign out
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-12">
        <Box className="mx-auto w-full max-w-5xl">
          <Text size="xs" weight="medium" className="text-muted-foreground">
            Platform operator console
          </Text>
          <Heading size="2xl" className="mt-1 text-foreground">
            OpsHub estate
          </Heading>

          {error ? (
            <Box className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <Text size="sm" weight="medium" className="text-destructive">
                {error}
              </Text>
            </Box>
          ) : null}

          {!data && !error ? (
            <ScreenLoading label="Loading platform data…" />
          ) : data ? (
            <>
              <HStack space="md" className="mt-4">
                <Stat label="Companies" value={data.tenants.total} />
                <Stat label="Active" value={data.tenants.active} />
                <Stat label="Suspended" value={data.tenants.suspended} />
              </HStack>
              <HStack space="md" className="mt-3">
                <Stat label="Users" value={data.users} />
                <Stat label="Logs" value={data.logs} />
                <Stat label="Rotations" value={data.rotations} />
              </HStack>
              <HStack space="md" className="mt-3">
                <Stat label="Reviews" value={data.reviews} />
                <Stat label="Pending reviews" value={data.pendingReviews} />
              </HStack>

              <Pressable onPress={() => router.push("/platform/tenants" as never)} className="mt-5">
                <Card className="p-4">
                  <HStack space="md" className="justify-between">
                    <HStack space="md">
                      <Box className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <BuildingIcon size={18} color="rgb(var(--primary))" strokeWidth={1.8} />
                      </Box>
                      <VStack space="xs">
                        <Text weight="medium" className="text-foreground">
                          Companies
                        </Text>
                        <Text size="xs" className="font-normal text-muted-foreground">
                          {data.tenants.total} registered · {data.tenants.suspended} suspended
                        </Text>
                      </VStack>
                    </HStack>
                    <ChevronRightIcon size={16} color="rgb(var(--muted-foreground))" />
                  </HStack>
                </Card>
              </Pressable>
            </>
          ) : null}
        </Box>
      </ScrollView>

      <ConfirmModal
        visible={confirmSignOut}
        title="Sign Out"
        message="End your platform operator session?"
        confirmLabel="Sign out"
        onConfirm={async () => {
          setConfirmSignOut(false);
          await signOut();
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </Box>
  );
}
