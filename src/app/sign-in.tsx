import { useState } from "react";
import { Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { PasswordTextField, TextField } from "@/components/fields";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async () => {
    const next: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter your work email";
    }
    if (!password) next.password = "Enter your password";
    setErrors(next);
    if (Object.keys(next).length || busy) return;

    setBusy(true);
    setServerError(null);
    try {
      // One login for everyone — the account decides where you land
      await signIn(email.trim(), password);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your programme."
      footer={
        <VStack space="md" className="items-center">
          <HStack space="xs" className="items-center">
            <Text size="sm" className="font-normal text-muted-foreground">
              New trainee?
            </Text>
            <Pressable onPress={() => router.push("/join")} hitSlop={8}>
              <Text size="sm" className="text-primary">
                Create account
              </Text>
            </Pressable>
          </HStack>
          <Pressable onPress={() => router.push("/sign-up")} hitSlop={8}>
            <Text size="xs" className="font-normal text-muted-foreground">
              HR? Register your company programme
            </Text>
          </Pressable>
        </VStack>
      }
    >
      {serverError ? (
        <Box className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <Text size="sm" className="text-destructive">
            {serverError}
          </Text>
        </Box>
      ) : null}

      <VStack space="md">
        <TextField
          label="Work email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          placeholder="name@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />
        <PasswordTextField
          label="Password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password}
        />

        <Pressable onPress={() => router.push("/forgot-password")} hitSlop={8} className="self-start">
          <Text size="sm" className="text-primary">
            Forgot password?
          </Text>
        </Pressable>
      </VStack>

      <Button onPress={submit} disabled={busy} className={`btn ${busy ? "opacity-60" : ""}`}>
        <ButtonText>{busy ? "Signing in…" : "Sign in"}</ButtonText>
      </Button>
    </AuthShell>
  );
}
