import { User, Cafe, Order, Menu, Employee, Stock } from '@app/models';
import { args } from '../utils';
import { appendSortableObjects, SortOrderType } from '../utils/sort-order';

// Register all SortOrderTypes
SortOrderType(User, 'User');
SortOrderType(Cafe, 'Cafe');
SortOrderType(Order, 'Order');
SortOrderType(Menu, 'Menu');
SortOrderType(Employee, 'Employee');
SortOrderType(Stock, 'Stock');

// Append nested objects to orders
appendSortableObjects(User, 'User');
appendSortableObjects(Cafe, 'Cafe');
appendSortableObjects(Order, 'Order');
appendSortableObjects(Menu, 'Menu');
appendSortableObjects(Employee, 'Employee');
appendSortableObjects(Stock, 'Stock');

export const UserArgs = args<User>('User');
export const CafeArgs = args<Cafe>('Cafe');
export const OrderArgs = args<Order>('Order');
export const MenuArgs = args<Menu>('Menu');
export const EmployeeArgs = args<Employee>('Employee');
export const StockArgs = args<Stock>('Stock');
