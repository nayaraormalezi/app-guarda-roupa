import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, Sparkles } from "lucide-react-native";
import { OutfitCardView } from "@/components/OutfitCardView";
import type { ChatMessage, Outfit } from "@/data/types";
import { outfitToRefs } from "@/data/types";
import { askStylist } from "@/lib/stylist-chat";
import { createId } from "@/lib/storage";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const QUICK = [
  "O que vestir amanhã?",
  "Trabalho casual arrumado",
  "Look para festa",
  "Vou para a praia",
];

export default function StylistScreen() {
  const {
    wardrobe,
    preferences,
    weekPlan,
    saveLook,
    chatMessages,
    appendChatMessages,
    resolveOutfitRefs,
  } = useWardrobe();
  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [localMsgs, setLocalMsgs] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setLocalMsgs(
      chatMessages.map((m) => ({
        ...m,
        outfit: m.outfit ?? (m.outfitRefs ? resolveOutfitRefs(m.outfitRefs) : undefined),
      }))
    );
  }, [chatMessages, resolveOutfitRefs]);

  const hydrated = useMemo(() => localMsgs, [localMsgs]);

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: createId(), role: "user", text };
    setLocalMsgs((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await askStylist({
        userText: text,
        wardrobe,
        weekPlan,
        displayName: preferences.displayName,
        city: preferences.city,
        styleTags: preferences.styleTags,
        history: [...hydrated, userMsg],
      });
      const aiMsg: ChatMessage = {
        id: createId(),
        role: "ai",
        text: reply.text,
        outfit: reply.outfit,
        outfitRefs: reply.outfit ? outfitToRefs(reply.outfit) : undefined,
      };
      setLocalMsgs((m) => [...m, aiMsg]);
      await appendChatMessages([userMsg, aiMsg]);
    } catch {
      const aiMsg: ChatMessage = {
        id: createId(),
        role: "ai",
        text: "Não consegui processar agora. Tente de novo em instantes.",
      };
      setLocalMsgs((m) => [...m, aiMsg]);
      await appendChatMessages([userMsg, aiMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const saveOutfit = async (outfit: Outfit) => {
    await saveLook(outfit, "Look do stylist");
    Alert.alert("Look salvo", "Disponível em Mais → Looks salvos.");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Sparkles size={16} color={colors.gold} />
        </View>
        <View>
          <Text style={styles.title}>IA Stylist</Text>
          <Text style={styles.online}>Online · guarda-roupa real</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={hydrated}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.row, item.role === "user" ? styles.rowUser : styles.rowAi]}>
            {item.role === "ai" && (
              <View style={styles.miniAvatar}>
                <Sparkles size={11} color={colors.gold} />
              </View>
            )}
            <View style={{ maxWidth: "82%", gap: 10 }}>
              <View
                style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAi]}
              >
                <Text style={[styles.bubbleText, item.role === "user" && { color: colors.white }]}>
                  {item.text}
                </Text>
              </View>
              {item.outfit && Object.values(item.outfit).some(Boolean) && (
                <OutfitCardView
                  outfit={item.outfit}
                  onSave={() => saveOutfit(item.outfit!)}
                  onSwap={() => send("Monte outra combinação com peças diferentes")}
                />
              )}
            </View>
          </View>
        )}
        ListFooterComponent={
          loading ? (
            <View style={styles.rowAi}>
              <View style={styles.miniAvatar}>
                <Sparkles size={11} color={colors.gold} />
              </View>
              <View style={[styles.bubble, styles.bubbleAi]}>
                <Text style={styles.bubbleText}>Montando look…</Text>
              </View>
            </View>
          ) : null
        }
      />

      {hydrated.length < 4 && (
        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <Pressable key={q} style={styles.quick} onPress={() => send(q)}>
              <Text style={styles.quickText}>{q}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte para sua stylist…"
          placeholderTextColor={colors.soft}
          style={styles.input}
          onSubmitEditing={() => send()}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.send, !input.trim() && { backgroundColor: colors.creamDark }]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Send size={13} color={input.trim() ? colors.white : colors.soft} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  online: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  list: { padding: 20, gap: 16, paddingBottom: 12 },
  row: { flexDirection: "row", marginBottom: 16 },
  rowUser: { justifyContent: "flex-end" },
  rowAi: { justifyContent: "flex-start", gap: 10 },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  bubbleUser: { backgroundColor: colors.ink, borderTopRightRadius: 4 },
  bubbleAi: { backgroundColor: colors.white, borderTopLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  quick: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.ink },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.ink, paddingVertical: 8 },
  send: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
