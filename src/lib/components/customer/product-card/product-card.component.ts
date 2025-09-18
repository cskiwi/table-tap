import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { CustomizationOption, OrderItem, Product, ProductCustomization, SelectedCustomization } from '../../../shared/interfaces';
import { RESTAURANT_TAILWIND_CLASSES } from '../../../shared/theme/restaurant-theme';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DialogModule,
    DividerModule,
    InputNumberModule,
    InputTextareaModule,
    RadioButtonModule,
    TagModule
  ],
  template: `
    <!-- Product Detail Dialog -->
    <p-dialog
      [visible]="visible()"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [maximizable]="false"
      styleClass="product-dialog"
      [style]="{ width: '90vw', maxWidth: '600px', maxHeight: '90vh' }"
      (onHide)="onDialogHide()"
    >
      <ng-template #header>
        <h2 class="text-xl font-semibold text-gray-800">{{ product().name }}</h2>
      </ng-template>
      
      <div class="overflow-y-auto max-h-[70vh]">
        <!-- Product Image -->
        @if (product().image) {
          <div class="relative mb-6">
            <img
              [src]="product().image"
              [alt]="product().name"
              class="w-full h-64 object-cover rounded-lg"
            />
            @if (product().tags.length > 0) {
              <div class="absolute top-3 left-3 flex flex-wrap gap-2">
                @for (tag of product().tags; track tag) {
                  <p-tag [value]="tag" severity="info" />
                }
              </div>
            }
          </div>
        }
        
        <!-- Product Info -->
        <div class="space-y-4">
          <!-- Description -->
          @if (product().description) {
            <p class="text-gray-600 leading-relaxed">{{ product().description }}</p>
          }
          
          <!-- Price and Time -->
          <div class="flex justify-between items-center py-3 border-t border-b border-gray-200">
            <div class="flex items-center space-x-4">
              <span class="text-2xl font-bold text-primary-600">
                {{ calculateTotalPrice() | currency:'EUR':'symbol':'1.2-2' }}
              </span>
              @if (hasCustomizations()) {
                <span class="text-sm text-gray-500">
                  {{ 'PRODUCT.BASE_PRICE' | translate }}: {{ product().price | currency:'EUR':'symbol':'1.2-2' }}
                </span>
              }
            </div>
            <div class="flex items-center text-gray-500">
              <i class="pi pi-clock mr-1"></i>
              <span class="text-sm">{{ product().preparationTimeMinutes }} {{ 'COMMON.MINUTES' | translate }}</span>
            </div>
          </div>
          
          <!-- Allergens -->
          @if (product().allergens.length > 0) {
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div class="flex items-center mb-2">
                <i class="pi pi-exclamation-triangle text-orange-500 mr-2"></i>
                <span class="font-medium text-orange-800">{{ 'PRODUCT.ALLERGEN_WARNING' | translate }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                @for (allergen of product().allergens; track allergen) {
                  <span class="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">{{ allergen }}</span>
                }
              </div>
            </div>
          }
          
          <!-- Nutritional Info -->
          @if (product().nutritionalInfo) {
            <div class="bg-gray-50 rounded-lg p-3">
              <h4 class="font-medium text-gray-800 mb-2">{{ 'PRODUCT.NUTRITIONAL_INFO' | translate }}</h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div class="text-center">
                  <div class="font-medium">{{ product().nutritionalInfo!.calories }}</div>
                  <div class="text-gray-500">{{ 'NUTRITION.CALORIES' | translate }}</div>
                </div>
                <div class="text-center">
                  <div class="font-medium">{{ product().nutritionalInfo!.protein }}g</div>
                  <div class="text-gray-500">{{ 'NUTRITION.PROTEIN' | translate }}</div>
                </div>
                <div class="text-center">
                  <div class="font-medium">{{ product().nutritionalInfo!.carbohydrates }}g</div>
                  <div class="text-gray-500">{{ 'NUTRITION.CARBS' | translate }}</div>
                </div>
                <div class="text-center">
                  <div class="font-medium">{{ product().nutritionalInfo!.fat }}g</div>
                  <div class="text-gray-500">{{ 'NUTRITION.FAT' | translate }}</div>
                </div>
              </div>
            </div>
          }
        </div>
        
        <!-- Customizations Form -->
        @if (hasCustomizations()) {
          <form [formGroup]="customizationForm" class="mt-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ 'PRODUCT.CUSTOMIZE_ORDER' | translate }}</h3>
            
            @for (customization of product().customizations; track customization.id; let i = $index) {
              <div class="mb-6 p-4 border border-gray-200 rounded-lg">
                <div class="flex justify-between items-center mb-3">
                  <h4 class="font-medium text-gray-800">{{ customization.name }}</h4>
                  @if (customization.required) {
                    <span class="text-red-500 text-sm">{{ 'COMMON.REQUIRED' | translate }}</span>
                  }
                </div>
                
                @switch (customization.type) {
                  @case ('size') {
                    <div class="space-y-2">
                      @for (option of customization.options; track option.id) {
                        <div class="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50">
                          <div class="flex items-center">
                            <input
                              type="radio"
                              [id]="'size_' + option.id"
                              [name]="'customization_' + customization.id"
                              [value]="option.id"
                              (change)="onCustomizationChange(customization, option)"
                              class="mr-3"
                            />
                            <label [for]="'size_' + option.id" class="font-medium cursor-pointer">{{ option.name }}</label>
                          </div>
                          @if (option.priceModifier !== 0) {
                            <span class="text-sm" [class.text-green-600]="option.priceModifier > 0" [class.text-red-600]="option.priceModifier < 0">
                              {{ option.priceModifier > 0 ? '+' : '' }}{{ option.priceModifier | currency:'EUR':'symbol':'1.2-2' }}
                            </span>
                          }
                        </div>
                      }
                    </div>
                  }
                  
                  @case ('addon') {
                    <div class="space-y-2">
                      @for (option of customization.options; track option.id) {
                        <div class="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50">
                          <div class="flex items-center">
                            <input
                              type="checkbox"
                              [id]="'addon_' + option.id"
                              [value]="option.id"
                              (change)="onAddonChange(customization, option, $event)"
                              class="mr-3"
                            />
                            <label [for]="'addon_' + option.id" class="font-medium cursor-pointer">{{ option.name }}</label>
                          </div>
                          @if (option.priceModifier !== 0) {
                            <span class="text-sm text-green-600">
                              +{{ option.priceModifier | currency:'EUR':'symbol':'1.2-2' }}
                            </span>
                          }
                        </div>
                      }
                    </div>
                  }
                  
                  @case ('option') {
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      @for (option of customization.options; track option.id) {
                        <button
                          type="button"
                          class="p-3 border rounded-lg text-left transition-colors"
                          [class.border-primary-500]="isOptionSelected(customization, option)"
                          [class.bg-primary-50]="isOptionSelected(customization, option)"
                          [class.border-gray-200]="!isOptionSelected(customization, option)"
                          (click)="onOptionToggle(customization, option)"
                        >
                          <div class="font-medium">{{ option.name }}</div>
                          @if (option.priceModifier !== 0) {
                            <div class="text-sm text-gray-500">
                              {{ option.priceModifier > 0 ? '+' : '' }}{{ option.priceModifier | currency:'EUR':'symbol':'1.2-2' }}
                            </div>
                          }
                        </button>
                      }
                    </div>
                  }
                }
              </div>
            }
            
            <!-- Special Instructions -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'PRODUCT.SPECIAL_INSTRUCTIONS' | translate }}
              </label>
              <textarea
                pInputTextarea
                formControlName="specialInstructions"
                [placeholder]="'PRODUCT.SPECIAL_INSTRUCTIONS_PLACEHOLDER' | translate"
                rows="3"
                class="w-full"
              ></textarea>
            </div>
          </form>
        }
        
        <!-- Quantity Selector -->
        <div class="flex items-center justify-between py-4 border-t border-gray-200">
          <span class="font-medium text-gray-800">{{ 'PRODUCT.QUANTITY' | translate }}</span>
          <div class="flex items-center space-x-3">
            <button
              pButton
              type="button"
              icon="pi pi-minus"
              class="p-button-rounded p-button-outlined"
              [disabled]="quantity() <= 1"
              (click)="decrementQuantity()"
            />
            <span class="text-xl font-semibold w-8 text-center">{{ quantity() }}</span>
            <button
              pButton
              type="button"
              icon="pi pi-plus"
              class="p-button-rounded p-button-outlined"
              [disabled]="quantity() >= 10"
              (click)="incrementQuantity()"
            />
          </div>
        </div>
      </div>
      
      <ng-template #footer>
        <div class="flex justify-between items-center w-full">
          <button
            pButton
            type="button"
            [label]="'COMMON.CANCEL' | translate"
            class="p-button-text"
            (click)="onCancel()"
          />
          <button
            pButton
            type="button"
            [label]="addToCartLabel()"
            icon="pi pi-shopping-cart"
            [class]="RESTAURANT_TAILWIND_CLASSES.button.primary"
            [disabled]="!isValidSelection()"
            (click)="onAddToCart()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep .product-dialog .p-dialog-content {
        padding: 1.5rem;
      }
      
      :host ::ng-deep .product-dialog .p-dialog-footer {
        padding: 1rem 1.5rem;
        background-color: #f9fafb;
        border-top: 1px solid #e5e7eb;
      }
      
      .customization-option {
        transition: all 0.2s ease;
      }
      
      .customization-option:hover {
        background-color: #f3f4f6;
      }
      
      .customization-option.selected {
        background-color: #dbeafe;
        border-color: #3b82f6;
      }
    `
  ]
})
export class ProductCardComponent {
  // Inputs
  product = input.required<Product>();
  visible = input<boolean>(false);
  
  // Outputs
  addToCart = output<OrderItem>();
  closed = output<void>();
  
  // Signals
  quantity = signal(1);
  selectedCustomizations = signal<SelectedCustomization[]>([]);
  
  // Form
  customizationForm: FormGroup;
  
  // Style classes
  protected readonly RESTAURANT_TAILWIND_CLASSES = RESTAURANT_TAILWIND_CLASSES;
  
  // Computed properties
  hasCustomizations = computed(() => this.product().customizations.length > 0);
  
  calculateTotalPrice = computed(() => {
    let total = this.product().price;
    
    // Add customization costs
    this.selectedCustomizations().forEach(customization => {
      total += customization.priceModifier;
    });
    
    return total * this.quantity();
  });
  
  addToCartLabel = computed(() => {
    const total = this.calculateTotalPrice();
    return `Add to Cart • ${total.toFixed(2)}€`;
  });
  
  constructor(private fb: FormBuilder) {
    this.customizationForm = this.fb.group({
      specialInstructions: [''],
      customizations: this.fb.array([])
    });
  }
  
  onDialogHide() {
    this.resetForm();
    this.closed.emit();
  }
  
  onCancel() {
    this.resetForm();
    this.closed.emit();
  }
  
  onAddToCart() {
    if (!this.isValidSelection()) return;
    
    const orderItem: OrderItem = {
      id: '', // Will be set by the service
      productId: this.product().id,
      product: this.product(),
      quantity: this.quantity(),
      unitPrice: this.product().price,
      totalPrice: this.calculateTotalPrice(),
      customizations: this.selectedCustomizations(),
      specialInstructions: this.customizationForm.get('specialInstructions')?.value || undefined,
      status: 'pending'
    };
    
    this.addToCart.emit(orderItem);
    this.resetForm();
    this.closed.emit();
  }
  
  incrementQuantity() {
    if (this.quantity() < 10) {
      this.quantity.update(q => q + 1);
    }
  }
  
  decrementQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }
  
  onCustomizationChange(customization: ProductCustomization, option: CustomizationOption) {
    this.selectedCustomizations.update(current => {
      // Remove any existing selection for this customization
      const filtered = current.filter(c => 
        !this.belongsToCustomization(c, customization)
      );
      
      // Add the new selection
      return [
        ...filtered,
        {
          customizationId: customization.id,
          optionId: option.id,
          name: `${customization.name}: ${option.name}`,
          priceModifier: option.priceModifier
        }
      ];
    });
  }
  
  onAddonChange(customization: ProductCustomization, option: CustomizationOption, event: Event) {
    const target = event.target as HTMLInputElement;
    
    this.selectedCustomizations.update(current => {
      if (target.checked) {
        // Add the addon
        return [
          ...current,
          {
            customizationId: customization.id,
            optionId: option.id,
            name: `${customization.name}: ${option.name}`,
            priceModifier: option.priceModifier
          }
        ];
      } else {
        // Remove the addon
        return current.filter(c => 
          !(c.customizationId === customization.id && c.optionId === option.id)
        );
      }
    });
  }
  
  onOptionToggle(customization: ProductCustomization, option: CustomizationOption) {
    this.selectedCustomizations.update(current => {
      const existing = current.find(c => 
        c.customizationId === customization.id && c.optionId === option.id
      );
      
      if (existing) {
        // Remove if already selected
        return current.filter(c => c !== existing);
      } else {
        // Add the option (allowing multiple selections if maxSelections > 1)
        const currentCount = current.filter(c => 
          this.belongsToCustomization(c, customization)
        ).length;
        
        if (currentCount < customization.maxSelections) {
          return [
            ...current,
            {
              customizationId: customization.id,
              optionId: option.id,
              name: `${customization.name}: ${option.name}`,
              priceModifier: option.priceModifier
            }
          ];
        }
        
        return current;
      }
    });
  }
  
  isOptionSelected(customization: ProductCustomization, option: CustomizationOption): boolean {
    return this.selectedCustomizations().some(c => 
      c.customizationId === customization.id && c.optionId === option.id
    );
  }
  
  isValidSelection(): boolean {
    // Check if all required customizations are selected
    return this.product().customizations.every(customization => {
      if (!customization.required) return true;
      
      return this.selectedCustomizations().some(c => 
        this.belongsToCustomization(c, customization)
      );
    });
  }
  
  private belongsToCustomization(selection: SelectedCustomization, customization: ProductCustomization): boolean {
    return selection.customizationId === customization.id;
  }
  
  private resetForm() {
    this.quantity.set(1);
    this.selectedCustomizations.set([]);
    this.customizationForm.reset();
  }
}
