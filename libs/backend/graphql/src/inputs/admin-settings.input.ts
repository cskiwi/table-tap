import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { AdminSettings } from '@app/models';

@InputType()
export class AdminSettingsUpdateInput extends PartialType(
  OmitType(AdminSettings, [
    'createdAt',
    'updatedAt',
    'workflowSettings',
    'reportingSettings',
    'displaySettings',
    'hasEmailNotifications',
    'hasSmsNotifications',
    'hasIntegrations',
    'effectiveTaxRate',
    'effectiveServiceCharge',
  ] as const),
  InputType,
) {}

@InputType()
export class AdminSettingsCreateInput extends PartialType(OmitType(AdminSettingsUpdateInput, ['id'] as const), InputType) {}
