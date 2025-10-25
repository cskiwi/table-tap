import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';

import { KitchenService } from '../../services/kitchen.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    ToggleSwitchModule,
    SelectModule,
    SliderModule,
    DividerModule,
    FloatLabelModule
  ],
  templateUrl: './settings-panel.component.html',
})
export class SettingsPanelComponent {
  @Input() embedded = false;
  @Output() close = new EventEmitter<void>()
  @Output() settingsChanged = new EventEmitter<any>()

  private readonly fb = inject(FormBuilder);
  private readonly kitchenService = inject(KitchenService);

  private readonly _hasChanges = signal(false);

  readonly settingsForm: FormGroup;
  readonly hasChanges = this._hasChanges.asReadonly()

  constructor() {
    const currentSettings = this.kitchenService.displaySettings()

    this.settingsForm = this.fb.group({
      showTimers: [currentSettings.showTimers],
      showNotes: [currentSettings.showNotes],
      showAllergies: [currentSettings.showAllergies],
      autoRefresh: [currentSettings.autoRefresh],
      refreshInterval: [currentSettings.refreshInterval],
      soundEnabled: [currentSettings.soundEnabled],
      vibrationEnabled: [currentSettings.vibrationEnabled],
      theme: [currentSettings.theme],
      fontSize: [currentSettings.fontSize],
      compactMode: [currentSettings.compactMode],
    });

    // Track changes
    this.settingsForm.valueChanges.subscribe(() => {
      this._hasChanges.set(this.settingsForm.dirty);

      // Auto-save in embedded mode
      if (this.embedded && this.settingsForm.valid) {
        this.saveSettings()
      }
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      const settings = this.settingsForm.value;
      this.kitchenService.updateDisplaySettings(settings);
      this.settingsChanged.emit(settings);
      this.settingsForm.markAsPristine()
      this._hasChanges.set(false);

      if (!this.embedded) {
        this.close.emit()
      }
    }
  }

  resetForm(): void {
    const currentSettings = this.kitchenService.displaySettings()
    this.settingsForm.reset(currentSettings);
    this._hasChanges.set(false);
  }

  resetToDefaults(): void {
    const defaultSettings = {
      showTimers: true,
      showNotes: true,
      showAllergies: true,
      autoRefresh: true,
      refreshInterval: 30,
      soundEnabled: true,
      vibrationEnabled: false,
      theme: 'light',
      fontSize: 'medium',
      compactMode: false,
    }

    this.settingsForm.reset(defaultSettings);
    this._hasChanges.set(true);
  }

  testSound(): void {
    this.kitchenService.playNotificationSound('new-order');
  }

  exportSettings(): void {
    const settings = this.settingsForm.value;
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'kitchen-display-settings.json';
    link.click()

    URL.revokeObjectURL(url);
  }

  importSettings(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event: any) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e: any) => {
          try {
            const settings = JSON.parse(e.target.result);
            this.settingsForm.patchValue(settings);
            this._hasChanges.set(true);
          } catch (error) {
            console.error('Failed to import settings:', error);
            // Show error message to user
          }
        }
        reader.readAsText(file);
      }
    }

    input.click()
  }

  clearCache(): void {
    // Clear local storage cache
    localStorage.removeItem('kitchen-display-settings');
    localStorage.removeItem('kitchen-orders-cache');
    localStorage.removeItem('kitchen-metrics-cache');

    // Refresh data
    this.kitchenService.refreshData()

    console.log('Cache cleared successfully');
  }

  formatSeconds(value: number): string {
    return `${value}s`;
  }
}