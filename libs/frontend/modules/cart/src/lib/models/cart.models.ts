export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  basePrice: number;
  quantity: number;
  customizations: CartItemCustomization[]
  totalPrice: number;
  imageUrl?: string;
  category: string;
  allergens?: string[]
  nutritionalInfo?: NutritionalInfo;
  notes?: string;
  addedAt: Date;
}

export interface CartItemCustomization {
  id: string;
  name: string;
  type: CustomizationType;
  options: CustomizationOption[]
  required: boolean;
  maxSelections?: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
  selected: boolean;
  available: boolean;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface Cart {
  id: string;
  items: CartItem[]
  subtotal: number;
  tax: number;
  fees: CartFee[]
  discount: number;
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CartFee {
  id: string;
  name: string;
  amount: number;
  type: 'percentage' | 'fixed';
  description?: string;
}

export interface CartValidationError {
  field: string;
  message: string;
  code: string;
}

export interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  errors: CartValidationError[]
  lastUpdated: Date | null;
}

export interface CartConfig {
  maxItems: number;
  maxQuantityPerItem: number;
  taxRate: number;
  serviceFeeRate: number;
  deliveryFee: number;
  minimumOrderAmount: number;
  cartExpirationHours: number;
}

export interface AddToCartRequest {
  menuItemId: string;
  quantity: number;
  customizations: SelectedCustomization[]
  notes?: string;
}

export interface SelectedCustomization {
  customizationId: string;
  selectedOptions: string[]
}

export interface UpdateCartItemRequest {
  cartItemId: string;
  quantity?: number;
  customizations?: SelectedCustomization[]
  notes?: string;
}

export enum CustomizationType {
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  SIZE = 'SIZE',
  ADDON = 'ADDON',
  MODIFIER = 'MODIFIER',
}

export enum CartAction {
  ADD_ITEM = 'ADD_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  CLEAR_CART = 'CLEAR_CART',
  APPLY_DISCOUNT = 'APPLY_DISCOUNT',
  UPDATE_QUANTITY = 'UPDATE_QUANTITY',
}