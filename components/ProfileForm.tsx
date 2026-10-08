import { Camera } from "lucide-react-native";
import { Pressable, View } from "react-native";

import type { UseProfileFormResult } from "../hooks/useProfileForm";
import type { Profile } from "../lib/profiles";
import { colors, shadows } from "../lib/theme";
import { MAX_NAME_LENGTH } from "../lib/validation";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { FormMessage } from "./FormMessage";
import { InterestChips } from "./InterestChips";
import { Text } from "./Text";
import { TextField } from "./TextField";

export interface ProfileFormProps {
  profile: Profile;
  form: UseProfileFormResult;
  onSave: () => void;
  onDone: () => void;
}

const AVATAR_SIZE = 88;

export function ProfileForm({ profile, form, onSave, onDone }: ProfileFormProps) {
  const { values, setValue, nameError, formError, savedNotice, isSaving } = form;
  const isLocked = isSaving || savedNotice !== null;
  const name = values.fullName.trim() || profile.email || "Traveller";
  const picked = values.avatar?.uri ?? null;
  const photoLabel = picked || profile.avatar_path ? "Change photo" : "Add a photo";

  return (
    <View>
      {/* The picture, its camera badge, and the label are one target. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photoLabel}
        accessibilityState={{ disabled: isLocked }}
        disabled={isLocked}
        hitSlop={8}
        onPress={() => void form.pickAvatar()}
        className="mb-3.5 items-center self-center px-4 active:opacity-60"
      >
        <View>
          {/* A picked picture is local, so it is shown as it is; the saved one is signed. */}
          <Avatar
            path={picked ? null : profile.avatar_path}
            uri={picked ?? profile.avatar_url}
            name={name}
            size={AVATAR_SIZE}
          />
          <View
            style={shadows.soft}
            className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-surface"
          >
            <Camera size={16} color={colors.ink} />
          </View>
        </View>
        <Text className="mt-2 text-[14px] font-medium text-ink">{photoLabel}</Text>
      </Pressable>

      <TextField
        label="Name"
        hint={`${values.fullName.length}/${MAX_NAME_LENGTH}`}
        value={values.fullName}
        onChangeText={(text) => setValue("fullName", text)}
        error={nameError ?? undefined}
        placeholder="Ada Lovelace"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="done"
        maxLength={MAX_NAME_LENGTH}
        editable={!isLocked}
      />

      <InterestChips
        selected={values.interests}
        onChange={(interests) => setValue("interests", interests)}
        disabled={isLocked}
      />

      <View className="mt-3">
        <FormMessage message={formError} />
        <FormMessage message={savedNotice} tone="info" />
        {savedNotice ? (
          <Button label="Done" onPress={onDone} />
        ) : (
          <Button label="Save changes" onPress={onSave} loading={isSaving} />
        )}
      </View>
    </View>
  );
}
