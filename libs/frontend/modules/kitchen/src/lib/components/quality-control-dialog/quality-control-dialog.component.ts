import { Component, Inject, signal, computed } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SliderModule } from 'primeng/slider';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { ListboxModule } from 'primeng/listbox';
import { ProgressBarModule } from 'primeng/progressbar';

import { Order } from '@app/models';
// Using native types for quality control data - no need for interfaces

export interface QualityControlDialogData {
  order: Order;
  orderItemId?: string;
}

export interface QualityControlDialogResult {
  orderId: string;
  orderItemId?: string;
  checklistItems: any[];
  overallScore: number;
  comments?: string;
  approved: boolean;
  rejectionReason?: string;
  // Additional fields for the result
}

@Component({
  selector: 'app-quality-control-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    CheckboxModule,
    RadioButtonModule,
    SliderModule,
    DividerModule,
    ChipModule,
    ListboxModule,
    ProgressBarModule
  ],
  templateUrl: './quality-control-dialog.component.html',
})
export class QualityControlDialogComponent {
  readonly qualityRatings = [
    {
      value: 5,
      label: 'Excellent',
      description: 'Exceeds expectations',
      icon: 'star',
      level: 'excellent',
    }
    {
      value: 4,
      label: 'Good',
      description: 'Meets standards',
      icon: 'thumb_up',
      level: 'good',
    }
    {
      value: 3,
      label: 'Acceptable',
      description: 'Minimum standards',
      icon: 'remove',
      level: 'acceptable',
    }
    {
      value: 2,
      label: 'Poor',
      description: 'Below standards',
      icon: 'thumb_down',
      level: 'poor',
    }
    {
      value: 1,
      label: 'Unacceptable',
      description: 'Major issues',
      icon: 'error',
      level: 'unacceptable',
  }
  ];
  readonly defaultChecklistItems: QualityCheckItem[] = [
    {
      id: '1',
      name: 'Temperature Check',
      description: 'Food is served at proper temperature (hot items hot, cold items cold)',
      passed: false,
      required: true,
    }
    {
      id: '2',
      name: 'Presentation',
      description: 'Food is properly plated and visually appealing',
      passed: false,
      required: true,
    }
    {
      id: '3',
      name: 'Portion Size',
      description: 'Portion meets standard size requirements',
      passed: false,
      required: true,
    }
    {
      id: '4',
      name: 'Freshness',
      description: 'Ingredients are fresh and properly prepared',
      passed: false,
      required: true,
    }
    {
      id: '5',
      name: 'Order Accuracy',
      description: 'Order matches customer specifications and customizations',
      passed: false,
      required: true,
    }
    {
      id: '6',
      name: 'Hygiene Standards',
      description: 'Food safety and hygiene protocols followed',
      passed: false,
      required: true,
    }
    {
      id: '7',
      name: 'Garnish & Sides',
      description: 'Appropriate garnishes and sides included',
      passed: false,
      required: false,
    }
    {
      id: '8',
      name: 'Packaging Quality',
      description: 'For takeaway: proper packaging and secure containers',
      passed: false,
      required: false,
  }
  ];
  readonly qualityForm: FormGroup;
  private readonly _qualityScore = signal(0);

  readonly qualityScore = this._qualityScore.asReadonly()

  readonly selectedItem = computed(() => {
    if (this.data.orderItemId) {
      return this.data.order.items.find(item => item.id === this.data.orderItemId);
    }
    return null;
  });

  get checklistItemsArray(): FormArray {
    return this.qualityForm.get('checklistItems') as FormArray;
  }

  constructor(
    private readonly fb: FormBuilder
  ) {
    this.qualityForm = this.fb.group({
      overallRating: [null, Validators.required],
      checklistItems: this.fb.array(;
        this.defaultChecklistItems.map(item =>
          this.fb.group({
            passed: [false],
            notes: [''],
          })
        )
      )
      comments: [''],
    });

    // Watch for changes to update the quality score
    this.qualityForm.valueChanges.subscribe(() => {
      this.updateQualityScore()
    });
  }

  getChecklistItem(index: number): QualityCheckItem {
    return this.defaultChecklistItems[index]
  }

  getCheckboxColor(index: number): string {
    const item = this.checklistItemsArray.at(index);
    const passed = item.get('passed')?.value;
    const required = this.getChecklistItem(index).required;

    if (required && !passed) return 'warn';
    return 'primary';
  }

  updateChecklistScore(): void {
    this.updateQualityScore()
  }

  updateQualityScore(): void {
    const score = this.calculateQualityScore()
    this._qualityScore.set(score);
  }

  calculateQualityScore(): number {
    const checklistScore = this.getChecklistScore()
    const overallRatingScore = this.getOverallRatingScore()

    // Weight: 70% checklist, 30% overall rating
    return Math.round((checklistScore * 0.7) + (overallRatingScore * 0.3));
  }

  getChecklistScore(): number {
    const items = this.checklistItemsArray.controls;
    const passedItems = items.filter(item => item.get('passed')?.value).length;

    if (items.length === 0) return 0;
    return Math.round((passedItems / items.length) * 100);
  }

  getOverallRatingScore(): number {
    const rating = this.qualityForm.get('overallRating')?.value;
    if (!rating) return 0;
    return (rating / 5) * 100;
  }

  getScoreClass(): string {
    const score = this.qualityScore()
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'acceptable';
    if (score >= 60) return 'poor';
    return 'unacceptable';
  }

  getScoreStatus(): string {
    const score = this.qualityScore()
    if (score >= 90) return 'Excellent Quality';
    if (score >= 80) return 'Good Quality';
    if (score >= 70) return 'Acceptable Quality';
    if (score >= 60) return 'Below Standards';
    return 'Unacceptable Quality';
  }

  getRecommendationClass(): string {
    const score = this.qualityScore()
    if (score >= 80) return 'approve';
    if (score >= 70) return 'conditional';
    return 'reject';
  }

  getRecommendationIcon(): string {
    const score = this.qualityScore()
    if (score >= 80) return 'check_circle';
    if (score >= 70) return 'warning';
    return 'error';
  }

  getRecommendationTitle(): string {
    const score = this.qualityScore()
    if (score >= 80) return 'Recommended: Approve';
    if (score >= 70) return 'Conditional Approval';
    return 'Recommended: Reject';
  }

  getRecommendationDescription(): string {
    const score = this.qualityScore()
    if (score >= 80) return 'Quality standards met. Safe to serve to customer.';
    if (score >= 70) return 'Minor issues detected. Consider if acceptable for service.';
    return 'Quality issues found. Order should be remade or rejected.';
  }

  shouldShowRejectButton(): boolean {
    return this.qualityScore() < 80;
  }

  canApprove(): boolean {
    // Check if all required checklist items are passed or have notes
    const requiredItems = this.checklistItemsArray.controls.filter((_, index) =>
      this.getChecklistItem(index).required
    );

    const allRequiredValid = requiredItems.every(item => {
      const passed = item.get('passed')?.value;
      const notes = item.get('notes')?.value;
      return passed || (notes && notes.trim().length > 0);
    });

    return this.qualityForm.get('overallRating')?.valid && allRequiredValid;
  }

  canReject(): boolean {
    // Can reject if overall rating is provided
    return this.qualityForm.get('overallRating')?.valid;
  }

  getApprovalButtonColor(): string {
    const score = this.qualityScore()
    if (score >= 80) return 'primary';
    if (score >= 70) return 'accent';
    return 'warn';
  }

  getApprovalIcon(): string {
    const score = this.qualityScore()
    if (score >= 80) return 'check_circle';
    if (score >= 70) return 'warning';
    return 'error';
  }

  getApprovalButtonText(): string {
    const score = this.qualityScore()
    if (score >= 80) return 'Approve Order';
    if (score >= 70) return 'Conditional Approval';
    return 'Force Approve';
  }

  onApprove(): void {
    if (this.canApprove()) {
      const result: QualityControlDialogResult = {
        orderId: this.data.order.id;
        orderItemId: this.data.orderItemId;
        checklistItems: this.checklistItemsArray.value.map((item: any, index: number) => ({
          ...this.getChecklistItem(index)
          passed: item.passed;
          notes: item.notes;
        }))
        overallScore: this.qualityScore()
        comments: this.qualityForm.get('comments')?.value;
        approved: true,
      }

      this.dialogRef.close(result);
    }
  }

  onReject(): void {
    if (this.canReject()) {
      const result: QualityControlDialogResult = {
        orderId: this.data.order.id;
        orderItemId: this.data.orderItemId;
        checklistItems: this.checklistItemsArray.value.map((item: any, index: number) => ({
          ...this.getChecklistItem(index)
          passed: item.passed;
          notes: item.notes;
        }))
        overallScore: this.qualityScore()
        comments: this.qualityForm.get('comments')?.value;
        approved: false,
        rejectionReason: this.generateRejectionReason()
      }

      this.dialogRef.close(result);
    }
  }

  private generateRejectionReason(): string {
    const failedItems = this.checklistItemsArray.controls
      .filter((item, index) => !item.get('passed')?.value && this.getChecklistItem(index).required)
      .map((_, index) => this.getChecklistItem(index).name);

    const overallRating = this.qualityForm.get('overallRating')?.value;
    const ratingText = this.qualityRatings.find(r => r.value === overallRating)?.label || 'Poor';

    let reason = `Quality control failed. Overall rating: ${ratingText}.`;

    if (failedItems.length > 0) {
      reason += ` Failed items: ${failedItems.join(', ')}.`;
    }

    return reason;
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}