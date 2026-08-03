import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Não encontrado" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta tela não existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Voltar para Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.cream,
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  link: { marginTop: 16, paddingVertical: 12 },
  linkText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.goldDark },
});
