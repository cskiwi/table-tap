import { Component, computed, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DividerModule } from 'primeng/divider';

// Models
import { CartItem, CartItemCustomization, CustomizationOption, CustomizationType } from '../../models/cart.models';

interface CustomizationChangeEvent {
  itemId: string;
  customizations: CartItemCustomization[]
}

interface QuantityChangeEvent {
  itemId: string;
  quantity: number;
}

interface NotesChangeEvent {
  itemId: string;
  notes: string;
}

@Component({
  selector: 'tabletap-cart-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    TextareaModule,
    ChipModule,
    TagModule,
    TooltipModule,
    PopoverModule,
    CheckboxModule,
    RadioButtonModule,
    DividerModule,
  ],
  templateUrl: './cart-item.component.html',
})
export class CartItemComponent {
  readonly item = input.required<CartItem>();
  readonly disabled = input(false);
  readonly maxQuantity = input(10);

  readonly quantityChange = output<QuantityChangeEvent>();
  readonly customizationChange = output<CustomizationChangeEvent>();
  readonly notesChange = output<NotesChangeEvent>();
  readonly remove = output<string>();

  // Local state
  readonly showAllAllergens = signal(false);
  readonly editingNotes = signal(false);
  readonly showNotesEditor = signal(false);
  readonly editingCustomization = signal<CartItemCustomization | null>(null);

  // Form values
  quantityValue = 1;
  notesValue = '';
  selectedSingleOption = '';
  selectedMultiOptions: string[] = [];

  // Expose enum for template
  readonly CustomizationType = CustomizationType;

  ngOnInit(): void {
    this.quantityValue = this.item().quantity;
    this.notesValue = this.item().notes || '';
  }

  hasCustomizations(): boolean {
    const item = this.item();
    return item.customizations && item.customizations.length > 0;
  }

  getSelectedOptions(customization: CartItemCustomization): CustomizationOption[] {
    return customization.options?.filter(option => option.selected) || []
  }

  formatOptionLabel(option: CustomizationOption): string {
    const priceText = option.priceModifier !== 0
      ? ` (${option.priceModifier > 0 ? '+' : ''}$${Math.abs(option.priceModifier).toFixed(2)})`
      : '';
    return `${option.name}${priceText}`;
  }

  onQuantityChange(): void {
    const item = this.item();
    if (this.quantityValue !== item.quantity) {
      this.quantityChange.emit({
        itemId: item.id,
        quantity: this.quantityValue
      });
    }
  }

  startEditingNotes(): void {
    this.editingNotes.set(true);
    this.notesValue = this.item().notes || '';
  }

  saveNotes(): void {
    const trimmedNotes = this.notesValue.trim()
    const item = this.item();
    if (trimmedNotes !== (item.notes || '')) {
      this.notesChange.emit({
        itemId: item.id,
        notes: trimmedNotes
      });
    }
    this.editingNotes.set(false);
    this.showNotesEditor.set(false);
  }

  cancelNotesEdit(): void {
    this.notesValue = this.item().notes || '';
    this.editingNotes.set(false);
    this.showNotesEditor.set(false);
  }

  editCustomization(customization: CartItemCustomization): void {
    this.editingCustomization.set(customization);

    // Initialize selection values based on current selections
    if (customization.type === CustomizationType.SINGLE_SELECT) {
      const selectedOption = customization.options?.find(opt => opt.selected);
      this.selectedSingleOption = selectedOption?.id || '';
    } else if (customization.type === CustomizationType.MULTI_SELECT) {
      this.selectedMultiOptions = customization.options
        ?.filter(opt => opt.selected)
        .map(opt => opt.id) || [];
    }
  }

  saveCustomizationEdit(): void {
    const customization = this.editingCustomization()
    if (!customization) return;

    // Update the customization based on selections
    const updatedCustomization = { ...customization }

    if (customization.type === CustomizationType.SINGLE_SELECT) {
      updatedCustomization.options = customization.options?.map(option => ({
        ...option,
        selected: option.id === this.selectedSingleOption
      })) || [];
    } else if (customization.type === CustomizationType.MULTI_SELECT) {
      updatedCustomization.options = customization.options?.map(option => ({
        ...option,
        selected: this.selectedMultiOptions.includes(option.id)
      })) || [];
    }

    // Update the item's customizations
    const updatedCustomizations = this.item().customizations.map(c =>
      c.id === customization.id ? updatedCustomization : c
    );

    this.customizationChange.emit({
      itemId: this.item().id,
      customizations: updatedCustomizations
    });

    this.editingCustomization.set(null);
  }

  cancelCustomizationEdit(): void {
    this.editingCustomization.set(null);
    this.selectedSingleOption = '';
    this.selectedMultiOptions = [];
  }

  onRemove(): void {
    this.remove.emit(this.item().id);
  }

  toggleShowAllAllergens(): void {
    this.showAllAllergens.update(value => !value);
  }
}