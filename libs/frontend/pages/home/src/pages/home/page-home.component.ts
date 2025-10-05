
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-page-home',
  imports: [CheckboxModule, ButtonModule],
  templateUrl: './page-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHomeComponent {}
