import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { Button } from "../../components/Button";
import { FormMessage } from "../../components/FormMessage";
import { Text } from "../../components/Text";
import { TextField } from "../../components/TextField";
import { signInWithEmail, signInWithGoogle } from "../../lib/auth";
import { validateSignIn, type SignInFields } from "../../lib/validation";

type FieldErrors = Partial<Record<keyof SignInFields, string>>;

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<"email" | "google" | null>(null);

  // A successful sign-in does not navigate from here: the session change is
  // picked up by the route guard in (app)/_layout.tsx.
  async function handleEmailSignIn() {
    const errors = validateSignIn({ email, password });
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setPending("email");
    const result = await signInWithEmail(email.trim(), password);
    setPending(null);
    if (!result.success) setFormError(result.error);
  }

  async function handleGoogleSignIn() {
    setFieldErrors({});
    setFormError(null);
    setPending("google");
    const result = await signInWithGoogle();
    setPending(null);
    if (!result.success) setFormError(result.error);
  }

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
    >
      <FormMessage message={formError} />

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
        placeholder="Your password"
        autoCapitalize="none"
        autoComplete="current-password"
        secureTextEntry
        textContentType="password"
        editable={pending === null}
        onSubmitEditing={handleEmailSignIn}
        returnKeyType="go"
      />

      <View className="mt-1.5">
        <Button
          label="Sign in"
          onPress={handleEmailSignIn}
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
        onPress={handleGoogleSignIn}
        loading={pending === "google"}
        disabled={pending !== null}
      />

      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-[14px] text-subtle">New here? </Text>
        <Link href="/sign-up">
          <Text className="py-2 text-[14px] font-semibold text-accent">
            Create an account
          </Text>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
