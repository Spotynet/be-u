type SafeMarkerProps = {
  coordinate: {latitude: number; longitude: number};
  draggable?: boolean;
  onDragEnd?: (event: any) => void;
  onPress?: () => void;
  children?: React.ReactNode;
  tracksViewChanges?: boolean;
};

export function SafeMarker(_props: SafeMarkerProps) {
  return null;
}

export function Callout({children}: {children?: React.ReactNode}) {
  return <>{children ?? null}</>;
}

export const Marker = SafeMarker;
