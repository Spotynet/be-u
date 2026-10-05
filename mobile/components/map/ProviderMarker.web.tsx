type ProviderMarkerProps = {
  id: number | string;
  name: string;
  profileType: "PROFESSIONAL" | "PLACE";
  latitude: number;
  longitude: number;
  onPress?: () => void;
};

export function ProviderMarker(_props: ProviderMarkerProps) {
  return null;
}
