import { bootstrapApplication } from '@angular/platform-browser';
import { ShellComponent } from '@app/frontend-components/shell';
import { config } from '../config/app.config.server';

const bootstrap = () => bootstrapApplication(ShellComponent, config);

export default bootstrap;
