import { useCallback, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ScreenError, ScreenLoading } from "@/components/screen-state";
import { ConfirmModal } from "@/components/confirm-modal";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import type { Tenant } from "@/lib/types";

interface TenantWithCounts extends Tenant {
  users: number;
  logs: number;
  rotations: number;
  reviews: number;
}

export default function PlatformTenantsScreen() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<TenantWithCounts[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<TenantWithCounts | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setTenants(await api<TenantWithCounts[]>("/platform/tenants", { token }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load companies");
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const setStatus = async (tenant: TenantWithCounts, status: "active" | "suspended") => {
    if (!token) return;
    setBusy(true);
    try {
      await api(`/platform/tenants/${tenant.id}`, { method: "PATCH", body: { status }, token });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update company");
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  if (error && !tenants) return <ScreenError message={error} onRetry={() => void load()} />;
  if (!tenants) return <ScreenLoading label="Loading companies…" />;

  return (
    <Box className="flex-1 bg-background">
      {error ? (
        <Box className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <Text size="sm" weight="medium" className="text-destructive">
            {error}
          </Text>
        </Box>
      ) : null}
      <FlatList
        data={tenants}
        keyExtractor={(t) => t.id}
        contentContainerClassName="p-4 gap-2.5 pb-16"
        renderItem={({ item: t }) => (
          <Card className="p-3.5">
            <HStack space="md" className="justify-between">
              <VStack space="xs" className="flex-1 pr-2">
                <HStack space="sm">
                  <Text weight="medium" className="flex-shrink text-foreground" numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Badge size="sm" variant={t.status === "active" ? "success" : "destructive"}>
                    {t.status}
                  </Badge>
                </HStack>
                <Text size="xs" className="font-normal text-muted-foreground">
                  {t.slug} · {t.users} members
                </Text>
                <Text size="xs" className="font-normal text-muted-foreground">
                  {t.logs} logs · {t.rotations} rotations · {t.reviews} reviews
                </Text>
              </VStack>
              <Pressable
                onPress={() => setTarget(t)}
                disabled={busy}
                hitSlop={8}
                className="self-center rounded-md bg-secondary px-3 py-1.5 active:opacity-80"
              >
                <Text size="xs" weight="medium" className="text-secondary-foreground">
                  {t.status === "active" ? "Suspend" : "Activate"}
                </Text>
              </Pressable>
            </HStack>
          </Card>
        )}
        ListEmptyComponent={
          <Box className="items-center py-16">
            <Text size="sm" className="text-muted-foreground">
              No companies registered yet.
            </Text>
          </Box>
        }
      />

      <ConfirmModal
        visible={!!target}
        title={target?.status === "active" ? "Suspend Company" : "Activate Company"}
        message={
          target?.status === "active"
            ? `Suspend ${target?.name}? All of its users will be signed out and blocked until you activate it again.`
            : `Activate ${target?.name}? Its members will be able to sign in again.`
        }
        confirmLabel={target?.status === "active" ? "Suspend" : "Activate"}
        tone={target?.status === "active" ? "danger" : "primary"}
        onConfirm={() => (target ? setStatus(target, target.status === "active" ? "suspended" : "active") : Promise.resolve())}
        onCancel={() => setTarget(null)}
      />
    </Box>
  );
}
