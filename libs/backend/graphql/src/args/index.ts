import { Player } from '@app/models';
import { args } from '../utils';
import { appendSortableObjects, SortOrderType } from '../utils/sort-order';

// Register all SortOrderTypes
SortOrderType(Player, 'Player');

// Append nested objects to orders
appendSortableObjects(Player, 'Player');

export const PlayerArgs = args<Player>('Player');
