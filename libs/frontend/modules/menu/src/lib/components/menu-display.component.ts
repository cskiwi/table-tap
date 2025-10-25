import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

// PrimeNG Components
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { SliderModule } from 'primeng/slider';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';

import { MenuService } from '../services/menu.service';
import { MenuItem, MenuItemStatus } from '../types/menu.types';

@Component({
  selector: 'app-menu-display',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ChipModule,
    SkeletonModule,
    MessageModule,
    ToggleButtonModule,
    SliderModule,
    DividerModule,
    BadgeModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu-display.component.html',
})
export class MenuDisplayComponent implements OnInit, OnDestroy {
  readonly cafeId = input.required<string>();
  readonly cafeName = input('Restaurant');
  readonly initialCategoryId = input<string>();

  readonly itemSelected = output<MenuItem>();
  readonly addToCart = output<MenuItem>();
  readonly retryLoad = output<void>();

  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  readonly menuService = inject(MenuService);

  // Local component state
  searchQuery = '';
  showAdvancedFilters = false;
  selectedCategoryId: string | undefined = undefined;
  readonly selectedStatus = signal<MenuItemStatus | undefined>(undefined);
  priceRange = [0, 50];
  readonly excludedAllergens = signal<string[]>([]);
  maxPrepTime = 30;
  isGridView = false;

  // Computed properties from service
  readonly categories = this.menuService.categories;
  readonly filteredItems = this.menuService.filteredItems;
  readonly loading = this.menuService.loading;
  readonly error = this.menuService.error;
  readonly displayOptions = this.menuService.displayOptions;

  // Local computed properties
  readonly maxPrice = computed(() => Math.max(...this.menuService.menuItems().map((item) => item.price), 50));
  readonly hasActiveFilters = computed(() => {
    const filters = this.menuService.filters();
    return !!(
      filters.search ||
      filters.categoryId ||
      filters.status ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.allergens?.length ||
      filters.preparationTime !== undefined
    );
  });
  readonly selectedCategoryName = computed(() => {
    const categoryId = this.selectedCategoryId;
    return this.categories().find((cat) => cat.id === categoryId)?.name;
  });

  // Dropdown options
  readonly categoryOptions = computed(() => this.categories().map((cat) => ({ label: cat.name, value: cat.id })));

  readonly statusOptions = [
    { label: 'Available', value: MenuItemStatus.AVAILABLE },
    { label: 'Out of Stock', value: MenuItemStatus.OUT_OF_STOCK },
    { label: 'Seasonal', value: MenuItemStatus.SEASONAL },
  ];
  readonly sortOptions = [
    { label: 'Default Order', value: 'sortOrder-asc' },
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Name (Z-A)', value: 'name-desc' },
    { label: 'Price (Low to High)', value: 'price-asc' },
    { label: 'Price (High to Low)', value: 'price-desc' },
    { label: 'Preparation Time', value: 'preparationTime-asc' },
  ];
  readonly selectedSort = signal('sortOrder-asc');

  // Utility methods
  readonly Array = Array;

  ngOnInit(): void {
    const initialCategoryId = this.initialCategoryId();
    if (initialCategoryId) {
      this.selectedCategoryId = initialCategoryId;
    }

    // Load menu data
    this.loadMenu();

    // Set up search debouncing
    this.setupSearchDebouncing();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMenu(): void {
    this.menuService.loadCompleteMenu(this.cafeId()).subscribe();
  }

  private setupSearchDebouncing(): void {
    // This would be implemented with a reactive form or similar pattern
    // For now, search is handled directly in onSearchChange
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value;
    this.searchQuery = query;
    this.menuService.updateFilters({ search: query });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.menuService.updateFilters({ search: undefined });
  }

  onCategoryChange(categoryId: string | null): void {
    this.selectedCategoryId = categoryId || undefined;
    this.menuService.selectCategory(categoryId ? this.categories().find((cat) => cat.id === categoryId) : undefined);
  }

  onStatusChange(status: MenuItemStatus | null): void {
    this.selectedStatus.set(status || undefined);
    this.menuService.updateFilters({ status: status || undefined });
  }

  onViewChange(isGrid: boolean | undefined): void {
    if (isGrid !== undefined) {
      this.isGridView = isGrid;
      this.menuService.updateDisplayOptions({ view: isGrid ? 'grid' : 'list' });
    }
  }

  onPriceRangeChange(values: number[] | undefined): void {
    if (values) {
      this.priceRange = values;
      this.menuService.updateFilters({
        minPrice: values[0],
        maxPrice: values[1],
      });
    }
  }

  onAllergensChange(event: any): void {
    const allergens = event.value || [];
    this.excludedAllergens.set(allergens);
    this.menuService.updateFilters({ allergens });
  }

  onPrepTimeChange(value: number | undefined): void {
    if (value !== undefined) {
      this.maxPrepTime = value;
      this.menuService.updateFilters({ preparationTime: value });
    }
  }

  onSortChange(sortValue: string): void {
    this.selectedSort.set(sortValue);
    const [field, direction] = sortValue.split('-') as [string, 'asc' | 'desc'];
    this.menuService.updateSortOptions({ field: field as any, direction });
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategoryId = undefined;
    this.selectedStatus.set(undefined);
    this.priceRange = [0, this.maxPrice()];
    this.excludedAllergens.set([]);
    this.maxPrepTime = 30;
    this.menuService.clearFilters();
    this.menuService.selectCategory(undefined);
  }

  selectCategory(categoryId: string | null): void {
    this.onCategoryChange(categoryId);
  }

  getItemCountForCategory(categoryId: string): number {
    return this.menuService.menuItems().filter((item) => item.categoryId === categoryId).length;
  }

  onItemClick(item: MenuItem, event?: Event): void {
    event?.stopPropagation();
    this.itemSelected.emit(item);
  }

  onAddToCart(item: MenuItem, event?: Event): void {
    event?.stopPropagation();
    this.addToCart.emit(item);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  getStatusLabel(status: MenuItemStatus): string {
    switch (status) {
      case MenuItemStatus.OUT_OF_STOCK:
        return 'Out of Stock';
      case MenuItemStatus.DISCONTINUED:
        return 'Discontinued';
      case MenuItemStatus.SEASONAL:
        return 'Seasonal';
      default:
        return 'Available';
    }
  }

  getStatusSeverity(status: MenuItemStatus): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    switch (status) {
      case MenuItemStatus.OUT_OF_STOCK:
        return 'warn';
      case MenuItemStatus.DISCONTINUED:
        return 'danger';
      case MenuItemStatus.SEASONAL:
        return 'info';
      default:
        return 'success';
    }
  }

  truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
