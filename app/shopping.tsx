import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, ExternalLink, Heart, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react-native";
import { wardrobeGaps } from "@/lib/outfit-engine";
import {
  buildShoppingSearchFallbacks,
  fetchLiveShoppingProducts,
  normalizeFavoriteStoreInput,
  STORE_PRESETS,
  toWishFromProduct,
  type ShoppingProduct,
} from "@/lib/shopping-recs";
import { useWardrobe } from "@/store/wardrobe-store";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function ShoppingScreen() {
  const {
    wardrobe,
    preferences,
    wishList,
    favoriteStores,
    addWish,
    removeWish,
    addFavoriteStore,
    removeFavoriteStore,
  } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [products, setProducts] = useState<ShoppingProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);

  const gaps = useMemo(() => wardrobeGaps(wardrobe), [wardrobe]);

  const loadProducts = useCallback(async () => {
    if (!favoriteStores.length) {
      setProducts([]);
      setLoadError("");
      setUsedFallback(false);
      return;
    }
    setLoadingProducts(true);
    setLoadError("");
    setUsedFallback(false);
    try {
      const live = await fetchLiveShoppingProducts({
        wardrobe,
        stores: favoriteStores,
        styleTags: preferences.styleTags,
      });
      if (live.length) {
        setProducts(live);
        return;
      }
      setUsedFallback(true);
      setProducts(
        buildShoppingSearchFallbacks({
          wardrobe,
          stores: favoriteStores,
          styleTags: preferences.styleTags,
        })
      );
      setLoadError(
        "Ainda não encontramos produtos com foto agora. Mostrando busca rápida na loja — toque em atualizar em instantes."
      );
    } catch (e) {
      setUsedFallback(true);
      setProducts(
        buildShoppingSearchFallbacks({
          wardrobe,
          stores: favoriteStores,
          styleTags: preferences.styleTags,
        })
      );
      setLoadError(
        e instanceof Error
          ? e.message
          : "Falha ao buscar produtos. Exibindo busca nas lojas favoritas."
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [wardrobe, favoriteStores, preferences.styleTags]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const wishedKeys = useMemo(
    () => new Set(wishList.map((w) => `${w.label}|${w.buyUrl ?? w.gapId ?? ""}`.toLowerCase())),
    [wishList]
  );

  const onAddStore = async () => {
    const normalized = normalizeFavoriteStoreInput(storeName, storeUrl);
    if (!normalized) {
      Alert.alert("Dados inválidos", "Informe o nome e a URL da loja (ex: https://www.zara.com/br/).");
      return;
    }
    setAdding(true);
    try {
      await addFavoriteStore(normalized);
      setStoreName("");
      setStoreUrl("");
    } finally {
      setAdding(false);
    }
  };

  const onAddPreset = async (preset: (typeof STORE_PRESETS)[number]) => {
    const already = favoriteStores.some(
      (s) => s.url.replace(/\/$/, "") === preset.url.replace(/\/$/, "")
    );
    if (already) {
      Alert.alert("Já adicionada", `${preset.name} já está nas suas lojas favoritas.`);
      return;
    }
    await addFavoriteStore(preset);
  };

  const onFavorite = async (product: ShoppingProduct) => {
    const key = `${product.title}|${product.buyUrl}`.toLowerCase();
    if (wishedKeys.has(key)) {
      Alert.alert("Já favoritada", "Essa peça já está na lista de desejos.");
      return;
    }
    await addWish(toWishFromProduct(product));
    Alert.alert("Favoritada", "Salva na lista de desejos.");
  };

  const onBuy = async (product: ShoppingProduct) => {
    try {
      const can = await Linking.canOpenURL(product.buyUrl);
      if (!can) {
        Alert.alert("Link indisponível", "Não foi possível abrir a loja neste aparelho.");
        return;
      }
      await Linking.openURL(product.buyUrl);
    } catch {
      Alert.alert("Erro", "Falha ao abrir o link de compra.");
    }
  };

  const onBuyWish = async (url?: string) => {
    if (!url) {
      Alert.alert("Sem link", "Este desejo não tem link de compra.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sub}>
          Cadastre lojas favoritas. Buscamos produtos reais (imagem e link de compra) alinhados às
          lacunas do seu guarda-roupa.
        </Text>

        <View style={styles.card}>
          <Text style={styles.headText}>Lojas favoritas</Text>
          <Text style={styles.hint}>
            Adicione pelo menos uma loja. Produtos vêm com foto e link da vitrine.
          </Text>

          {favoriteStores.length > 0 && (
            <View style={styles.storeChips}>
              {favoriteStores.map((s) => (
                <View key={s.id} style={styles.storeChip}>
                  <Text style={styles.storeChipText}>{s.name}</Text>
                  <Pressable onPress={() => removeFavoriteStore(s.id)} hitSlop={8}>
                    <Trash2 size={12} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.presetLabel}>Sugestões rápidas</Text>
          <View style={styles.presets}>
            {STORE_PRESETS.map((p) => {
              const on = favoriteStores.some(
                (s) => s.url.replace(/\/$/, "") === p.url.replace(/\/$/, "")
              );
              return (
                <Pressable
                  key={p.name}
                  style={[styles.preset, on && styles.presetOn]}
                  onPress={() => onAddPreset(p)}
                  disabled={on}
                >
                  <Text style={[styles.presetText, on && styles.presetTextOn]}>{p.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Nome da loja"
            placeholderTextColor={colors.soft}
            style={styles.input}
          />
          <TextInput
            value={storeUrl}
            onChangeText={setStoreUrl}
            placeholder="https://www.loja.com.br"
            placeholderTextColor={colors.soft}
            autoCapitalize="none"
            keyboardType="url"
            style={styles.input}
          />
          <Pressable
            style={[styles.addStoreBtn, adding && { opacity: 0.6 }]}
            onPress={onAddStore}
            disabled={adding}
          >
            <Plus size={14} color={colors.white} />
            <Text style={styles.addStoreText}>Adicionar loja</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.head}>
            <AlertCircle size={13} color={colors.gold} />
            <Text style={styles.headText}>Lacunas no guarda-roupa</Text>
          </View>
          {gaps.length === 0 ? (
            <Text style={styles.empty}>Seu closet cobre bem as bases principais.</Text>
          ) : (
            gaps.map((g) => (
              <View key={g.id} style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.label}>{g.label}</Text>
                  <Text style={styles.meta}>
                    {g.have}/{g.need}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[styles.barFill, { width: `${Math.min(100, (g.have / g.need) * 100)}%` }]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Para você nas suas lojas</Text>
          {favoriteStores.length > 0 && (
            <Pressable onPress={() => void loadProducts()} hitSlop={8} disabled={loadingProducts}>
              <RefreshCw size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {loadingProducts && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.loadingText}>Buscando peças reais nas lojas…</Text>
          </View>
        )}

        {!!loadError && !loadingProducts && <Text style={styles.warn}>{loadError}</Text>}

        {!favoriteStores.length ? (
          <Text style={styles.empty}>
            Adicione lojas favoritas acima para vermos peças com imagem e link de compra.
          </Text>
        ) : !loadingProducts && products.length === 0 ? (
          <Text style={styles.empty}>Nenhuma lacuna urgente — continue aproveitando o armário.</Text>
        ) : (
          !loadingProducts &&
          products.map((item) => {
            const key = `${item.title}|${item.buyUrl}`.toLowerCase();
            const inWish = wishedKeys.has(key);
            const isLive = item.live !== false && Boolean(item.imageUrl);
            return (
              <View key={item.id} style={styles.product}>
                <View style={styles.productTop}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImg} />
                  ) : (
                    <View style={[styles.productImg, styles.productImgEmpty]}>
                      <Text style={styles.productImgEmptyText}>Busca na loja</Text>
                    </View>
                  )}
                  <View style={styles.productBody}>
                    <Text style={styles.brand}>
                      {item.storeName}
                      {isLive ? " · vitrine" : " · busca"}
                      {item.price ? ` · ${item.price}` : ""}
                    </Text>
                    <Text style={styles.name}>{item.title}</Text>
                    <Text style={styles.impact}>+{item.impactPct}% looks</Text>
                    <Text style={styles.reason} numberOfLines={4}>
                      {item.reason}
                    </Text>
                  </View>
                </View>
                <View style={styles.productFooter}>
                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.favBtn, inWish && styles.favBtnOn]}
                      onPress={() => onFavorite(item)}
                      disabled={inWish}
                    >
                      <Heart size={13} color={inWish ? colors.goldDark : colors.ink} />
                      <Text style={[styles.favText, inWish && { color: colors.goldDark }]}>
                        {inWish ? "Favoritada" : "Favoritar"}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.buyBtn} onPress={() => onBuy(item)}>
                      <ExternalLink size={13} color={colors.white} />
                      <Text style={styles.buyText}>{isLive ? "Comprar" : "Abrir busca"}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.note}>
                    <Sparkles size={11} color={colors.gold} />
                    <Text style={styles.noteText}>
                      {isLive
                        ? `Link e imagem de ${item.storeName}.`
                        : `Abre a busca de “${item.query}” em ${item.storeName}.`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {usedFallback ? null : null}

        <Text style={styles.section}>Lista de desejos</Text>
        {wishList.length === 0 ? (
          <Text style={styles.empty}>Nenhum desejo ainda. Favorite uma sugestão.</Text>
        ) : (
          wishList.map((w) => (
            <View key={w.id} style={styles.wishRow}>
              {w.imageUrl ? (
                <Image source={{ uri: w.imageUrl }} style={styles.wishImg} />
              ) : (
                <View style={[styles.wishImg, styles.wishImgEmpty]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{w.label}</Text>
                <Text style={styles.reason}>
                  {w.storeName ? `${w.storeName} · ` : ""}
                  {w.reason}
                </Text>
                {w.buyUrl ? (
                  <Pressable style={styles.wishBuy} onPress={() => onBuyWish(w.buyUrl)}>
                    <ExternalLink size={12} color={colors.goldDark} />
                    <Text style={styles.wishBuyText}>Abrir compra</Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable onPress={() => removeWish(w.id)} accessibilityLabel="Remover desejo">
                <Trash2 size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: 20, lineHeight: 18 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 24 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  headText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, marginBottom: 8 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: 12, lineHeight: 18 },
  storeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  storeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.creamWarm,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  storeChipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  presetLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  preset: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  presetText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  presetTextOn: { color: colors.white },
  input: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 8,
  },
  addStoreBtn: {
    marginTop: 4,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  addStoreText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.white },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  meta: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
  barBg: { height: 4, backgroundColor: colors.creamDark, borderRadius: 999, overflow: "hidden" },
  barFill: { height: 4, backgroundColor: colors.gold },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  section: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.ink },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 16, lineHeight: 19 },
  warn: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.goldDark,
    marginBottom: 14,
    lineHeight: 18,
  },
  loadingBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
    marginBottom: 12,
  },
  loadingText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  product: { backgroundColor: colors.white, borderRadius: 24, overflow: "hidden", marginBottom: 16 },
  productTop: { flexDirection: "row" },
  productImg: {
    width: 132,
    height: 168,
    backgroundColor: colors.creamDark,
  },
  productImgEmpty: { alignItems: "center", justifyContent: "center", padding: 12 },
  productImgEmptyText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textAlign: "center",
  },
  productBody: { flex: 1, padding: 14, paddingBottom: 8 },
  productFooter: { paddingHorizontal: 16, paddingBottom: 16 },
  brand: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  name: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, marginTop: 4 },
  impact: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: colors.successBg,
    color: colors.success,
    fontFamily: fonts.mono,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  reason: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 10 },
  favBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.cream,
  },
  favBtnOn: { borderColor: colors.gold, backgroundColor: colors.creamWarm },
  favText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  buyBtn: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  buyText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.white },
  note: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  wishRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  wishImg: {
    width: 56,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.creamDark,
  },
  wishImgEmpty: { backgroundColor: colors.creamDark },
  wishBuy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  wishBuyText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.goldDark },
  });
}
