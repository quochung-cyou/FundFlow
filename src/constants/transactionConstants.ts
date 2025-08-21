/**
 * Transaction-related constants
 */

// Preset amounts for quick selection
export const PRESET_AMOUNTS = [
  10000,
  50000,
  100000,
  200000,
  500000,
  1000000,
  2000000,
  5000000,
] as const;

// Common transaction descriptions
export const COMMON_DESCRIPTIONS = [
  "Trả nợ",
  "Chia tiền ăn trưa",
  "Chia tiền ăn sáng", 
  "Chia tiền ăn tối",
  "Tiền xăng xe",
  "Tiền taxi/grab",
  "Tiền cà phê",
  "Tiền đi chợ",
  "Tiền điện nước",
  "Tiền thuê nhà",
  "Tiền mua sắm",
  "Tiền giải trí",
] as const;

// Zero addition options
export const ZERO_ADDITIONS = [
  { count: 3, label: "+ 000" },
  { count: 4, label: "+ 0000" },
  { count: 5, label: "+ 00000" },
] as const;

// Validation timing constants
export const VALIDATION_DEBOUNCE_MS = 500;
export const AI_VALIDATION_DELAY_MS = 300;

// Default form values
export const DEFAULT_FORM_VALUES = {
  description: "",
  amount: "",
  aiPrompt: "",
  splits: [],
} as const;
