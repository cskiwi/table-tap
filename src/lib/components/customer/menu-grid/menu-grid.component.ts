import { CommonModule } from '@angular/common';
import { Component, computed, input, OnInit, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Category, MenuGridConfig, Product } from '../../../shared/interfaces';
import { RESTAURANT_TAILWIND_CLASSES } from '../../../shared/theme/restaurant-theme';

@Component({
  selector: 'app-menu-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    CardModule,
    DataViewModule,
    DropdownModule,
    InputTextModule,
    TagModule
  ],
  template: `
    <div [class]="containerClasses">
      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 [class]="titleClasses">{{ 'MENU.TITLE' | translate }}</h2>
        
        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          @if (config().searchEnabled) {
            <div class="relative">
              <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                pInputText
                [formControl]="searchControl"
                [placeholder]="'MENU.SEARCH_PLACEHOLDER' | translate"
                class="pl-10 w-full sm:w-64"
              />
            </div>
          }
          
          @if (config().categoryFilter) {
            <p-dropdown
              [formControl]="categoryControl"
              [options]="categoryOptions()"
              optionLabel="label"
              optionValue="value"
              [placeholder]="'MENU.ALL_CATEGORIES' | translate"
              class="w-full sm:w-48"
            />
          }
          
          @if (config().sortOptions.length > 0) {
            <p-dropdown
              [formControl]="sortControl"
              [options]="sortOptions"
              optionLabel="label"
              optionValue="value"
              [placeholder]="'MENU.SORT_BY' | translate"
              class="w-full sm:w-40"
            />
          }
        </div>
      </div>

      <!-- Products Grid -->
      <p-dataView
        [value]="filteredProducts()"
        [layout]="'grid'"
        [paginator]="true"
        [rows]="12"
        [loading]="loading()"
        [emptyMessage]="'MENU.NO_PRODUCTS_FOUND' | translate"
      >
        <ng-template #gridItem let-product>
          <div class="col-12 sm:col-6 md:col-4 lg:col-3 xl:col-2">
            <div [class]="productCardClasses" (click)="onProductSelect(product)">
              <!-- Product Image -->
              @if (config().showImages && product.image) {
                <div class="relative overflow-hidden rounded-t-lg">
                  <img
                    [src]="product.image"
                    [alt]="product.name"
                    class="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                  @if (product.tags.length > 0) {
                    <div class="absolute top-2 left-2 flex flex-wrap gap-1">
                      @for (tag of product.tags.slice(0, 2); track tag) {
                        <p-tag
                          [value]="tag"
                          severity="info"
                          class="text-xs"
                        />
                      }
                    </div>
                  }
                </div>
              }
              
              <!-- Product Info -->
              <div [class]="RESTAURANT_TAILWIND_CLASSES.cardPadding">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-semibold text-lg text-gray-800 line-clamp-2">{{ product.name }}</h3>
                  @if (config().showPrices) {
                    <span class="text-xl font-bold text-primary-600 ml-2 flex-shrink-0">
                      {{ product.price | currency:'EUR':'symbol':'1.2-2' }}
                    </span>
                  }
                </div>
                
                @if (config().showDescriptions && product.description) {
                  <p class="text-gray-600 text-sm line-clamp-3 mb-3">{{ product.description }}</p>
                }
                
                <!-- Preparation Time -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center text-gray-500 text-sm">
                    <i class="pi pi-clock mr-1"></i>
                    <span>{{ product.preparationTimeMinutes }} {{ 'COMMON.MINUTES' | translate }}</span>
                  </div>
                  
                  <!-- Allergens -->
                  @if (product.allergens.length > 0) {
                    <div class="flex items-center">
                      <i class="pi pi-exclamation-triangle text-orange-500 mr-1"></i>
                      <span class="text-xs text-gray-500">{{ 'MENU.ALLERGENS' | translate }}</span>
                    </div>
                  }
                </div>
                
                <!-- Customizations indicator -->
                @if (product.customizations.length > 0) {
                  <div class="mt-2 text-primary-600 text-sm font-medium">
                    <i class="pi pi-cog mr-1"></i>
                    {{ 'MENU.CUSTOMIZABLE' | translate }}
                  </div>
                }
              </div>
              
              <!-- Add to Cart Button -->
              <div class="p-4 pt-0">
                <button
                  pButton
                  type="button"
                  [label]="'MENU.ADD_TO_CART' | translate"
                  icon="pi pi-plus"
                  [class]="addButtonClasses"
                  (click)="onAddToCart($event, product)"
                />
              </div>
            </div>
          </div>
        </ng-template>
        
        <ng-template #emptyMessage>
          <div class="text-center py-12">
            <i class="pi pi-search text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">{{ 'MENU.NO_PRODUCTS_FOUND' | translate }}</h3>
            <p class="text-gray-500">{{ 'MENU.TRY_DIFFERENT_SEARCH' | translate }}</p>
          </div>
        </ng-template>
      </p-dataView>
    </div>
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .product-card {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      @media (max-width: 640px) {
        .product-card {
          margin-bottom: 1rem;
        }
      }
    `
  ]
})
export class MenuGridComponent implements OnInit {
  // Inputs
  products = input.required<Product[]>();
  categories = input.required<Category[]>();
  config = input<MenuGridConfig>({
    columns: 4,
    showPrices: true,
    showImages: true,
    showDescriptions: true,
    categoryFilter: true,
    searchEnabled: true,
    sortOptions: ['name', 'price', 'popularity']
  });
  loading = input<boolean>(false);
  
  // Outputs
  productSelected = output<Product>();
  addToCart = output<Product>();
  
  // Form Controls
  searchControl = new FormControl('');
  categoryControl = new FormControl(null);
  sortControl = new FormControl('name');
  
  // Signals
  private searchTerm = signal('');
  private selectedCategory = signal<string | null>(null);
  private sortBy = signal<string>('name');
  
  // Computed properties
  categoryOptions = computed(() => [
    { label: 'All Categories', value: null },
    ...this.categories().map(cat => ({
      label: cat.name,
      value: cat.id
    }))
  ]);
  
  filteredProducts = computed(() => {
    let filtered = [...this.products()];
    
    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // Apply category filter
    const category = this.selectedCategory();
    if (category) {
      filtered = filtered.filter(product => product.categoryId === category);
    }
    
    // Apply sorting
    const sort = this.sortBy();
    filtered.sort((a, b) => {
      switch (sort) {
        case 'price':
          return a.price - b.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          // In a real app, this would be based on order count or rating
          return Math.random() - 0.5;
        default:
          return 0;
      }
    });
    
    return filtered;
  });
  
  // Style classes
  protected readonly RESTAURANT_TAILWIND_CLASSES = RESTAURANT_TAILWIND_CLASSES;
  
  containerClasses = RESTAURANT_TAILWIND_CLASSES.container + ' py-6';
  titleClasses = RESTAURANT_TAILWIND_CLASSES.heading.h2 + ' text-gray-800';
  productCardClasses = RESTAURANT_TAILWIND_CLASSES.card + ' product-card h-full flex flex-col';
  addButtonClasses = 'w-full ' + RESTAURANT_TAILWIND_CLASSES.button.primary;
  
  // Sort options
  sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Price', value: 'price' },
    { label: 'Popularity', value: 'popularity' }
  ];
  
  constructor() {
    // Setup reactive form controls
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map(value => value || ''),
        takeUntilDestroyed()
      )
      .subscribe(term => this.searchTerm.set(term));
      
    this.categoryControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe(category => this.selectedCategory.set(category));
      
    this.sortControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        startWith('name'),
        takeUntilDestroyed()
      )
      .subscribe(sort => this.sortBy.set(sort));
  }
  
  ngOnInit() {
    // Initialize sort control
    this.sortControl.setValue('name');
  }
  
  onProductSelect(product: Product) {
    this.productSelected.emit(product);
  }
  
  onAddToCart(event: Event, product: Product) {
    event.stopPropagation();
    this.addToCart.emit(product);
  }
}
