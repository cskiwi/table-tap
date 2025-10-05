import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';

// Components
import { CartDisplayComponent } from './components/cart-display/cart-display.component';
import { CartItemComponent } from './components/cart-item/cart-item.component';
import { CartIconComponent } from './components/cart-icon/cart-icon.component';
import { OrderSummaryComponent } from './components/order-summary/order-summary.component';

// Services
import { CartService } from './services/cart.service';
import { CartStorageService } from './services/cart-storage.service';
import { CartValidationService } from './services/cart-validation.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    // PrimeNG
    ButtonModule,
    CardModule,
    BadgeModule,
    DividerModule,
    ScrollPanelModule,
    ToastModule,
    ConfirmDialogModule,
    SkeletonModule,
    InputNumberModule,
    TextareaModule,
    ChipModule,
    TagModule,
    TooltipModule,
    PopoverModule,
    CheckboxModule,
    RadioButtonModule,
    InputTextModule,
    MessageModule,
    MessageModule,
    ProgressBarModule,

    // Standalone Components
    CartDisplayComponent,
    CartItemComponent,
    CartIconComponent,
    OrderSummaryComponent
  ],
  exports: [
    // Export components for use in other modules
    CartDisplayComponent,
    CartItemComponent,
    CartIconComponent,
    OrderSummaryComponent
  ],
  providers: [
    // Services are already provided in root, but can be overridden here if needed
    CartService,
    CartStorageService,
    CartValidationService
  ],
})
export class CartModule {}