import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { Button } from "../../components/Button";
import { FormMessage } from "../../components/FormMessage";
import { Text } from "../../components/Text";
import { TextField } from "../../components/TextField";
import { useAuth } from "../../hooks/useAuth";
import {
  requestPasswordReset,
  resetPassword,
  signOut,
  updatePassword,
} from "../../lib/auth";
import { validateEmail, validateResetPassword } from "../../lib/validation";

type Stage = "email" | "code" | "password";

export default function ResetPasswordScreen() {
  const { isRecovering } = useAuth();
  const [stage, setStage] = useState<Stage>(isRecovering ? "password" : "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"code" | "password" | "confirmPassword", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSendCode() {
    const error = validateEmail(email);
    setEmailError(error);
    setFormError(null);
    setNotice(null);
    if (error) return;

    setPending(true);
    const result = await requestPasswordReset(email.trim());
    setPending(false);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setNotice(result.notice ?? null);
    setStage("code");
  }

  async function handleSavePassword() {
    const errors = validateResetPassword({ email, code, password, confirmPassword });
    if (stage === "password") {
      delete errors.code;
      delete errors.email;
    }
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    const result =
      stage === "password"
        ? await updatePassword(password)
        : await resetPassword(email.trim(), code, password);
    setPending(false);
    if (!result.success) {
      setFormError(result.error);
      if (result.recoveryPending) setStage("password");
    }
  }

  async function handleCancel() {
    setPending(true);
    const result = await signOut();
    setPending(false);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setStage("email");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setFormError(null);
  }

  const title = stage === "email" ? "Reset your password" : "Choose a new password";
  const subtitle =
    stage === "email"
      ? "We will email you a 6-digit code."
      : stage === "code"
        ? "Enter the code from the email and a new password."
        : "Enter a new password for your account.";

  return (
    <AuthScreenLayout title={title} subtitle={subtitle}>
      <FormMessage message={formError} />
      <FormMessage message={notice} tone="info" />

      {stage === "email" ? (
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={emailError ?? undefined}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!pending}
          onSubmitEditing={handleSendCode}
          returnKeyType="go"
        />
      ) : null}

      {stage === "code" ? (
        <TextField
          label="Code"
          value={code}
          onChangeText={setCode}
          error={fieldErrors.code}
          placeholder="6-digit code"
          autoCapitalize="none"
          autoComplete="one-time-code"
          autoCorrect={false}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
          editable={!pending}
        />
      ) : null}

      {stage !== "email" ? (
        <>
          <TextField
            label="New password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            placeholder="At least 6 characters"
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            textContentType="newPassword"
            editable={!pending}
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
            editable={!pending}
            onSubmitEditing={handleSavePassword}
            returnKeyType="go"
          />
        </>
      ) : null}

      <View className="mt-1.5">
        <Button
          label={stage === "email" ? "Send code" : "Save password"}
          onPress={stage === "email" ? handleSendCode : handleSavePassword}
          loading={pending}
          disabled={pending}
        />
      </View>

      {stage === "code" ? (
        <View className="mt-4 items-center">
          <Text
            onPress={() => {
              if (pending) return;
              setStage("email");
              setCode("");
              setFormError(null);
            }}
            className="py-2 text-[14px] font-semibold text-accent"
          >
            Use a different email
          </Text>
        </View>
      ) : null}

      {stage === "password" ? (
        <View className="mt-4 items-center">
          <Text onPress={() => void handleCancel()} className="py-2 text-[14px] font-semibold text-accent">
            Cancel
          </Text>
        </View>
      ) : null}

      {stage !== "password" ? (
        <View className="mt-4 flex-row items-center justify-center">
          <Link href="/sign-in">
            <Text className="py-2 text-[14px] font-semibold text-accent">Back to sign in</Text>
          </Link>
        </View>
      ) : null}
    </AuthScreenLayout>
  );
}
