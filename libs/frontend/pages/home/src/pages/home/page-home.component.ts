import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-page-home',
  imports: [CommonModule, CheckboxModule, ButtonModule],
  templateUrl: './page-home.component.html',
  styleUrl: './page-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHomeComponent {}
