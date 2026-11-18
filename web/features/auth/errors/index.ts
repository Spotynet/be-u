export {AUTH_ERROR_CATALOG, getCatalogEntry} from "./authErrorCatalog";
export type {AuthErrorCode} from "./authErrorCatalog";
export {buildAppError, formatAuthMessage} from "./formatMessage";
export {parseApiError} from "./parseApiError";
export {
  validateEmail,
  validateRole,
  validateFirstName,
  validateLastName,
  validateUsername,
  validateTerms,
  validateCode,
  validatePlaceName,
  validateCategory,
  validateSubcategory,
  validateCategories,
  validateSubcategories,
  validateSelectionMin,
  validateSelectionMax,
  validateOptionalAddressPart,
  validateCountry,
  validatePhone,
  normalizeUsername,
} from "./validators";
export {useFormErrors, applyValidatorCode} from "./useFormErrors";
export type {UseFormErrorsResult} from "./useFormErrors";
export {useAuthToast} from "./useAuthToast";
export type {AuthToastItem} from "./useAuthToast";
export {useOnlineStatus} from "./useOnlineStatus";
export {FIELD_STEP_MAP, resolveStepForField} from "./fieldStepMap";
export type {
  AppError,
  AuthErrorSeverity,
  AuthErrorScope,
  AuthErrorAction,
  AuthFieldName,
  AuthErrorCatalogEntry,
} from "./types";
