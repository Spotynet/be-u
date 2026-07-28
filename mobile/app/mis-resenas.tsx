import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
  Image,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useCallback} from "react";
import {useRouter} from "expo-router";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {reviewApi} from "@/lib/api";

function StarRating({rating, size = 14}: {rating: number; size?: number}) {
  return (
    <View style={{flexDirection: "row", gap: 2}}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={size}
          color={i <= rating ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {day: "numeric", month: "short", year: "numeric"});
}

export default function MisResenasScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user} = useAuth();

  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  const profileId = (user as any)?.professional_public_profile_id
    ?? (user as any)?.place_public_profile_id;

  const load = useCallback(async (refresh = false) => {
    if (!profileId) { setIsLoading(false); return; }
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      const res = await reviewApi.getReviews({public_profile: profileId});
      const list = Array.isArray(res.data?.results) ? res.data.results : [];
      setReviews(list);
      if (list.length > 0) {
        const avg = list.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / list.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch {
      setReviews([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({item}: {item: any}) => {
    const authorName = item.from_user_name ?? item.from_user?.full_name ?? "Cliente";
    const authorPhoto = item.from_user?.image ?? null;
    const comment = item.comment ?? item.body ?? "";
    const serviceName = item.service?.name ?? item.service_name ?? "";

    return (
      <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={s.cardHeader}>
          <View style={[s.avatar, {backgroundColor: colors.muted}]}>
            {authorPhoto
              ? <Image source={{uri: authorPhoto}} style={s.avatarImg} />
              : <Ionicons name="person" size={18} color={colors.mutedForeground} />
            }
          </View>
          <View style={s.authorInfo}>
            <Text style={[s.authorName, {color: colors.foreground}]}>{authorName}</Text>
            {item.created_at && (
              <Text style={[s.dateText, {color: colors.mutedForeground}]}>{formatDate(item.created_at)}</Text>
            )}
          </View>
          <StarRating rating={item.rating ?? 0} />
        </View>
        {!!serviceName && (
          <View style={[s.serviceTag, {backgroundColor: colors.muted}]}>
            <Text style={[s.serviceTagText, {color: colors.mutedForeground}]}>{serviceName}</Text>
          </View>
        )}
        {!!comment && (
          <Text style={[s.comment, {color: colors.foreground}]}>{comment}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
      <AppHeader title="Mis Reseñas" showBackButton onBackPress={() => router.back()} />

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          onRefresh={() => load(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.list, reviews.length === 0 && s.emptyContainer]}
          ListHeaderComponent={
            reviews.length > 0 && avgRating !== null ? (
              <View style={[s.summaryCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                <Text style={[s.summaryAvg, {color: colors.foreground}]}>{avgRating.toFixed(1)}</Text>
                <StarRating rating={Math.round(avgRating)} size={20} />
                <Text style={[s.summaryCount, {color: colors.mutedForeground}]}>
                  {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="star-outline" size={48} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, {color: colors.foreground}]}>Sin reseñas aún</Text>
              <Text style={[s.emptyDesc, {color: colors.mutedForeground}]}>
                Las reseñas que recibas de tus clientes aparecerán aquí.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  center: {flex: 1, justifyContent: "center", alignItems: "center"},
  list: {padding: 16, gap: 12},
  emptyContainer: {flex: 1},
  empty: {flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingHorizontal: 32},
  emptyTitle: {fontSize: 17, fontWeight: "700", textAlign: "center"},
  emptyDesc: {fontSize: 14, lineHeight: 20, textAlign: "center"},

  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
    marginBottom: 4,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  summaryAvg: {fontSize: 36, fontWeight: "800"},
  summaryCount: {fontSize: 13, marginTop: 2},

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  cardHeader: {flexDirection: "row", alignItems: "center", gap: 10},
  avatar: {width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", overflow: "hidden"},
  avatarImg: {width: 36, height: 36},
  authorInfo: {flex: 1},
  authorName: {fontSize: 14, fontWeight: "600"},
  dateText: {fontSize: 12, marginTop: 1},
  serviceTag: {alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  serviceTagText: {fontSize: 11, fontWeight: "500"},
  comment: {fontSize: 14, lineHeight: 21},
});
