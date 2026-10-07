import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { Button } from "../../components/Button";
import { FormMessage } from "../../components/FormMessage";
import { Text } from "../../components/Text";
import { TextField } from "../../components/TextField";
import { signInWithGoogle, signUpWithEmail } from "../../lib/auth";
import { validateSignUp, type SignUpFields } from "../../lib/validation";

type FieldErrors = Partial<Record<keyof SignUpFields, string>>;

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"email" | "google" | null>(null);

  // Email confirmation is off for this phase, so a successful sign-up returns a
  // session straight away and the route guard moves us to home.
  async function handleEmailSignUp() {
    const errors = validateSignUp({ fullName, email, password, confirmPassword });
    setFieldErrors(errors);
    setFormError(null);
    setNotice(null);
    if (Object.keys(errors).length > 0) return;

    setPending("email");
    const result = await signUpWithEmail(fullName.trim(), email.trim(), password);
    setPending(null);
    if (!result.success) setFormError(result.error);
    else if (result.notice) setNotice(result.notice);
  }

  async function handleGoogleSignUp() {
    setFieldErrors({});
    setFormError(null);
    setNotice(null);
    setPending("google");
    const result = await signInWithGoogle();
    setPending(null);
    if (!result.success) setFormError(result.error);
  }

  return (
    <AuthScreenLayout
      title="Create your account"
      subtitle="Start planning trips in a couple of taps."
    >
      <FormMessage message={formError} />
      <FormMessage message={notice} tone="info" />

      <TextField
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        error={fieldErrors.fullName}
        placeholder="Ada Lovelace"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        editable={pending === null}
      />

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        editable={pending === null}
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        placeholder="At least 6 characters"
        autoCapitalize="none"
        autoComplete="new-password"
        secureTextEntry
        textContentType="newPassword"
        editable={pending === null}
      />

      <TextField
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={fieldErrors.confirmPassword}
        placeholder="Type it again"
        autoCapitalize="none"
        autoComplete="new-password"
        secureTextEntry
        textContentType="newPassword"
        editable={pending === null}
        onSubmitEditing={handleEmailSignUp}
        returnKeyType="go"
      />

      <View className="mt-1.5">
        <Button
          label="Create account"
          onPress={handleEmailSignUp}
          loading={pending === "email"}
          disabled={pending !== null}
        />
      </View>

      <View className="my-5 flex-row items-center">
        <View className="h-px flex-1 bg-ink/10" />
        <Text className="mx-3 text-[13px] text-subtle">or</Text>
        <View className="h-px flex-1 bg-ink/10" />
      </View>

      <Button
        label="Continue with Google"
        variant="secondary"
        onPress={handleGoogleSignUp}
        loading={pending === "google"}
        disabled={pending !== null}
      />

      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-[14px] text-subtle">Already have an account? </Text>
        <Link href="/sign-in">
          <Text className="py-2 text-[14px] font-semibold text-accent">Sign in</Text>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
