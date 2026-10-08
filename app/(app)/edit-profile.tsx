import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { FormScreen } from "../../components/FormScreen";
import { ProfileForm } from "../../components/ProfileForm";
import { Text } from "../../components/Text";
import { useProfile } from "../../hooks/useProfile";
import { useProfileForm } from "../../hooks/useProfileForm";
import type { Profile } from "../../lib/profiles";
import { colors } from "../../lib/theme";

interface EditProfileFormProps {
  profile: Profile;
  onClose: () => void;
}

// Its own component so the form's state starts from a profile that has loaded.
function EditProfileForm({ profile, onClose }: EditProfileFormProps) {
  const form = useProfileForm(profile);

  async function handleSave() {
    if (await form.save()) onClose();
  }

  return (
    <ProfileForm
      profile={profile}
      form={form}
      onSave={() => void handleSave()}
      onDone={onClose}
    />
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, isLoading, error } = useProfile();

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/profile");
  }

  return (
    <FormScreen title="Edit profile" onBack={close}>
      {profile ? (
        <EditProfileForm profile={profile} onClose={close} />
      ) : isLoading ? (
        <View className="py-10">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <Text className="py-6 text-center text-[14px] leading-5 text-subtle">
          {error ?? "Your profile isn't available. Sign out and in again."}
        </Text>
      )}
    </FormScreen>
  );
}
