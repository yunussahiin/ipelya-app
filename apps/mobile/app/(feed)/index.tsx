import { PlaceholderScreen } from "@/components/layout/PlaceholderScreen";

export const options = {
  title: "Feed",
  headerShown: true
};

export default function FeedScreen() {
  return (
    <PlaceholderScreen
      title="Gerçek Feed"
      description="Gerçek kullanıcı içeriği, React Query ile Supabase'den çekilecek."
    />
  );
}
