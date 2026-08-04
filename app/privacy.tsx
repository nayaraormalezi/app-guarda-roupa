import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacidade</Text>
        <Text style={styles.p}>
          Seus looks e fotos ficam neste aparelho por padrão. Com conta, sincronizamos de forma
          segura via Supabase. Análise de fotos e o chat do stylist usam IA no servidor quando a
          nuvem está configurada — a chave da IA não precisa ficar no app em produção.
        </Text>
        <Text style={styles.h}>O que guardamos</Text>
        <Text style={styles.p}>
          Peças, fotos, planos da semana, looks salvos, desejos e histórico do chat. Cidade para
          clima. E-mail ou Apple ID se você entrar na conta.
        </Text>
        <Text style={styles.h}>Permissões</Text>
        <Text style={styles.p}>
          Câmera e galeria só para cadastrar peças. Notificações são opcionais (lembrete do look de
          amanhã).
        </Text>
        <Text style={styles.h}>Seus direitos</Text>
        <Text style={styles.p}>
          Apague peças e looks a qualquer momento. Desinstalar remove dados locais. Conta na nuvem
          pode ser encerrada em Conta → Sair / exclusão sob solicitação.
        </Text>
        <Text style={styles.meta}>Versão completa em PRIVACY.md do projeto.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.cream },
    content: { padding: 24, paddingBottom: 40 },
    title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginBottom: 12 },
    h: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, marginTop: 18, marginBottom: 6 },
    p: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 20 },
    meta: { fontFamily: fonts.mono, fontSize: 10, color: colors.soft, marginTop: 24 },
  });
}
