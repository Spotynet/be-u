/**
 * HeaderCategoryDropdown
 *
 * A compact trigger + anchored floating dropdown for the app header.
 * Uses ref.measure() to position the menu directly below the trigger button
 * so it behaves like a native popover, not a bottom sheet or modal overlay.
 *
 * Exports:
 *   HeaderCategoryDropdown  – composed trigger + menu (primary usage)
 *   CategoryDropdownItem    – single row (if you need to compose manually)
 *   HEADER_CATEGORIES       – sample category data
 */

import React, {
  useRef,
  useState,
  useCallback,
  type ReactElement,
} from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ─── Design tokens ────────────────────────────────────────────────────────────
// Pulled from DarkTheme to keep the dropdown always dark regardless of system
// preference — it lives in the header which is always dark-emerald-surfaced.

const SURFACE   = "#182B20";   // dropdown background
const SURFACE_H = "#1E3428";   // hover / pressed row
const SELECTED  = "#1C3226";   // selected row tint
const BORDER    = "rgba(136,184,154,0.18)";
const GOLD      = "#F6C531";
const GOLD_SOFT = "rgba(246,197,49,0.14)";
const TEXT      = "#FAF8F3";
const TEXT_MUTED = "#7A9E8A";
const CHEVRON   = "#5A7A65";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryOption {
  id: string;
  name: string;
  /** MaterialCommunityIcons icon name */
  icon: string;
  iconFamily?: "material-community" | "ionicons";
  description?: string;
}

export interface HeaderCategoryDropdownProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

interface Anchor {
  x: number;
  y: number;
  width: number;
}

// ─── Icon helper ─────────────────────────────────────────────────────────────

function CatIcon({
  icon,
  iconFamily = "material-community",
  size,
  color,
}: {
  icon: string;
  iconFamily?: "material-community" | "ionicons";
  size: number;
  color: string;
}): ReactElement {
  if (iconFamily === "ionicons") {
    return <Ionicons name={icon as any} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
}

// ─── CategoryDropdownItem ────────────────────────────────────────────────────

export interface CategoryDropdownItemProps {
  item: CategoryOption;
  isSelected: boolean;
  isLast: boolean;
  onPress: () => void;
}

export function CategoryDropdownItem({
  item,
  isSelected,
  isLast,
  onPress,
}: CategoryDropdownItemProps): ReactElement {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.row,
        !isLast && styles.rowBorder,
        isSelected && { backgroundColor: SELECTED },
        pressed && !isSelected && { backgroundColor: SURFACE_H },
      ]}>

      {/* Icon badge */}
      <View
        style={[
          styles.rowIconWrap,
          { backgroundColor: isSelected ? GOLD_SOFT : "rgba(255,255,255,0.05)" },
        ]}>
        <CatIcon
          icon={item.icon}
          iconFamily={item.iconFamily}
          size={17}
          color={isSelected ? GOLD : TEXT_MUTED}
        />
      </View>

      {/* Text */}
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            { color: isSelected ? TEXT : TEXT_MUTED },
            isSelected && styles.rowLabelSelected,
          ]}
          numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.rowDescription} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Checkmark */}
      <View style={styles.rowCheck}>
        {isSelected ? (
          <Ionicons name="checkmark" size={14} color={GOLD} />
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── HeaderCategoryDropdown ───────────────────────────────────────────────────

export function HeaderCategoryDropdown({
  categories,
  selectedCategory,
  onSelectCategory,
}: HeaderCategoryDropdownProps): ReactElement {
  const triggerRef  = useRef<View>(null);
  const [open, setOpen]     = useState(false);
  const [anchor, setAnchor] = useState<Anchor>({ x: 0, y: 0, width: 0 });
  const anim = useRef(new Animated.Value(0)).current;

  const selected = categories.find((c) => c.id === selectedCategory);

  // ── Animation helpers ──────────────────────────────────────────────────────

  const animateIn = useCallback(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 320,
      friction: 26,
    }).start();
  }, [anim]);

  const animateOut = useCallback((onDone: () => void) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 130,
      useNativeDriver: true,
    }).start(onDone);
  }, [anim]);

  // ── Open / close ──────────────────────────────────────────────────────────

  const openMenu = useCallback(() => {
    triggerRef.current?.measure((_fx, _fy, width, height, pageX, pageY) => {
      setAnchor({ x: pageX, y: pageY + height + 6, width });
      setOpen(true);
      animateIn();
    });
  }, [animateIn]);

  const closeMenu = useCallback(() => {
    animateOut(() => setOpen(false));
  }, [animateOut]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelectCategory(id);
      closeMenu();
    },
    [onSelectCategory, closeMenu]
  );

  // ── Derived animation values ───────────────────────────────────────────────

  const menuOpacity = anim;
  const menuScale   = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.93, 1],
  });
  const menuTranslateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-6, 0],
  });
  const chevronRotate = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger ─────────────────────────────────────────────────────── */}
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={open ? closeMenu : openMenu}
          style={({ pressed }) => [
            styles.trigger,
            open      && styles.triggerOpen,
            pressed   && styles.triggerPressed,
          ]}
          hitSlop={6}>

          {/* Category icon */}
          {selected ? (
            <CatIcon
              icon={selected.icon}
              iconFamily={selected.iconFamily}
              size={16}
              color={open ? GOLD : TEXT}
            />
          ) : null}

          {/* Label */}
          <Text
            style={[styles.triggerLabel, open && { color: GOLD }]}
            numberOfLines={1}>
            {selected?.name ?? "Categoría"}
          </Text>

          {/* Chevron — rotates 180° when open */}
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons
              name="chevron-down"
              size={13}
              color={open ? GOLD : CHEVRON}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* ── Floating dropdown ────────────────────────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeMenu}>

        {/* Scrim — invisible, only captures outside taps */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />

        <Animated.View
          style={[
            styles.menu,
            {
              top:  anchor.y,
              left: centeredLeft(anchor.x, anchor.width),
              width: MENU_W,
              opacity:   menuOpacity,
              transform: [
                { translateY: menuTranslateY },
                { scaleX: menuScale },
                { scaleY: menuScale },
              ],
            },
          ]}>

          {categories.map((item, index) => (
            <CategoryDropdownItem
              key={item.id}
              item={item}
              isSelected={selectedCategory === item.id}
              isLast={index === categories.length - 1}
              onPress={() => handleSelect(item.id)}
            />
          ))}
        </Animated.View>
      </Modal>
    </>
  );
}

// ─── Constants & helpers ──────────────────────────────────────────────────────

const MENU_W  = 220;
const ROW_H   = 52;
const RADIUS  = 14;
const SCREEN_W = Dimensions.get("window").width;
const SCREEN_EDGE_PAD = 10;

/** Centers the menu on the trigger, clamped within screen bounds. */
function centeredLeft(triggerX: number, triggerWidth: number): number {
  const idealLeft = triggerX + triggerWidth / 2 - MENU_W / 2;
  const minLeft   = SCREEN_EDGE_PAD;
  const maxLeft   = SCREEN_W - MENU_W - SCREEN_EDGE_PAD;
  return Math.max(minLeft, Math.min(idealLeft, maxLeft));
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(136,184,154,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  triggerOpen: {
    borderColor: `rgba(246,197,49,0.35)`,
    backgroundColor: "rgba(246,197,49,0.07)",
  },
  triggerPressed: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  triggerLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
    color: TEXT,
    flexShrink: 1,
  },

  // Floating menu
  menu: {
    position: "absolute",
    backgroundColor: SURFACE,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    // Elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 24,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: ROW_H,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 11,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.05,
  },
  rowLabelSelected: {
    fontWeight: "700",
  },
  rowDescription: {
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.02,
  },
  rowCheck: {
    width: 16,
    alignItems: "center",
    flexShrink: 0,
  },
});

// ─── Sample data ──────────────────────────────────────────────────────────────

export const HEADER_CATEGORIES: CategoryOption[] = [
  {
    id: "belleza",
    name: "Belleza",
    icon: "spa-outline",
    iconFamily: "material-community",
    description: "Cabello, maquillaje, uñas",
  },
  {
    id: "bienestar",
    name: "Bienestar",
    icon: "meditation",
    iconFamily: "material-community",
    description: "Yoga, masajes, nutrición",
  },
  {
    id: "mascotas",
    name: "Mascotas",
    icon: "paw",
    iconFamily: "material-community",
    description: "Estética, cuidadores, paseos",
  },
];
