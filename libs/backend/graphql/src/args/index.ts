import { User } from '@app/models';
import { args } from '../utils';
import { appendSortableObjects, SortOrderType } from '../utils/sort-order';

// Register all SortOrderTypes
SortOrderType(User, 'User');

// Append nested objects to orders
appendSortableObjects(User, 'User');

export const UserArgs = args<User>('User');
