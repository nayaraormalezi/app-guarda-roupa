import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useAuth } from "@/store/auth-store";
import { useWardrobe } from "@/store/wardrobe-store";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function AccountScreen() {
  const router = useRouter();
  const {
    configured,
    user,
    syncing,
    signInWithEmail,
    signUpWithEmail,
    signInWithApple,
    signOut,
    syncNow,
  } = useAuth();
  const { preferences, replacePersistedState, getPersistedSnapshot, updatePreferences } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");

  const finishAuthAndSync = async () => {
    await updatePreferences({ onboardingComplete: true });
    const merged = await syncNow({
      ...getPersistedSnapshot(),
      preferences: { ...getPersistedSnapshot().preferences, onboardingComplete: true },
    });
    if (merged) {
      await replacePersistedState({
        ...merged,
        preferences: { ...merged.preferences, onboardingComplete: true },
      });
    }
  };

  const onAuth = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert("Dados inválidos", "Informe e-mail e senha (mín. 6 caracteres).");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") await signInWithEmail(email.trim(), password);
      else await signUpWithEmail(email.trim(), password, preferences.displayName);
      await finishAuthAndSync();
      Alert.alert(
        "Conta",
        mode === "in"
          ? "Login feito e dados sincronizados."
          : "Conta criada. Verifique o e-mail se necessário."
      );
      router.back();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  };

  const onApple = async () => {
    setBusy(true);
    try {
      await signInWithApple();
      await finishAuthAndSync();
      Alert.alert("Conta", "Login Apple e sync concluídos.");
      router.back();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Falha no Apple Sign In");
    } finally {
      setBusy(false);
    }
  };

  const onSync = async () => {
    setBusy(true);
    try {
      const merged = await syncNow(getPersistedSnapshot());
      if (!merged) {
        Alert.alert("Sync", "Faça login para sincronizar com a nuvem.");
        return;
      }
      await replacePersistedState(merged);
      const looks = merged.savedLooks.length;
      const pieces = merged.wardrobe.length;
      Alert.alert(
        "Sync",
        `Dados atualizados: ${pieces} peça${pieces === 1 ? "" : "s"}, ${looks} look${looks === 1 ? "" : "s"}.`
      );
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Falha no sync");
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.content}>
          <Text style={styles.title}>Conta na nuvem</Text>
          <Text style={styles.sub}>
            Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY, rode o schema em
            supabase/schema.sql e a Edge Function ai com o secret GEMINI_API_KEY.
          </Text>
          <Text style={styles.hint}>Enquanto isso, o app continua 100% local neste aparelho.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>{user ? "Sua conta" : "Entrar"}</Text>
        <Text style={styles.sub}>
          {user
            ? "Sync mantém closet e fotos na nuvem. Use Sair para encerrar a sessão neste aparelho."
            : "Crie conta para sincronizar entre aparelhos. A IA usa Edge Functions no servidor."}
        </Text>

        {user ? (
          <>
            <View style={styles.userCard}>
              <Text style={styles.userLabel}>Conectada como</Text>
              <Text style={styles.userEmail}>{user.email ?? user.id.slice(0, 8)}</Text>
            </View>
            <Pressable style={styles.primary} onPress={onSync} disabled={busy || syncing}>
              {busy || syncing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>Sincronizar agora</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.logout}
              disabled={busy}
              onPress={() => {
                Alert.alert(
                  "Sair da conta",
                  "Encerrar a sessão neste aparelho? Os dados locais permanecem.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Sair",
                      style: "destructive",
                      onPress: async () => {
                        setBusy(true);
                        try {
                          await signOut();
                          Alert.alert("Sessão encerrada", "Você saiu da conta.");
                          router.back();
                        } catch (e) {
                          Alert.alert("Erro", e instanceof Error ? e.message : "Falha ao sair");
                        } finally {
                          setBusy(false);
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.logoutText}>Sair da conta</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="E-mail"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Senha"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            <Pressable style={styles.primary} onPress={onAuth} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>{mode === "in" ? "Entrar" : "Criar conta"}</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setMode(mode === "in" ? "up" : "in")}>
              <Text style={styles.switch}>
                {mode === "in" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
              </Text>
            </Pressable>
            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={14}
                style={{ width: "100%", height: 44, marginTop: 16 }}
                onPress={onApple}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 20 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.goldDark, marginTop: 16 },
  input: {
    marginTop: 14,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  primary: {
    marginTop: 18,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  userCard: {
    marginTop: 18,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
  },
  userLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userEmail: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, marginTop: 4 },
  secondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  logout: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(185,28,28,0.25)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  logoutText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: "#B91C1C" },
  switch: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.goldDark,
  },
  });
}
