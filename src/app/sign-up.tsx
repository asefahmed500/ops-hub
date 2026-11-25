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
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const { registerCompany, applySession } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [session, setSession] = useState<Parameters<typeof applySession>[0] | null>(null);

  const submit = async () => {
    const next: Record<string, string | undefined> = {};
    if (companyName.trim().length < 2) next.companyName = "Enter your company name";
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid work email";
    if (password.length < 8) next.password = "Use at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length || busy) return;

    setBusy(true);
    setServerError(null);
    try {
      const s = await registerCompany(companyName.trim(), name.trim(), email.trim(), password);
      // Hold the session — show the invite code first so the admin can copy it
      setInviteCode(s.inviteCode ?? "—");
      setSession(s);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Could not create your company workspace");
    } finally {
      setBusy(false);
    }
  };

  if (inviteCode && session) {
    return (
      <AuthShell
        title="Your invite code"
        subtitle="Share it with your MTOs — they use it to join your programme"
      >
        <Card className="items-center p-6">
          <Text className="text-2xl tracking-[0.08em] text-primary">{inviteCode}</Text>
          <Text size="xs" className="mt-2 font-normal text-muted-foreground">
            Find it anytime in Settings.
          </Text>
        </Card>
        <Button onPress={() => applySession(session)} className="btn">
          <ButtonText>Enter workspace</ButtonText>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Register your company"
      subtitle="Set up an MTO programme — you become the HR admin"
      footer={
        <HStack space="xs" className="items-center">
          <Text size="sm" className="font-normal text-muted-foreground">
            Are you a trainee?
          </Text>
          <Pressable onPress={() => router.push("/join")} hitSlop={8}>
            <Text size="sm" className="text-primary">
              Join with a company code
            </Text>
          </Pressable>
        </HStack>
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
          label="Company name"
          value={companyName}
          onChangeText={(v) => {
            setCompanyName(v);
            if (errors.companyName) setErrors((p) => ({ ...p, companyName: undefined }));
          }}
          placeholder="e.g. Square Group"
          autoCapitalize="words"
          error={errors.companyName}
        />
        <TextField
          label="Your full name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          placeholder="e.g. Mr. Rahman"
          autoCapitalize="words"
          autoComplete="name"
          error={errors.name}
        />
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
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          error={errors.password}
        />
      </VStack>

      <Button onPress={submit} disabled={busy} className={`btn ${busy ? "opacity-60" : ""}`}>
        <ButtonText>{busy ? "Creating programme…" : "Create programme"}</ButtonText>
      </Button>
    </AuthShell>
  );
}
