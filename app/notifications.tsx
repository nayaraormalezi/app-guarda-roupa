import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const KEY = "@personal_stylist/notify_tomorrow";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function scheduleTomorrowLookReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Look de amanhã",
      body: "Abra o Personal Stylist e veja a sugestão para o seu dia.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(KEY);
      setEnabled(saved === "1");
      setReady(true);
    })();
  }, []);

  const toggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão", "Ative notificações nas Ajustes do iPhone para receber lembretes.");
        return;
      }
      await scheduleTomorrowLookReminder();
      await AsyncStorage.setItem(KEY, "1");
      setEnabled(true);
      Alert.alert("Ativado", "Lembrete diário às 20h para o look de amanhã.");
      return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(KEY, "0");
    setEnabled(false);
  };

  if (!ready) return <View style={styles.safe} />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Notificações</Text>
        <Text style={styles.sub}>Lembrete opcional para revisar o look do dia seguinte.</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Look de amanhã</Text>
            <Text style={styles.hint}>Todo dia às 20:00</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggle}
            trackColor={{ true: colors.gold, false: colors.creamDark }}
            thumbColor={colors.white}
          />
        </View>
        <Pressable
          style={styles.secondary}
          onPress={async () => {
            if (!enabled) {
              Alert.alert("Desativado", "Ative o lembrete primeiro.");
              return;
            }
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Teste",
                body: "Notificações do Personal Stylist estão funcionando.",
              },
              trigger: null,
            });
          }}
        >
          <Text style={styles.secondaryText}>Enviar teste</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 8, marginBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  secondary: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  });
}
