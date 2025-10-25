import { InjectionToken } from '@angular/core';
import { ISeoConfig } from './interfaces';

export const SEO_CONFIG = new InjectionToken<ISeoConfig>('seo.config');
