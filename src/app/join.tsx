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

export default function JoinScreen() {
  const { joinProgramme } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async () => {
    const next: Record<string, string | undefined> = {};
    if (!inviteCode.trim()) next.inviteCode = "Enter the company code from HR";
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid work email";
    if (password.length < 8) next.password = "Use at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length || busy) return;

    setBusy(true);
    setServerError(null);
    try {
      await joinProgramme(inviteCode.trim(), name.trim(), email.trim(), password, dept.trim());
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Could not join the programme");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Use the company code from HR"
      footer={
        <HStack space="xs" className="items-center">
          <Text size="sm" className="font-normal text-muted-foreground">
            Already have an account?
          </Text>
          <Pressable onPress={() => router.push("/sign-in")} hitSlop={8}>
            <Text size="sm" className="text-primary">
              Sign in
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
          label="Company code"
          value={inviteCode}
          onChangeText={(v) => {
            setInviteCode(v);
            if (errors.inviteCode) setErrors((p) => ({ ...p, inviteCode: undefined }));
          }}
          placeholder="MTO-XXXX-0000"
          autoCapitalize="none"
          
          error={errors.inviteCode}
        />
        <TextField
          label="Full name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          placeholder="Nusrat Jahan"
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
        <TextField
          label="Department (optional)"
          value={dept}
          onChangeText={setDept}
          placeholder="e.g. Marketing"
          autoCapitalize="words"
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
        <ButtonText>{busy ? "Joining…" : "Continue"}</ButtonText>
      </Button>
    </AuthShell>
  );
}
