import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useCallback} from "react";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export interface PhoneValue {
  dialCode: string;
  number: string;
  /** Combined E.164-ish string, e.g. "+52 5512345678" */
  full: string;
}

interface Country {
  code: string;  // ISO 3166-1 alpha-2
  flag: string;
  name: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  {code: "MX", flag: "🇲🇽", name: "México",          dialCode: "+52"},
  {code: "US", flag: "🇺🇸", name: "Estados Unidos",   dialCode: "+1"},
  {code: "CA", flag: "🇨🇦", name: "Canadá",           dialCode: "+1"},
  {code: "ES", flag: "🇪🇸", name: "España",           dialCode: "+34"},
  {code: "AR", flag: "🇦🇷", name: "Argentina",        dialCode: "+54"},
  {code: "CO", flag: "🇨🇴", name: "Colombia",         dialCode: "+57"},
  {code: "CL", flag: "🇨🇱", name: "Chile",            dialCode: "+56"},
  {code: "PE", flag: "🇵🇪", name: "Perú",             dialCode: "+51"},
  {code: "VE", flag: "🇻🇪", name: "Venezuela",        dialCode: "+58"},
  {code: "EC", flag: "🇪🇨", name: "Ecuador",          dialCode: "+593"},
  {code: "GT", flag: "🇬🇹", name: "Guatemala",        dialCode: "+502"},
  {code: "CU", flag: "🇨🇺", name: "Cuba",             dialCode: "+53"},
  {code: "BO", flag: "🇧🇴", name: "Bolivia",          dialCode: "+591"},
  {code: "DO", flag: "🇩🇴", name: "Rep. Dominicana",  dialCode: "+1"},
  {code: "HN", flag: "🇭🇳", name: "Honduras",         dialCode: "+504"},
  {code: "PY", flag: "🇵🇾", name: "Paraguay",         dialCode: "+595"},
  {code: "SV", flag: "🇸🇻", name: "El Salvador",      dialCode: "+503"},
  {code: "NI", flag: "🇳🇮", name: "Nicaragua",        dialCode: "+505"},
  {code: "CR", flag: "🇨🇷", name: "Costa Rica",       dialCode: "+506"},
  {code: "PA", flag: "🇵🇦", name: "Panamá",           dialCode: "+507"},
  {code: "UY", flag: "🇺🇾", name: "Uruguay",          dialCode: "+598"},
  {code: "BR", flag: "🇧🇷", name: "Brasil",           dialCode: "+55"},
  {code: "GB", flag: "🇬🇧", name: "Reino Unido",      dialCode: "+44"},
  {code: "FR", flag: "🇫🇷", name: "Francia",          dialCode: "+33"},
  {code: "DE", flag: "🇩🇪", name: "Alemania",         dialCode: "+49"},
  {code: "IT", flag: "🇮🇹", name: "Italia",           dialCode: "+39"},
  {code: "PT", flag: "🇵🇹", name: "Portugal",         dialCode: "+351"},
  {code: "JP", flag: "🇯🇵", name: "Japón",            dialCode: "+81"},
  {code: "CN", flag: "🇨🇳", name: "China",            dialCode: "+86"},
  {code: "IN", flag: "🇮🇳", name: "India",            dialCode: "+91"},
  {code: "AU", flag: "🇦🇺", name: "Australia",        dialCode: "+61"},
];

// Digits only (strips spaces, dashes, parentheses)
const PHONE_DIGITS_RE = /[^0-9]/g;
// Valid: 7–15 digits
const VALID_PHONE_RE = /^[0-9]{7,15}$/;

function digitsOnly(value: string): string {
  return value.replace(PHONE_DIGITS_RE, "");
}

function formatDisplay(digits: string): string {
  // Group as: XXX XXX XXXX (up to 10) or plain for longer
  if (digits.length <= 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{1,4})/, "$1 $2 $3")
                 .replace(/(\d{3})(\d{1,3})$/, "$1 $2")
                 .trim();
  }
  return digits;
}

/**
 * Internal storage format: "CA|+1 5551234567"
 * The ISO code prefix disambiguates countries that share a dial code (e.g. US/CA both +1).
 * Legacy format "+52 5512345678" (no prefix) is also accepted for backward compat.
 */
export function parseStoredPhone(
  stored: string,
  fallbackCode = "MX",
): {isoCode: string; dialCode: string; number: string} {
  if (!stored) {
    const fb = COUNTRIES.find(c => c.code === fallbackCode) ?? COUNTRIES[0];
    return {isoCode: fb.code, dialCode: fb.dialCode, number: ""};
  }
  // New format: "CA|+1 5551234567"
  const prefixed = stored.match(/^([A-Z]{2})\|(\+\d{1,4})\s*(.*)$/);
  if (prefixed) {
    return {isoCode: prefixed[1], dialCode: prefixed[2], number: digitsOnly(prefixed[3])};
  }
  // Legacy format: "+52 5512345678"
  const legacy = stored.match(/^(\+\d{1,4})\s*(.*)$/);
  if (legacy) {
    const country = COUNTRIES.find(c => c.dialCode === legacy[1]) ?? COUNTRIES[0];
    return {isoCode: country.code, dialCode: legacy[1], number: digitsOnly(legacy[2])};
  }
  return {isoCode: fallbackCode, dialCode: COUNTRIES[0].dialCode, number: digitsOnly(stored)};
}

/** Strip the ISO prefix so the backend receives a plain "+52 5512345678" string. */
export function toE164(stored: string): string {
  return stored.replace(/^[A-Z]{2}\|/, "");
}

interface PhoneFieldProps {
  /** Internal value: "CA|+1 5551234567" or legacy "+52 5551234567" */
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneField({value, onChange, error}: PhoneFieldProps) {
  const {colors} = useThemeVariant();

  const parsed = parseStoredPhone(value);
  // Resolve by ISO code first — avoids US/CA (and similar) ambiguity
  const initialCountry =
    COUNTRIES.find(c => c.code === parsed.isoCode) ??
    COUNTRIES.find(c => c.dialCode === parsed.dialCode) ??
    COUNTRIES[0];

  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [digits, setDigits] = useState(parsed.number);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = VALID_PHONE_RE.test(digits) || digits === "";
  const showError = touched && digits !== "" && !isValid;

  const commit = useCallback(
    (country: Country, rawDigits: string) => {
      const d = digitsOnly(rawDigits);
      // Store with ISO prefix so the country is unambiguous on reload
      onChange(d ? `${country.code}|${country.dialCode} ${d}` : "");
    },
    [onChange]
  );

  const handleDigitChange = (text: string) => {
    const d = digitsOnly(text);
    if (d.length > 15) return;
    setDigits(d);
    commit(selectedCountry, d);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setPickerOpen(false);
    setSearch("");
    commit(country, digits);
  };

  const filtered = search.trim()
    ? COUNTRIES.filter(
        c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const borderColor = showError
    ? colors.error
    : pickerOpen
    ? colors.accent
    : colors.border;

  return (
    <View>
      {/* Main row */}
      <View
        style={[
          s.row,
          {
            backgroundColor: colors.card,
            borderColor,
            shadowColor: colors.cardShadow,
          },
        ]}>
        {/* Prefix picker trigger */}
        <TouchableOpacity
          style={[s.prefix, {borderRightColor: colors.border}]}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}>
          <Text style={s.flag}>{selectedCountry.flag}</Text>
          <Text style={[s.dialCode, {color: colors.foreground}]}>{selectedCountry.dialCode}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.mutedForeground} style={{marginLeft: 2}} />
        </TouchableOpacity>

        {/* Number input */}
        <TextInput
          style={[s.input, {color: colors.foreground, flex: 1}]}
          value={formatDisplay(digits)}
          onChangeText={handleDigitChange}
          onBlur={() => setTouched(true)}
          placeholder="000 000 0000"
          placeholderTextColor={colors.placeholderText}
          keyboardType="phone-pad"
          maxLength={19}
        />

        {/* Status icon */}
        {digits.length > 0 && (
          <View style={s.statusIcon}>
            {isValid ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            ) : (
              <Ionicons name="alert-circle" size={18} color={colors.error} />
            )}
          </View>
        )}
      </View>

      {/* Validation hint */}
      {showError && (
        <Text style={[s.hint, {color: colors.error}]}>
          Número inválido. Ingresa entre 7 y 15 dígitos.
        </Text>
      )}

      {/* Country picker modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setPickerOpen(false)} />
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          {/* Handle */}
          <View style={[s.handle, {backgroundColor: colors.border}]} />

          {/* Header */}
          <View style={s.sheetHeader}>
            <Text style={[s.sheetTitle, {color: colors.foreground}]}>Código de país</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[s.searchRow, {backgroundColor: colors.inputBg, borderColor: colors.border}]}>
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[s.searchInput, {color: colors.foreground}]}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar país..."
              placeholderTextColor={colors.placeholderText}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={[s.separator, {backgroundColor: colors.divider}]} />}
            renderItem={({item}) => {
              const active = item.code === selectedCountry.code;
              return (
                <TouchableOpacity
                  style={[s.countryRow, active && {backgroundColor: colors.chipBg}]}
                  onPress={() => handleCountrySelect(item)}
                  activeOpacity={0.7}>
                  <Text style={s.countryFlag}>{item.flag}</Text>
                  <Text style={[s.countryName, {color: colors.foreground}]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[s.countryDial, {color: colors.mutedForeground}]}>{item.dialCode}</Text>
                  {active && <Ionicons name="checkmark" size={16} color={colors.accent} style={{marginLeft: 4}} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4},
      android: {elevation: 2},
    }),
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    gap: 4,
  },
  flag: {fontSize: 18, lineHeight: 22},
  dialCode: {fontSize: 14, fontWeight: "600"},
  input: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  statusIcon: {paddingRight: 12},
  hint: {fontSize: 12, marginTop: 5, marginLeft: 2},

  // Modal
  backdrop: {flex: 1, backgroundColor: "rgba(0,0,0,0.45)"},
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    paddingBottom: 32,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.12, shadowRadius: 12},
      android: {elevation: 16},
    }),
  },
  handle: {width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4},
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetTitle: {fontSize: 17, fontWeight: "700"},
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {flex: 1, paddingVertical: 10, fontSize: 14},
  separator: {height: StyleSheet.hairlineWidth, marginHorizontal: 16},
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 12,
  },
  countryFlag: {fontSize: 22, width: 28, textAlign: "center"},
  countryName: {flex: 1, fontSize: 15},
  countryDial: {fontSize: 14, fontWeight: "500"},
});
