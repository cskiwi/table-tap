import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { Product, Category, SelectOption } from '../../../../shared/interfaces/common.interfaces';
import { BaseComponent } from '../../../../shared/components/base/base.component';

export interface ProductFilter {
  search: string;
  categories: string[];
  priceRange: [number, number];
  dietary: string[];
  available: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ProductGridConfig {
  showFilters: boolean;
  showSearch: boolean;
  showSort: boolean;
  showCategories: boolean;
  showPriceFilter: boolean;
  showDietaryFilters: boolean;
  layout: 'grid' | 'list';
  itemsPerRow: number;
  showPagination: boolean;
  itemsPerPage: number;
}

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataViewModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    MultiSelectModule,
    SliderModule,
    ChipModule,
    TagModule,
    CardModule,
    BadgeModule,
    SkeletonModule,
    TooltipModule
  ],
  template: `
    <div class="product-grid" [ngClass]="getGridClasses()">

      <!-- Filters Section -->
      <div class="filters-section mb-6" *ngIf="gridConfig.showFilters">
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <!-- Search -->
            <div class="search-filter" *ngIf="gridConfig.showSearch">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search"></i>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="filters.search"
                  (input)="onFilterChange()"
                  placeholder="Search products..."
                  class="w-full"
                  [attr.aria-label]="'Search products'">
              </span>
            </div>

            <!-- Category Filter -->
            <div class="category-filter" *ngIf="gridConfig.showCategories">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <p-multiSelect
                [options]="categoryOptions"
                [(ngModel)]="filters.categories"
                (onChange)="onFilterChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Categories"
                [showToggleAll]="true"
                class="w-full"
                [attr.aria-label]="'Filter by categories'">
              </p-multiSelect>
            </div>

            <!-- Price Range -->
            <div class="price-filter" *ngIf="gridConfig.showPriceFilter">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ${{filters.priceRange[0]}} - ${{filters.priceRange[1]}}
              </label>
              <p-slider
                [(ngModel)]="filters.priceRange"
                [range]="true"
                [min]="minPrice"
                [max]="maxPrice"
                [step]="0.5"
                (onSlideEnd)="onFilterChange()"
                class="w-full mt-2"
                [attr.aria-label]="'Price range filter'">
              </p-slider>
            </div>

            <!-- Dietary Filters -->
            <div class="dietary-filter" *ngIf="gridConfig.showDietaryFilters">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Dietary Options
              </label>
              <p-multiSelect
                [options]="dietaryOptions"
                [(ngModel)]="filters.dietary"
                (onChange)="onFilterChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Options"
                class="w-full"
                [attr.aria-label]="'Filter by dietary options'">
              </p-multiSelect>
            </div>

          </div>

          <!-- Filter Actions -->
          <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">
                {{ filteredProducts.length }} of {{ products.length }} products
              </span>

              <!-- Active Filters -->
              <div class="flex flex-wrap gap-1" *ngIf="hasActiveFilters()">
                <p-chip
                  *ngFor="let filter of getActiveFilterTags(); trackBy: trackByFilterTag"
                  [label]="filter.label"
                  [removable]="true"
                  (onRemove)="removeFilter(filter.key, filter.value)"
                  styleClass="text-xs">
                </p-chip>
              </div>
            </div>

            <p-button
              label="Clear Filters"
              icon="pi pi-filter-slash"
              severity="secondary"
              size="small"
              [outlined]="true"
              (onClick)="clearFilters()"
              [disabled]="!hasActiveFilters()">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Sort and Layout Controls -->
      <div class="controls-section mb-4" *ngIf="gridConfig.showSort">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">

            <!-- Sort Dropdown -->
            <div class="sort-control">
              <p-dropdown
                [options]="sortOptions"
                [(ngModel)]="filters.sortBy"
                (onChange)="onSortChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="Sort by..."
                class="w-48"
                [attr.aria-label]="'Sort products'">
              </p-dropdown>
            </div>

            <!-- Sort Order Toggle -->
            <p-button
              [icon]="filters.sortOrder === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
              [pTooltip]="filters.sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'"
              severity="secondary"
              [outlined]="true"
              (onClick)="toggleSortOrder()">
            </p-button>

          </div>

          <!-- Layout Toggle -->
          <div class="layout-controls">
            <div class="p-buttonset">
              <p-button
                icon="pi pi-th-large"
                [severity]="gridConfig.layout === 'grid' ? 'info' : 'secondary'"
                [outlined]="gridConfig.layout !== 'grid'"
                (onClick)="setLayout('grid')"
                pTooltip="Grid View">
              </p-button>
              <p-button
                icon="pi pi-list"
                [severity]="gridConfig.layout === 'list' ? 'info' : 'secondary'"
                [outlined]="gridConfig.layout !== 'list'"
                (onClick)="setLayout('list')"
                pTooltip="List View">
              </p-button>
            </div>
          </div>

        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-grid" *ngIf="isLoading">
        <div [ngClass]="getLoadingGridClasses()">
          <p-skeleton
            *ngFor="let item of getLoadingItems()"
            height="300px"
            styleClass="mb-4">
          </p-skeleton>
        </div>
      </div>

      <!-- Products DataView -->
      <p-dataView
        *ngIf="!isLoading"
        [value]="filteredProducts"
        [layout]="gridConfig.layout"
        [paginator]="gridConfig.showPagination"
        [rows]="gridConfig.itemsPerPage"
        [sortField]="filters.sortBy"
        [sortOrder]="filters.sortOrder === 'asc' ? 1 : -1"
        emptyMessage="No products found"
        class="product-dataview">

        <!-- Grid Layout Template -->
        <ng-template let-product pTemplate="gridItem">
          <div class="col-12" [ngClass]="getGridItemClasses()">
            <div class="product-card">
              <p-card styleClass="h-full">

                <!-- Product Image -->
                <ng-template pTemplate="header">
                  <div class="product-image-container relative overflow-hidden">
                    <img
                      [src]="product.images?.[0] || '/assets/images/placeholder-product.jpg'"
                      [alt]="product.name"
                      class="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy">

                    <!-- Availability Badge -->
                    <div class="absolute top-2 left-2">
                      <p-badge
                        [value]="product.isAvailable ? 'Available' : 'Unavailable'"
                        [severity]="product.isAvailable ? 'success' : 'danger'"
                        styleClass="text-xs">
                      </p-badge>
                    </div>

                    <!-- Dietary Tags -->
                    <div class="absolute top-2 right-2 flex flex-col gap-1">
                      <p-tag
                        *ngIf="product.isVegan"
                        value="V"
                        severity="success"
                        styleClass="text-xs"
                        pTooltip="Vegan">
                      </p-tag>
                      <p-tag
                        *ngIf="product.isGlutenFree"
                        value="GF"
                        severity="info"
                        styleClass="text-xs"
                        pTooltip="Gluten Free">
                      </p-tag>
                    </div>

                    <!-- Quick Add Button -->
                    <div class="absolute bottom-2 right-2">
                      <p-button
                        icon="pi pi-plus"
                        [rounded]="true"
                        severity="info"
                        [disabled]="!product.isAvailable"
                        (onClick)="onQuickAdd(product)"
                        pTooltip="Quick Add">
                      </p-button>
                    </div>
                  </div>
                </ng-template>

                <!-- Product Info -->
                <div class="product-info p-4">
                  <div class="mb-3">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                      {{ product.name }}
                    </h3>
                    <p class="text-sm text-gray-600 line-clamp-2">
                      {{ product.description }}
                    </p>
                  </div>

                  <!-- Product Details -->
                  <div class="product-details mb-3">
                    <div class="flex items-center justify-between text-sm text-gray-500">
                      <div class="flex items-center space-x-2">
                        <span class="flex items-center">
                          <i class="pi pi-clock mr-1"></i>
                          {{ product.preparationTime }}min
                        </span>
                        <span class="flex items-center" *ngIf="product.calories">
                          <i class="pi pi-heart mr-1"></i>
                          {{ product.calories }}cal
                        </span>
                      </div>

                      <span class="text-sm font-medium text-gray-700">
                        {{ product.categoryName }}
                      </span>
                    </div>
                  </div>

                  <!-- Tags -->
                  <div class="product-tags mb-3" *ngIf="product.tags.length">
                    <div class="flex flex-wrap gap-1">
                      <p-chip
                        *ngFor="let tag of product.tags | slice:0:3; trackBy: trackByTag"
                        [label]="tag"
                        styleClass="text-xs bg-gray-100 text-gray-700">
                      </p-chip>
                      <p-chip
                        *ngIf="product.tags.length > 3"
                        [label]="'+' + (product.tags.length - 3)"
                        styleClass="text-xs bg-gray-200 text-gray-600">
                      </p-chip>
                    </div>
                  </div>

                  <!-- Price and Actions -->
                  <div class="product-actions flex items-center justify-between">
                    <div class="price">
                      <span class="text-2xl font-bold text-gray-900">
                        ${{ product.price.toFixed(2) }}
                      </span>
                    </div>

                    <div class="actions flex gap-2">
                      <p-button
                        label="View"
                        icon="pi pi-eye"
                        severity="secondary"
                        size="small"
                        [outlined]="true"
                        (onClick)="onViewProduct(product)">
                      </p-button>

                      <p-button
                        [label]="product.customizations?.length ? 'Customize' : 'Add'"
                        icon="pi pi-shopping-cart"
                        severity="info"
                        size="small"
                        [disabled]="!product.isAvailable"
                        (onClick)="onAddToCart(product)">
                      </p-button>
                    </div>
                  </div>
                </div>

              </p-card>
            </div>
          </div>
        </ng-template>

        <!-- List Layout Template -->
        <ng-template let-product pTemplate="listItem">
          <div class="col-12">
            <div class="product-list-item flex bg-white p-4 border border-gray-200 rounded-lg mb-4 hover:shadow-md transition-shadow">

              <!-- Product Image -->
              <div class="product-image w-24 h-24 flex-shrink-0 mr-4">
                <img
                  [src]="product.images?.[0] || '/assets/images/placeholder-product.jpg'"
                  [alt]="product.name"
                  class="w-full h-full object-cover rounded-lg">
              </div>

              <!-- Product Info -->
              <div class="product-info flex-1">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ product.name }}
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ product.description }}
                    </p>
                  </div>

                  <div class="price text-right">
                    <div class="text-2xl font-bold text-gray-900">
                      ${{ product.price.toFixed(2) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ product.categoryName }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span class="flex items-center">
                      <i class="pi pi-clock mr-1"></i>
                      {{ product.preparationTime }}min
                    </span>
                    <span *ngIf="product.calories" class="flex items-center">
                      <i class="pi pi-heart mr-1"></i>
                      {{ product.calories }}cal
                    </span>

                    <!-- Dietary Tags -->
                    <div class="flex space-x-1">
                      <p-tag
                        *ngIf="product.isVegan"
                        value="Vegan"
                        severity="success"
                        styleClass="text-xs">
                      </p-tag>
                      <p-tag
                        *ngIf="product.isGlutenFree"
                        value="Gluten Free"
                        severity="info"
                        styleClass="text-xs">
                      </p-tag>
                    </div>
                  </div>

                  <div class="actions flex gap-2">
                    <p-button
                      label="View"
                      icon="pi pi-eye"
                      severity="secondary"
                      size="small"
                      [outlined]="true"
                      (onClick)="onViewProduct(product)">
                    </p-button>

                    <p-button
                      [label]="product.customizations?.length ? 'Customize' : 'Add to Cart'"
                      icon="pi pi-shopping-cart"
                      severity="info"
                      size="small"
                      [disabled]="!product.isAvailable"
                      (onClick)="onAddToCart(product)">
                    </p-button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </ng-template>

      </p-dataView>

      <!-- Empty State -->
      <div class="empty-state text-center py-12" *ngIf="!isLoading && filteredProducts.length === 0">
        <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
        <p class="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
        <p-button
          label="Clear Filters"
          icon="pi pi-filter-slash"
          severity="secondary"
          [outlined]="true"
          (onClick)="clearFilters()"
          *ngIf="hasActiveFilters()">
        </p-button>
      </div>

    </div>
  `,
  styleUrls: ['./product-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGridComponent extends BaseComponent implements OnInit {
  @Input() products: Product[] = [];
  @Input() categories: Category[] = [];
  @Input() gridConfig: ProductGridConfig = this.getDefaultConfig();
  @Input() initialFilters?: Partial<ProductFilter>;

  @Output() productView = new EventEmitter<Product>();
  @Output() productAdd = new EventEmitter<Product>();
  @Output() quickAdd = new EventEmitter<Product>();
  @Output() filterChange = new EventEmitter<ProductFilter>();

  filters: ProductFilter = this.getDefaultFilters();
  filteredProducts: Product[] = [];

  categoryOptions: SelectOption[] = [];
  dietaryOptions: SelectOption[] = [
    { label: 'Vegan', value: 'vegan' },
    { label: 'Gluten Free', value: 'glutenFree' }
  ];

  sortOptions: SelectOption[] = [
    { label: 'Name A-Z', value: 'name' },
    { label: 'Price Low-High', value: 'price' },
    { label: 'Preparation Time', value: 'preparationTime' },
    { label: 'Popularity', value: 'popularity' },
    { label: 'Newest', value: 'createdAt' }
  ];

  minPrice = 0;
  maxPrice = 50;

  ngOnInit(): void {
    super.ngOnInit();
    this.initializeFilters();
    this.setupCategoryOptions();
    this.calculatePriceRange();
    this.applyFilters();
  }

  private getDefaultConfig(): ProductGridConfig {
    return {
      showFilters: true,
      showSearch: true,
      showSort: true,
      showCategories: true,
      showPriceFilter: true,
      showDietaryFilters: true,
      layout: 'grid',
      itemsPerRow: 4,
      showPagination: true,
      itemsPerPage: 12
    };
  }

  private getDefaultFilters(): ProductFilter {
    return {
      search: '',
      categories: [],
      priceRange: [0, 50],
      dietary: [],
      available: true,
      sortBy: 'name',
      sortOrder: 'asc'
    };
  }

  private initializeFilters(): void {
    if (this.initialFilters) {
      this.filters = { ...this.getDefaultFilters(), ...this.initialFilters };
    }
  }

  private setupCategoryOptions(): void {
    this.categoryOptions = this.categories.map(category => ({
      label: category.name,
      value: category.id
    }));
  }

  private calculatePriceRange(): void {
    if (this.products.length > 0) {
      const prices = this.products.map(p => p.price);
      this.minPrice = Math.min(...prices);
      this.maxPrice = Math.max(...prices);

      if (!this.initialFilters?.priceRange) {
        this.filters.priceRange = [this.minPrice, this.maxPrice];
      }
    }
  }

  private applyFilters(): void {
    let filtered = [...this.products];

    // Search filter
    if (this.filters.search.trim()) {
      const searchTerm = this.filters.search.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    if (this.filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        this.filters.categories.includes(product.categoryId)
      );
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= this.filters.priceRange[0] &&
      product.price <= this.filters.priceRange[1]
    );

    // Dietary filters
    if (this.filters.dietary.includes('vegan')) {
      filtered = filtered.filter(product => product.isVegan);
    }
    if (this.filters.dietary.includes('glutenFree')) {
      filtered = filtered.filter(product => product.isGlutenFree);
    }

    // Availability filter
    if (this.filters.available) {
      filtered = filtered.filter(product => product.isAvailable);
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = this.getSortValue(a, this.filters.sortBy);
      const bValue = this.getSortValue(b, this.filters.sortBy);

      let result = 0;
      if (aValue < bValue) result = -1;
      else if (aValue > bValue) result = 1;

      return this.filters.sortOrder === 'desc' ? -result : result;
    });

    this.filteredProducts = filtered;
    this.filterChange.emit(this.filters);
  }

  private getSortValue(product: Product, sortBy: string): any {
    switch (sortBy) {
      case 'name':
        return product.name.toLowerCase();
      case 'price':
        return product.price;
      case 'preparationTime':
        return product.preparationTime;
      case 'createdAt':
        return product.createdAt;
      default:
        return product.name.toLowerCase();
    }
  }

  // Event Handlers
  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  setLayout(layout: 'grid' | 'list'): void {
    this.gridConfig.layout = layout;
  }

  clearFilters(): void {
    this.filters = this.getDefaultFilters();
    this.filters.priceRange = [this.minPrice, this.maxPrice];
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.search.trim() !== '' ||
      this.filters.categories.length > 0 ||
      this.filters.dietary.length > 0 ||
      this.filters.priceRange[0] !== this.minPrice ||
      this.filters.priceRange[1] !== this.maxPrice
    );
  }

  getActiveFilterTags(): Array<{ label: string; key: string; value: any }> {
    const tags: Array<{ label: string; key: string; value: any }> = [];

    if (this.filters.search.trim()) {
      tags.push({
        label: `Search: "${this.filters.search}"`,
        key: 'search',
        value: this.filters.search
      });
    }

    this.filters.categories.forEach(categoryId => {
      const category = this.categories.find(c => c.id === categoryId);
      if (category) {
        tags.push({
          label: `Category: ${category.name}`,
          key: 'categories',
          value: categoryId
        });
      }
    });

    this.filters.dietary.forEach(dietary => {
      const option = this.dietaryOptions.find(o => o.value === dietary);
      if (option) {
        tags.push({
          label: `Dietary: ${option.label}`,
          key: 'dietary',
          value: dietary
        });
      }
    });

    return tags;
  }

  removeFilter(key: string, value: any): void {
    switch (key) {
      case 'search':
        this.filters.search = '';
        break;
      case 'categories':
        this.filters.categories = this.filters.categories.filter(c => c !== value);
        break;
      case 'dietary':
        this.filters.dietary = this.filters.dietary.filter(d => d !== value);
        break;
    }
    this.applyFilters();
  }

  // Product Actions
  onViewProduct(product: Product): void {
    this.productView.emit(product);
  }

  onAddToCart(product: Product): void {
    this.productAdd.emit(product);
  }

  onQuickAdd(product: Product): void {
    this.quickAdd.emit(product);
  }

  // UI Helpers
  getGridClasses(): string {
    return this.getResponsiveClasses('w-full max-w-7xl mx-auto');
  }

  getGridItemClasses(): string {
    const cols = Math.floor(12 / this.gridConfig.itemsPerRow);
    return `sm:col-${cols} md:col-${cols} lg:col-${cols}`;
  }

  getLoadingGridClasses(): string {
    return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${this.gridConfig.itemsPerRow} gap-6`;
  }

  getLoadingItems(): number[] {
    return Array.from({ length: this.gridConfig.itemsPerPage }, (_, i) => i);
  }

  // TrackBy Functions
  trackByProductId(index: number, product: Product): string {
    return product.id;
  }

  trackByFilterTag(index: number, tag: any): string {
    return `${tag.key}-${tag.value}`;
  }

  trackByTag(index: number, tag: string): string {
    return tag;
  }

  protected override getAriaLabel(): string {
    return `Product grid showing ${this.filteredProducts.length} of ${this.products.length} products`;
  }
}