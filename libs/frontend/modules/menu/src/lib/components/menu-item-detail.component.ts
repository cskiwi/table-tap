import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  signal,
  inject,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Components
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { RatingModule } from 'primeng/rating';

import { MenuService } from '../services/menu.service';
import {
  MenuItem,
  MenuItemStatus,
  MenuCustomization,
  MenuItemDetailOptions
} from '../types/menu.types';

interface CustomizationOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'dropdown' | 'text';
  required: boolean;
  options?: { label: string; value: string; price?: number }[]
  maxLength?: number;
  price?: number;
}

interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  servingSize?: string;
}

@Component({
  selector: 'app-menu-item-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    CardModule,
    ButtonModule,
    ImageModule,
    TagModule,
    DividerModule,
    InputNumberModule,
    TextareaModule,
    CheckboxModule,
    RadioButtonModule,
    SelectModule,
    TabsModule,
    AccordionModule,
    ChipModule,
    ProgressSpinnerModule,
    TooltipModule,
    MessageModule,
    RatingModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu-item-detail.component.html',
})
export class MenuItemDetailComponent implements OnInit, OnDestroy {
  readonly visible = input(false);
  readonly menuItem = input<MenuItem | null>(null);
  readonly displayOptions = input<MenuItemDetailOptions>({
    showFullDescription: true,
    showNutrition: true,
    showAllergens: true,
    showCustomizations: true,
});
  readonly enableSpecialRequests = input(true);
  readonly customizationOptions = input<CustomizationOption[]>([]);

  readonly close = output<void>();
  readonly addToOrder = output<MenuCustomization>();

  private readonly destroy$ = new Subject<void>()
  private readonly fb = inject(FormBuilder);
  readonly menuService = inject(MenuService);

  // Component state
  readonly loading = this.menuService.loading;
  readonly quantity = signal(1);
  readonly specialRequests = signal('');
  readonly activeTabIndex = signal('0');

  // Form for customizations
  customizationForm: FormGroup = this.fb.group({});
  quantityValue = 1;

  // Computed properties
  readonly nutritionalInfo = computed(() => {
    const info = this.menuItem()?.nutritionalInfo;
    return info ? info as NutritionalInfo : null;
  });

  ngOnInit(): void {
    this.initializeForm()
    this.quantity.set(1);
    this.specialRequests.set('');
    this.activeTabIndex.set('0');
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeForm(): void {
    const formControls: { [key: string]: any } = {};
    this.customizationOptions().forEach(option => {
      const validators = option.required ? [Validators.required] : []
      
      switch (option.type) {
        case 'radio':
        case 'dropdown': {
          formControls[option.id] = [null, validators]
          break;
        }
        case 'checkbox': {
          formControls[option.id] = [[], validators]
          break;
        }
        case 'text': {
          const textValidators = [...validators];
          if (option.maxLength) {
            textValidators.push(Validators.maxLength(option.maxLength));
          }
          formControls[option.id] = ['', textValidators]
          break;
        }
      }
    });

    this.customizationForm = this.fb.group(formControls);
  }

  onClose(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.close.emit()
    this.resetForm()
  }

  onAddToOrder(): void {
    const menuItem = this.menuItem();
    if (!menuItem || !this.isValidCustomization()) {
      return;
    }

    const customization: MenuCustomization = {
      itemId: menuItem.id,
      quantity: this.quantity(),
      notes: this.specialRequests(),
      customizations: this.customizationForm.value,
    }

    this.addToOrder.emit(customization);
    this.menuService.addToCart(customization);
    this.onClose()
  }

  increaseQuantity(): void {
    if (this.quantity() < 10) {
      this.quantity.update(q => q + 1);
      this.quantityValue = this.quantity()
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
      this.quantityValue = this.quantity()
    }
  }

  onQuantityChange(value: number | null): void {
    if (value && value >= 1 && value <= 10) {
      this.quantity.set(value);
    }
  }

  calculateTotal(): number {
    const menuItem = this.menuItem();
    if (!menuItem) return 0;
    const basePrice = menuItem.price;
    let customizationPrice = 0;

    // Add customization prices
    this.customizationOptions().forEach(option => {
      const value = this.customizationForm.get(option.id)?.value;
      
      if (option.type === 'checkbox' && Array.isArray(value)) {
        value.forEach((selectedValue: string) => {
          const choice = option.options?.find(opt => opt.value === selectedValue);
          if (choice?.price) {
            customizationPrice += choice.price;
          }
        });
      } else if (value) {
        const choice = option.options?.find(opt => opt.value === value);
        if (choice?.price) {
          customizationPrice += choice.price;
        } else if (option.price) {
          customizationPrice += option.price;
        }
      }
    });

    return (basePrice + customizationPrice) * this.quantity()
  }

  getUnitPrice(): number {
    if (!this.menuItem()) return 0;
    return this.calculateTotal() / this.quantity()
  }

  isValidCustomization(): boolean {
    return this.customizationForm.valid;
  }

  getCharacterCount(controlName: string): number {
    const control = this.customizationForm.get(controlName);
    return control?.value?.length || 0;
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

  getStatusSeverity(status: MenuItemStatus): "success" | "info" | "warn" | "secondary" | "contrast" | "danger" {
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

  getUnavailableSeverity(status: MenuItemStatus): "error" | "success" | "info" | "warn" | "secondary" | "contrast" {
    switch (status) {
      case MenuItemStatus.OUT_OF_STOCK:
        return 'warn';
      case MenuItemStatus.DISCONTINUED:
        return 'error';
      case MenuItemStatus.SEASONAL:
        return 'info';
      default:
        return 'info';
    }
  }

  getUnavailableMessage(status: MenuItemStatus): string {
    switch (status) {
      case MenuItemStatus.OUT_OF_STOCK:
        return 'This item is currently out of stock. Please check back later.';
      case MenuItemStatus.DISCONTINUED:
        return 'This item has been discontinued and is no longer available.';
      case MenuItemStatus.SEASONAL:
        return 'This is a seasonal item and may not be available year-round.';
      default:
        return 'This item is currently unavailable.';
    }
  }

  private resetForm(): void {
    this.customizationForm.reset()
    this.quantity.set(1);
    this.quantityValue = 1;
    this.specialRequests.set('');
    this.activeTabIndex.set('0');
  }
}