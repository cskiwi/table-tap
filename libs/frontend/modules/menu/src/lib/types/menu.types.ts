export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: MenuItemStatus;
  preparationTime?: number;
  imageUrl?: string;
  nutritionalInfo?: Record<string, any>;
  allergens?: string[]
  sortOrder: number;
  cafeId: string;
  categoryId?: string;
  category?: MenuCategory;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  cafeId: string;
  menuItems?: MenuItem[]
}

export enum MenuItemStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
  SEASONAL = 'SEASONAL',
}

export interface MenuFilters {
  search?: string;
  categoryId?: string;
  status?: MenuItemStatus;
  minPrice?: number;
  maxPrice?: number;
  allergens?: string[]
  preparationTime?: number;
}

export interface MenuSortOptions {
  field: 'name' | 'price' | 'preparationTime' | 'sortOrder';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface MenuDisplayOptions {
  view: 'grid' | 'list';
  showImages: boolean;
  showNutrition: boolean;
  showAllergens: boolean;
}

export interface MenuSearchResult {
  items: MenuItem[]
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MenuState {
  categories: MenuCategory[]
  menuItems: MenuItem[]
  selectedCategory?: MenuCategory;
  selectedMenuItem?: MenuItem;
  filters: MenuFilters;
  sortOptions: MenuSortOptions;
  pagination: PaginationOptions;
  displayOptions: MenuDisplayOptions;
  loading: boolean;
  error?: string;
}

export interface MenuCustomization {
  itemId: string;
  notes?: string;
  customizations?: Record<string, any>;
  quantity: number;
}

export interface MenuItemDetailOptions {
  showFullDescription: boolean;
  showNutrition: boolean;
  showAllergens: boolean;
  showCustomizations: boolean;
}