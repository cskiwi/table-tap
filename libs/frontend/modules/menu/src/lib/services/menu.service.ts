import { Injectable, computed, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import {
  MenuItem,
  MenuCategory,
  MenuFilters,
  MenuSortOptions,
  PaginationOptions,
  MenuDisplayOptions,
  MenuState,
  MenuSearchResult,
  MenuItemStatus,
  MenuCustomization,
} from '../types/menu.types';
import { GET_PRODUCTS, GET_PRODUCT } from '../graphql/menu.queries';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  // Signals for reactive state management
  private readonly _categories = signal<MenuCategory[]>([]);
  private readonly _menuItems = signal<MenuItem[]>([]);
  private readonly _selectedCategory = signal<MenuCategory | undefined>(undefined);
  private readonly _selectedMenuItem = signal<MenuItem | undefined>(undefined);
  private readonly _filters = signal<MenuFilters>({});
  private readonly _sortOptions = signal<MenuSortOptions>({
    field: 'sortOrder',
    direction: 'asc',
  });
  private readonly _pagination = signal<PaginationOptions>({
    page: 1,
    limit: 20,
  });
  private readonly _displayOptions = signal<MenuDisplayOptions>({
    view: 'grid',
    showImages: true,
    showNutrition: false,
    showAllergens: false,
  });
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | undefined>(undefined);

  // Public computed signals
  readonly categories = this._categories.asReadonly();
  readonly menuItems = this._menuItems.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();
  readonly selectedMenuItem = this._selectedMenuItem.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly sortOptions = this._sortOptions.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly displayOptions = this._displayOptions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed filtered and sorted items
  readonly filteredItems = computed(() => {
    let items = this.menuItems();
    const filters = this.filters();
    const sort = this.sortOptions();

    // Apply filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(searchTerm) || item.description?.toLowerCase().includes(searchTerm));
    }

    if (filters.categoryId) {
      items = items.filter((item) => item.categoryId === filters.categoryId);
    }

    if (filters.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters.minPrice !== undefined) {
      items = items.filter((item) => item.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      items = items.filter((item) => item.price <= filters.maxPrice!);
    }

    if (filters.allergens && filters.allergens.length > 0) {
      items = items.filter((item) => !item.allergens || !filters.allergens!.some((allergen) => item.allergens!.includes(allergen)));
    }

    if (filters.preparationTime !== undefined) {
      items = items.filter((item) => !item.preparationTime || item.preparationTime <= filters.preparationTime!);
    }

    // Apply sorting
    items.sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return items;
  });

  // Computed grouped items by category
  readonly itemsByCategory = computed(() => {
    const items = this.filteredItems();
    const categories = this.categories();
    return categories.map((category) => ({
      ...category,
      menuItems: items.filter((item) => item.categoryId === category.id),
    }));
  });

  // Shopping cart for customizations
  private readonly _cart = signal<MenuCustomization[]>([]);
  readonly cart = this._cart.asReadonly();

  constructor(private apollo: Apollo) {
    // Load display preferences from localStorage
    this.loadDisplayPreferences();
  }

  // Load menu categories
  loadCategories(cafeId: string): Observable<MenuCategory[]> {
    this._loading.set(true);
    this._error.set(undefined);

    // Use dynamic products query to get distinct categories
    return this.apollo
      .query<{ products: MenuItem[] }>({
        query: GET_PRODUCTS,
        variables: {
          args: {
            where: [{ cafeId: { eq: cafeId } }],
            order: { category: 'ASC' },
          },
        },
        errorPolicy: 'all',
      })
      .pipe(
        map((result) => {
          const products = result.data?.products || [];
          // Extract unique categories from products
          const categoryMap = new Map<string, MenuCategory>();
          products.forEach((product) => {
            if (product.category && !categoryMap.has(product.category.id)) {
              categoryMap.set(product.category.id, product.category);
            }
          });
          const categories = Array.from(categoryMap.values());
          this._categories.set(categories);
          this._loading.set(false);
          return categories;
        }),
        catchError((error) => {
          this._error.set(error.message);
          this._loading.set(false);
          throw error;
        }),
      );
  }

  // Load menu items
  loadMenuItems(cafeId: string, categoryId?: string): Observable<MenuItem[]> {
    this._loading.set(true);
    this._error.set(undefined);

    const whereConditions: any[] = [{ cafeId: { eq: cafeId } }, { isAvailable: { eq: true } }];

    if (categoryId) {
      whereConditions.push({ category: { eq: categoryId } });
    }

    return this.apollo
      .query<{ products: MenuItem[] }>({
        query: GET_PRODUCTS,
        variables: {
          args: {
            where: whereConditions,
            order: { sortOrder: 'ASC', name: 'ASC' },
          },
        },
        errorPolicy: 'all',
      })
      .pipe(
        map((result) => {
          const items = result.data?.products || [];
          this._menuItems.set(items);
          this._loading.set(false);
          return items;
        }),
        catchError((error) => {
          this._error.set(error.message);
          this._loading.set(false);
          throw error;
        }),
      );
  }

  // Load complete menu with categories and items
  loadCompleteMenu(cafeId: string): Observable<MenuCategory[]> {
    this._loading.set(true);
    this._error.set(undefined);

    return this.apollo
      .query<{ products: MenuItem[] }>({
        query: GET_PRODUCTS,
        variables: {
          args: {
            where: [{ cafeId: { eq: cafeId } }],
            order: { category: 'ASC', sortOrder: 'ASC', name: 'ASC' },
          },
        },
        errorPolicy: 'all',
      })
      .pipe(
        map((result) => {
          const products = result.data?.products || [];

          // Group products by category
          const categoryMap = new Map<string, MenuCategory>();
          products.forEach((product) => {
            if (product.category) {
              if (!categoryMap.has(product.category.id)) {
                categoryMap.set(product.category.id, {
                  ...product.category,
                  menuItems: [],
                });
              }
              categoryMap.get(product.category.id)!.menuItems!.push(product);
            }
          });

          const categories = Array.from(categoryMap.values());
          this._categories.set(categories);
          this._menuItems.set(products);
          this._loading.set(false);

          return categories;
        }),
        catchError((error) => {
          this._error.set(error.message);
          this._loading.set(false);
          throw error;
        }),
      );
  }

  // Search menu items
  searchItems(cafeId: string, query: string): Observable<MenuItem[]> {
    if (!query.trim()) {
      return this.loadMenuItems(cafeId);
    }

    this._loading.set(true);
    this._error.set(undefined);

    const searchTerm = query.trim();
    const pagination = this.pagination();

    return this.apollo
      .query<{ products: MenuItem[] }>({
        query: GET_PRODUCTS,
        variables: {
          args: {
            where: [
              { cafeId: { eq: cafeId } },
              {
                or: [{ name: { contains: searchTerm } }, { description: { contains: searchTerm } }, { tags: { contains: searchTerm } }],
              },
            ],
            order: { sortOrder: 'ASC', name: 'ASC' },
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
          },
        },
        errorPolicy: 'all',
      })
      .pipe(
        map((result) => {
          const items = result.data?.products || [];
          this._menuItems.set(items);
          this._loading.set(false);
          return items;
        }),
        catchError((error) => {
          this._error.set(error.message);
          this._loading.set(false);
          throw error;
        }),
      );
  }

  // Get menu item details
  getMenuItem(id: string): Observable<MenuItem> {
    this._loading.set(true);
    this._error.set(undefined);

    return this.apollo
      .query<{ product: MenuItem }>({
        query: GET_PRODUCT,
        variables: { id },
        errorPolicy: 'all',
      })
      .pipe(
        map((result) => {
          const item = result.data?.product;
          if (item) {
            this._selectedMenuItem.set(item);
          }
          this._loading.set(false);
          return item;
        }),
        catchError((error) => {
          this._error.set(error.message);
          this._loading.set(false);
          throw error;
        }),
      );
  }

  // Update filters
  updateFilters(filters: Partial<MenuFilters>): void {
    this._filters.update((current) => ({ ...current, ...filters }));
  }

  // Clear filters
  clearFilters(): void {
    this._filters.set({});
  }

  // Update sort options
  updateSortOptions(sortOptions: Partial<MenuSortOptions>): void {
    this._sortOptions.update((current) => ({ ...current, ...sortOptions }));
  }

  // Update pagination
  updatePagination(pagination: Partial<PaginationOptions>): void {
    this._pagination.update((current) => ({ ...current, ...pagination }));
  }

  // Update display options
  updateDisplayOptions(displayOptions: Partial<MenuDisplayOptions>): void {
    this._displayOptions.update((current) => ({ ...current, ...displayOptions }));
    this.saveDisplayPreferences();
  }

  // Select category
  selectCategory(category: MenuCategory | undefined): void {
    this._selectedCategory.set(category);
    this.updateFilters({ categoryId: category?.id });
  }

  // Select menu item
  selectMenuItem(item: MenuItem | undefined): void {
    this._selectedMenuItem.set(item);
  }

  // Cart management
  addToCart(customization: MenuCustomization): void {
    this._cart.update((cart) => {
      const existingIndex = cart.findIndex(
        (item) => item.itemId === customization.itemId && JSON.stringify(item.customizations) === JSON.stringify(customization.customizations),
      );

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += customization.quantity;
        return [...cart];
      } else {
        return [...cart, customization];
      }
    });
  }

  removeFromCart(index: number): void {
    this._cart.update((cart) => cart.filter((_, i) => i !== index));
  }

  updateCartQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(index);
      return;
    }

    this._cart.update((cart) => {
      cart[index].quantity = quantity;
      return [...cart];
    });
  }

  clearCart(): void {
    this._cart.set([]);
  }

  // Utility methods
  private saveDisplayPreferences(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('menu-display-options', JSON.stringify(this.displayOptions()));
    }
  }

  private loadDisplayPreferences(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('menu-display-options');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this._displayOptions.set(parsed);
        } catch (error) {
          console.warn('Failed to load display preferences:', error);
        }
      }
    }
  }

  // Reset state
  reset(): void {
    this._categories.set([]);
    this._menuItems.set([]);
    this._selectedCategory.set(undefined);
    this._selectedMenuItem.set(undefined);
    this._filters.set({});
    this._pagination.set({ page: 1, limit: 20 });
    this._loading.set(false);
    this._error.set(undefined);
  }
}
