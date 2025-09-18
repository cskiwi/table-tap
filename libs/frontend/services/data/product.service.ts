import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, distinctUntilChanged, shareReplay, switchMap } from 'rxjs/operators';
import { gql } from 'apollo-angular';

import { BaseService } from '../core/base.service';
import {
  Product,
  ProductCategory,
  ApiResponse,
  PaginationOptions,
  InventoryItem
} from '../core/types';

// GraphQL Queries
const GET_PRODUCTS = gql`
  query GetProducts($cafeId: ID!, $categoryId: ID, $page: Int, $limit: Int, $search: String, $available: Boolean) {
    products(cafeId: $cafeId, categoryId: $categoryId, page: $page, limit: $limit, search: $search, available: $available) {
      data {
        id
        name
        description
        price
        categoryId
        imageUrl
        isAvailable
        preparationTime
        allergens
        nutritionalInfo {
          calories
          protein
          carbohydrates
          fat
          fiber
          sugar
          sodium
        }
        customizationOptions {
          id
          name
          type
          required
          options {
            id
            name
            additionalPrice
          }
        }
        ingredients {
          id
          name
          isAllergen
        }
        isVegan
        isGlutenFree
        isSpicy
        createdAt
        updatedAt
      }
      metadata {
        total
        page
        limit
        hasNext
        hasPrevious
      }
    }
  }
`;

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      categoryId
      category {
        id
        name
        description
      }
      imageUrl
      isAvailable
      preparationTime
      allergens
      nutritionalInfo {
        calories
        protein
        carbohydrates
        fat
        fiber
        sugar
        sodium
      }
      customizationOptions {
        id
        name
        type
        required
        options {
          id
          name
          additionalPrice
        }
      }
      ingredients {
        id
        name
        isAllergen
        stockLevel
        unit
      }
      isVegan
      isGlutenFree
      isSpicy
      createdAt
      updatedAt
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories($cafeId: ID!) {
    productCategories(cafeId: $cafeId) {
      id
      name
      description
      parentId
      sortOrder
      isActive
      createdAt
      updatedAt
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      price
      categoryId
      isAvailable
      preparationTime
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      price
      categoryId
      isAvailable
      preparationTime
      updatedAt
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      success
      message
    }
  }
`;

const UPDATE_PRODUCT_AVAILABILITY = gql`
  mutation UpdateProductAvailability($id: ID!, $isAvailable: Boolean!) {
    updateProductAvailability(id: $id, isAvailable: $isAvailable) {
      id
      isAvailable
      updatedAt
    }
  }
`;

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  available?: boolean;
  priceMin?: number;
  priceMax?: number;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  allergens?: string[];
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  preparationTime: number;
  allergens?: string[];
  nutritionalInfo?: any;
  customizationOptions?: any[];
  ingredients?: string[];
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  cafeId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  allergens?: string[];
  nutritionalInfo?: any;
  customizationOptions?: any[];
  ingredients?: string[];
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
}

/**
 * Service for managing restaurant products and menu items
 * Handles product CRUD operations, categorization, and availability management
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseService {
  // State management
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private categoriesSubject = new BehaviorSubject<ProductCategory[]>([]);
  private selectedCategorySubject = new BehaviorSubject<string | null>(null);
  private searchTermSubject = new BehaviorSubject<string>('');
  private filtersSubject = new BehaviorSubject<ProductFilters>({});

  // Observables
  public readonly products$ = this.productsSubject.asObservable();
  public readonly categories$ = this.categoriesSubject.asObservable();
  public readonly selectedCategory$ = this.selectedCategorySubject.asObservable();
  public readonly searchTerm$ = this.searchTermSubject.asObservable();
  public readonly filters$ = this.filtersSubject.asObservable();

  // Filtered products based on category, search, and filters
  public readonly filteredProducts$ = combineLatest([
    this.products$,
    this.selectedCategory$,
    this.searchTerm$,
    this.filters$
  ]).pipe(
    map(([products, categoryId, searchTerm, filters]) =>
      this.filterProducts(products, categoryId, searchTerm, filters)
    ),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );

  // Available products only
  public readonly availableProducts$ = this.products$.pipe(
    map(products => products.filter(product => product.isAvailable)),
    shareReplay(1)
  );

  // Featured/popular products
  public readonly featuredProducts$ = this.products$.pipe(
    map(products => products.filter(product => product.isAvailable).slice(0, 8)),
    shareReplay(1)
  );

  // Loading states
  public readonly isLoadingProducts$ = this.getLoading('products');
  public readonly isLoadingCategories$ = this.getLoading('categories');
  public readonly isSavingProduct$ = this.getLoading('saveProduct');

  constructor() {
    super();
  }

  /**
   * Get all products for a cafe with optional filtering
   */
  getProducts(
    cafeId: string,
    options?: PaginationOptions & ProductFilters
  ): Observable<ApiResponse<Product[]>> {
    this.setLoading('products', true);

    const variables = {
      cafeId,
      categoryId: options?.categoryId,
      page: options?.page,
      limit: options?.limit,
      search: options?.search,
      available: options?.available
    };

    return this.query<{ products: ApiResponse<Product[]> }>(GET_PRODUCTS, variables, {
      useCache: true,
      cacheTTL: 300000 // 5 minutes cache
    }).pipe(
      map(response => response.products),
      tap(response => {
        this.productsSubject.next(response.data);
        this.setLoading('products', false);
      })
    );
  }

  /**
   * Get single product by ID
   */
  getProduct(id: string): Observable<Product> {
    return this.query<{ product: Product }>(GET_PRODUCT, { id }, {
      useCache: true,
      cacheTTL: 300000 // 5 minutes cache
    }).pipe(
      map(response => response.product)
    );
  }

  /**
   * Get all categories for a cafe
   */
  getCategories(cafeId: string): Observable<ProductCategory[]> {
    this.setLoading('categories', true);

    return this.query<{ productCategories: ProductCategory[] }>(GET_CATEGORIES, { cafeId }, {
      useCache: true,
      cacheTTL: 600000 // 10 minutes cache
    }).pipe(
      map(response => response.productCategories),
      tap(categories => {
        this.categoriesSubject.next(categories);
        this.setLoading('categories', false);
      })
    );
  }

  /**
   * Get products by category
   */
  getProductsByCategory(cafeId: string, categoryId: string): Observable<Product[]> {
    return this.getProducts(cafeId, { categoryId }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Search products
   */
  searchProducts(cafeId: string, search: string): Observable<Product[]> {
    this.searchTermSubject.next(search);

    return this.getProducts(cafeId, { search }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create new product
   */
  createProduct(input: CreateProductInput): Observable<Product> {
    this.setLoading('saveProduct', true);

    return this.mutate<{ createProduct: Product }>(CREATE_PRODUCT, { input }).pipe(
      map(response => response.createProduct),
      tap(product => {
        // Update local state
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next([...currentProducts, product]);
        this.setLoading('saveProduct', false);

        // Clear relevant cache
        this.clearCacheByPattern('products');
      })
    );
  }

  /**
   * Update existing product
   */
  updateProduct(id: string, input: UpdateProductInput): Observable<Product> {
    this.setLoading('saveProduct', true);

    return this.mutate<{ updateProduct: Product }>(UPDATE_PRODUCT, { id, input }).pipe(
      map(response => response.updateProduct),
      tap(updatedProduct => {
        // Update local state
        const currentProducts = this.productsSubject.value;
        const updatedProducts = currentProducts.map(product =>
          product.id === id ? { ...product, ...updatedProduct } : product
        );
        this.productsSubject.next(updatedProducts);
        this.setLoading('saveProduct', false);

        // Clear relevant cache
        this.clearCacheByPattern('products');
      })
    );
  }

  /**
   * Delete product
   */
  deleteProduct(id: string): Observable<boolean> {
    return this.mutate<{ deleteProduct: { success: boolean } }>(DELETE_PRODUCT, { id }).pipe(
      map(response => response.deleteProduct.success),
      tap(success => {
        if (success) {
          // Update local state
          const currentProducts = this.productsSubject.value;
          const updatedProducts = currentProducts.filter(product => product.id !== id);
          this.productsSubject.next(updatedProducts);

          // Clear relevant cache
          this.clearCacheByPattern('products');
        }
      })
    );
  }

  /**
   * Update product availability
   */
  updateProductAvailability(id: string, isAvailable: boolean): Observable<Product> {
    return this.mutate<{ updateProductAvailability: Product }>(
      UPDATE_PRODUCT_AVAILABILITY,
      { id, isAvailable }
    ).pipe(
      map(response => response.updateProductAvailability),
      tap(updatedProduct => {
        // Update local state
        const currentProducts = this.productsSubject.value;
        const updatedProducts = currentProducts.map(product =>
          product.id === id ? { ...product, isAvailable } : product
        );
        this.productsSubject.next(updatedProducts);

        // Clear relevant cache
        this.clearCacheByPattern('products');
      })
    );
  }

  /**
   * Set selected category filter
   */
  setSelectedCategory(categoryId: string | null): void {
    this.selectedCategorySubject.next(categoryId);
  }

  /**
   * Set search term
   */
  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  /**
   * Set product filters
   */
  setFilters(filters: ProductFilters): void {
    this.filtersSubject.next(filters);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedCategorySubject.next(null);
    this.searchTermSubject.next('');
    this.filtersSubject.next({});
  }

  /**
   * Get products with low stock (requires inventory integration)
   */
  getLowStockProducts(cafeId: string): Observable<Product[]> {
    return this.products$.pipe(
      map(products => products.filter(product => {
        // This would need integration with inventory service
        // For now, return empty array
        return false;
      }))
    );
  }

  /**
   * Get popular products based on order frequency
   */
  getPopularProducts(cafeId: string, limit: number = 10): Observable<Product[]> {
    // This would typically require order analytics
    // For now, return available products
    return this.availableProducts$.pipe(
      map(products => products.slice(0, limit))
    );
  }

  /**
   * Calculate product preparation time including customizations
   */
  calculateTotalPreparationTime(product: Product, customizations?: any[]): number {
    let baseTime = product.preparationTime;

    if (customizations && customizations.length > 0) {
      // Add extra time for customizations (could be configured per customization)
      baseTime += customizations.length * 2; // 2 minutes per customization
    }

    return baseTime;
  }

  /**
   * Calculate product price including customizations
   */
  calculateTotalPrice(product: Product, quantity: number = 1, customizations?: any[]): number {
    let basePrice = product.price;

    if (customizations && customizations.length > 0) {
      const customizationPrice = customizations.reduce(
        (total, custom) => total + (custom.additionalPrice || 0),
        0
      );
      basePrice += customizationPrice;
    }

    return basePrice * quantity;
  }

  /**
   * Check if product has allergens
   */
  hasAllergens(product: Product, allergens: string[]): boolean {
    if (!product.allergens || !allergens.length) return false;

    return allergens.some(allergen =>
      product.allergens!.some(productAllergen =>
        productAllergen.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  }

  /**
   * Get products by dietary requirements
   */
  getProductsByDiet(cafeId: string, requirements: {
    vegan?: boolean;
    glutenFree?: boolean;
    excludeAllergens?: string[];
  }): Observable<Product[]> {
    return this.availableProducts$.pipe(
      map(products => products.filter(product => {
        if (requirements.vegan && !product.isVegan) return false;
        if (requirements.glutenFree && !product.isGlutenFree) return false;
        if (requirements.excludeAllergens &&
            this.hasAllergens(product, requirements.excludeAllergens)) return false;

        return true;
      }))
    );
  }

  /**
   * Filter products based on criteria
   */
  private filterProducts(
    products: Product[],
    categoryId: string | null,
    searchTerm: string,
    filters: ProductFilters
  ): Product[] {
    let filtered = [...products];

    // Filter by category
    if (categoryId) {
      filtered = filtered.filter(product => product.categoryId === categoryId);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.ingredients?.some(ingredient =>
          ingredient.name.toLowerCase().includes(term)
        )
      );
    }

    // Apply additional filters
    if (filters.available !== undefined) {
      filtered = filtered.filter(product => product.isAvailable === filters.available);
    }

    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.priceMax!);
    }

    if (filters.isVegan) {
      filtered = filtered.filter(product => product.isVegan);
    }

    if (filters.isGlutenFree) {
      filtered = filtered.filter(product => product.isGlutenFree);
    }

    if (filters.allergens && filters.allergens.length > 0) {
      filtered = filtered.filter(product => !this.hasAllergens(product, filters.allergens!));
    }

    return filtered;
  }

  /**
   * Handle real-time product updates (to be called by WebSocket service)
   */
  public handleProductUpdate(productUpdate: { productId: string; isAvailable: boolean }): void {
    const currentProducts = this.productsSubject.value;
    const updatedProducts = currentProducts.map(product => {
      if (product.id === productUpdate.productId) {
        return {
          ...product,
          isAvailable: productUpdate.isAvailable,
          updatedAt: new Date()
        };
      }
      return product;
    });

    this.productsSubject.next(updatedProducts);
  }

  /**
   * Bulk update product availability
   */
  bulkUpdateAvailability(updates: { productId: string; isAvailable: boolean }[]): Observable<boolean> {
    // This would typically be a single GraphQL mutation for bulk updates
    // For now, we'll update locally and assume success
    const currentProducts = this.productsSubject.value;
    const updatedProducts = currentProducts.map(product => {
      const update = updates.find(u => u.productId === product.id);
      if (update) {
        return { ...product, isAvailable: update.isAvailable };
      }
      return product;
    });

    this.productsSubject.next(updatedProducts);
    this.clearCacheByPattern('products');

    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }
}