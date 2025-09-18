# Wireframes - Table Tap Restaurant Ordering System

## 1. Customer Ordering Interface Wireframes

### Mobile Customer Interface

#### Landing Page (QR Code Scan Result)
```
┌─────────────────────────────────┐
│ [Logo] Restaurant Name     [🛒3]│
│ ─────────────────────────────── │
│                                 │
│ Welcome to Bella Vista!         │
│ Your table: #12                 │
│                                 │
│ [🔍 Search menu items...      ] │
│                                 │
│ Popular Items                   │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │🍕  │ │🍔  │ │🍜  │        │
│ │$12 │ │$15 │ │$18 │        │
│ └─────┘ └─────┘ └─────┘        │
│                                 │
│ Categories                      │
│ [🍕 Pizza] [🍔 Burgers]        │
│ [🥗 Salads] [🍰 Desserts]      │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📋] [❤️] [👤]            │
└─────────────────────────────────┘
```

#### Menu Category View
```
┌─────────────────────────────────┐
│ [←] Burgers              [🛒3] │
│ ─────────────────────────────── │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [🍔]   Classic Burger      │ │
│ │        Beef patty, lettuce │ │
│ │        tomato, onion       │ │
│ │        ⭐4.8 (234)    $12 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [🍔]   Bacon Cheeseburger  │ │
│ │        Double beef, bacon, │ │
│ │        cheddar cheese      │ │
│ │        ⭐4.9 (456)    $15 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [🍔]   Veggie Burger       │ │
│ │        Plant-based patty   │ │
│ │        avocado, sprouts    │ │
│ │        ⭐4.7 (123)    $14 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📋] [❤️] [👤]            │
└─────────────────────────────────┘
```

#### Item Detail Modal
```
┌─────────────────────────────────┐
│                           [✕]   │
│ ┌─────────────────────────────┐ │
│ │    [🍔 Image Gallery]      │ │
│ └─────────────────────────────┘ │
│                                 │
│ Classic Burger             $12  │
│ ⭐4.8 (234 reviews)            │
│                                 │
│ Juicy beef patty with fresh     │
│ lettuce, tomato, and onion      │
│                                 │
│ Customize:                      │
│ ┌─ Size ─────────────────────┐  │
│ │ ◉ Regular (+$0)            │  │
│ │ ○ Large (+$3)              │  │
│ └────────────────────────────┘  │
│                                 │
│ ┌─ Extras ───────────────────┐  │
│ │ ☐ Extra Cheese (+$1)       │  │
│ │ ☐ Bacon (+$2)              │  │
│ │ ☐ Avocado (+$1.50)         │  │
│ └────────────────────────────┘  │
│                                 │
│ Special Instructions:           │
│ [Text area for notes...]        │
│                                 │
│ Quantity: [-] 1 [+]             │
│                                 │
│ [Add to Cart - $12.00]          │
└─────────────────────────────────┘
```

#### Cart/Order Review
```
┌─────────────────────────────────┐
│ [←] Your Order            [🛒3] │
│ ─────────────────────────────── │
│                                 │
│ Table #12                       │
│                                 │
│ Order Items:                    │
│ ┌─────────────────────────────┐ │
│ │ Classic Burger         $12  │ │
│ │ • Regular size              │ │
│ │ • Extra cheese              │ │
│ │ Qty: 2           [-] [+]    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Chicken Caesar Salad   $11  │ │
│ │ • No croutons               │ │
│ │ Qty: 1           [-] [+]    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ──────────────────────────────  │
│ Subtotal:              $35.00   │
│ Tax:                   $2.80    │
│ Tip:     [15%] [18%] [20%]      │
│         [Custom] $6.30          │
│ ──────────────────────────────  │
│ Total:                 $44.10   │
│                                 │
│ [Continue to Payment]           │
└─────────────────────────────────┘
```

### Desktop Customer Interface

#### Desktop Menu Layout
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Restaurant Name                            [Search...] [🛒 Cart (3)] [👤] │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ ┌────────────┐ ┌─────────────────────────────────────────┐ ┌─────────────────┐ │
│ │ Categories │ │               Menu Items                │ │   Order Cart    │ │
│ │            │ │                                         │ │                 │ │
│ │ 🍕 Pizza   │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │ Table: #12      │ │
│ │ 🍔 Burgers │ │ │ [🍔]    │ │ [🍔]    │ │ [🍔]    │    │ │                 │ │
│ │ 🥗 Salads  │ │ │Classic  │ │Bacon    │ │Veggie   │    │ │ Items:          │ │
│ │ 🍜 Soups   │ │ │Burger   │ │Cheese   │ │Burger   │    │ │ ┌─────────────┐ │ │
│ │ 🍰 Desserts│ │ │$12 ⭐4.8│ │$15 ⭐4.9│ │$14 ⭐4.7│    │ │ │Classic      │ │ │
│ │ ☕ Drinks  │ │ └─────────┘ └─────────┘ └─────────┘    │ │ │Burger x2    │ │ │
│ │            │ │                                         │ │ │$24.00       │ │ │
│ │            │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │ └─────────────┘ │ │
│ │            │ │ │ [🍔]    │ │ [🍔]    │ │ [🍔]    │    │ │ ┌─────────────┐ │ │
│ │            │ │ │BBQ      │ │Fish     │ │Chicken  │    │ │ │Caesar       │ │ │
│ │            │ │ │Burger   │ │Burger   │ │Sandwich │    │ │ │Salad x1     │ │ │
│ │            │ │ │$16 ⭐4.6│ │$18 ⭐4.5│ │$13 ⭐4.7│    │ │ │$11.00       │ │ │
│ │            │ │ └─────────┘ └─────────┘ └─────────┘    │ │ └─────────────┘ │ │
│ └────────────┘ └─────────────────────────────────────────┘ │                 │ │
│                                                             │ ─────────────── │ │
│                                                             │ Subtotal: $35   │ │
│                                                             │ Tax: $2.80      │ │
│                                                             │ Tip: $6.30      │ │
│                                                             │ ─────────────── │ │
│                                                             │ Total: $44.10   │ │
│                                                             │                 │ │
│                                                             │ [Checkout]      │ │
│                                                             └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Counter/Kitchen Display System Wireframes

### Kitchen Display - Mobile/Tablet (Portrait)
```
┌─────────────────────────────────┐
│ Kitchen Display      [⚙️] [🔄] │
│ ─────────────────────────────── │
│                                 │
│ Active Orders (6)               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Order #1234    ⏱️ 00:05:23 │ │
│ │ Table: 12                   │ │
│ │ ─────────────────────────── │ │
│ │ • Classic Burger x2         │ │
│ │ • Caesar Salad x1           │ │
│ │ ─────────────────────────── │ │
│ │ Special: No onions          │ │
│ │ [In Progress] [Ready]       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Order #1235    ⏱️ 00:02:15 │ │
│ │ Table: 8                    │ │
│ │ ─────────────────────────── │ │
│ │ • Pizza Margherita x1       │ │
│ │ • Garlic Bread x1           │ │
│ │ ─────────────────────────── │ │
│ │ [Accept] [View Details]     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Order #1236    ⏱️ NEW       │ │
│ │ Takeout                     │ │
│ │ ─────────────────────────── │ │
│ │ • Veggie Burger x1          │ │
│ │ • French Fries x1           │ │
│ │ ─────────────────────────── │ │
│ │ ETA: 15 min                 │ │
│ │ [Accept] [View Details]     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Kitchen Display - Desktop/Large Screen
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Kitchen Display                     🕐 14:23 PM          [Settings] [Refresh]   │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│ │ New Orders  │ │ In Progress │ │ Ready       │ │ Completed   │                │
│ │ ─────────── │ │ ─────────── │ │ ─────────── │ │ ─────────── │                │
│ │             │ │             │ │             │ │             │                │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │                │
│ │ │Order    │ │ │ │Order    │ │ │ │Order    │ │ │ │Order    │ │                │
│ │ │#1234    │ │ │ │#1231    │ │ │ │#1229    │ │ │ │#1228    │ │                │
│ │ │⏱️5:23   │ │ │ │⏱️12:45  │ │ │ │⏱️18:30  │ │ │ │✅ Done  │ │                │
│ │ │Table 12 │ │ │ │Table 5  │ │ │ │Table 3  │ │ │ │Table 7  │ │                │
│ │ │         │ │ │ │         │ │ │ │🔔Ready  │ │ │ │         │ │                │
│ │ │• Burger │ │ │ │• Pizza  │ │ │ │• Salad  │ │ │ │• Pasta  │ │                │
│ │ │• Salad  │ │ │ │• Fries  │ │ │ │• Bread  │ │ │ │• Wine   │ │                │
│ │ │         │ │ │ │         │ │ │ │         │ │ │ │         │ │                │
│ │ │[Accept] │ │ │ │[Ready]  │ │ │ │[Served] │ │ │ │         │ │                │
│ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │                │
│ │             │ │             │ │             │ │             │                │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │             │ │ ┌─────────┐ │                │
│ │ │Order    │ │ │ │Order    │ │ │             │ │ │Order    │ │                │
│ │ │#1235    │ │ │ │#1232    │ │ │             │ │ │#1227    │ │                │
│ │ │⏱️2:15   │ │ │ │⏱️8:12   │ │ │             │ │ │✅ Done  │ │                │
│ │ │Table 8  │ │ │ │Takeout  │ │ │             │ │ │Table 2  │ │                │
│ │ │         │ │ │ │         │ │ │             │ │ │         │ │                │
│ │ │• Pizza  │ │ │ │• Burger │ │ │             │ │ │• Soup   │ │                │
│ │ │• Bread  │ │ │ │• Shake  │ │ │             │ │ │• Sandwich│ │                │
│ │ │         │ │ │ │         │ │ │             │ │ │         │ │                │
│ │ │[Accept] │ │ │ │[Ready]  │ │ │             │ │ │         │ │                │
│ │ └─────────┘ │ │ └─────────┘ │ │             │ │ └─────────┘ │                │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                                 │
│ Summary: 2 New • 3 In Progress • 1 Ready • 12 Completed Today                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Employee Management Dashboard

### Mobile Employee Dashboard
```
┌─────────────────────────────────┐
│ [☰] Employee Portal      [👤]   │
│ ─────────────────────────────── │
│                                 │
│ Welcome back, Sarah!            │
│ Today: Monday, Dec 18           │
│                                 │
│ Quick Stats                     │
│ ┌─────────────────────────────┐ │
│ │ Orders Served Today:     23 │ │
│ │ Average Order Time:   5:30  │ │
│ │ Customer Rating:       4.8  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Quick Actions                   │
│ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │ [📋]  │ │ [📊]  │ │ [⏰]  │  │
│ │Orders │ │Reports│ │Clock  │  │
│ │ View  │ │ View  │ │ In/Out│  │
│ └───────┘ └───────┘ └───────┘  │
│                                 │
│ Recent Activity                 │
│ ┌─────────────────────────────┐ │
│ │ 2:30 PM - Order #1234       │ │
│ │           Served to Table 5 │ │
│ │ 2:15 PM - Order #1233       │ │
│ │           Ready for pickup  │ │
│ │ 2:00 PM - Clocked in        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📋] [📊] [👤]            │
└─────────────────────────────────┘
```

### Desktop Employee Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Employee Management Portal                           Sarah Johnson   [Logout]   │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ ┌─────────────┐ ┌───────────────────────────────────────┐ ┌─────────────────┐   │
│ │ Navigation  │ │              Dashboard                │ │   Quick Stats   │   │
│ │             │ │                                       │ │                 │   │
│ │ 🏠 Overview │ │ Welcome back, Sarah!                  │ │ Today's Orders  │   │
│ │ 📋 Orders   │ │ Monday, December 18, 2023             │ │       23        │   │
│ │ 👥 Staff    │ │                                       │ │                 │   │
│ │ 📊 Reports  │ │ Performance Today:                    │ │ Avg Order Time  │   │
│ │ ⚙️ Settings │ │ ┌─────────────────────────────────┐   │ │     5:30        │   │
│ │ 🕐 Schedule │ │ │ Orders Served:           23     │   │ │                 │   │
│ │ 💰 Payroll  │ │ │ Average Order Time:      5:30   │   │ │ Customer Rating │   │
│ │             │ │ │ Customer Rating:         4.8 ⭐  │   │ │      4.8 ⭐      │   │
│ │             │ │ │ Tips Earned:            $45.20  │   │ │                 │   │
│ │             │ │ └─────────────────────────────────┘   │ │ Tips Today      │   │
│ │             │ │                                       │ │    $45.20       │   │
│ │             │ │ Recent Activity:                      │ │                 │   │
│ │             │ │ ┌─────────────────────────────────┐   │ └─────────────────┘   │
│ │             │ │ │ 2:30 PM - Order #1234 Served   │   │                     │   │
│ │             │ │ │ 2:15 PM - Order #1233 Ready    │   │ ┌─────────────────┐   │
│ │             │ │ │ 2:00 PM - Clocked In            │   │ │ Schedule Today  │   │
│ │             │ │ │ 1:45 PM - Break Ended           │   │ │                 │   │
│ │             │ │ └─────────────────────────────────┘   │ │ Shift: 9AM-5PM  │   │
│ │             │ │                                       │ │ Break: 1-1:30PM │   │
│ │             │ │ [View All Orders] [Clock Out]         │ │ Status: On Duty │   │
│ │             │ │                                       │ │                 │   │
│ └─────────────┘ └───────────────────────────────────────┘ │ [Request Time   │   │
│                                                             │  Off]           │   │
│                                                             └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4. Inventory Management Interface

### Mobile Inventory
```
┌─────────────────────────────────┐
│ [☰] Inventory            [🔍]   │
│ ─────────────────────────────── │
│                                 │
│ [🔄] [📊] [➕] [⚙️]             │
│                                 │
│ Stock Alerts (3)                │
│ ┌─────────────────────────────┐ │
│ │ ⚠️ Tomatoes - Low Stock     │ │
│ │    Current: 5 lbs           │ │
│ │    Reorder: 20 lbs          │ │
│ │    [Order Now]              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Categories                      │
│ ┌─────────┐ ┌─────────┐        │
│ │ 🥬      │ │ 🥩      │        │
│ │Produce  │ │ Meat    │        │
│ │ (23)    │ │ (12)    │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ ┌─────────┐ ┌─────────┐        │
│ │ 🧀      │ │ 🍞      │        │
│ │ Dairy   │ │ Bakery  │        │
│ │ (15)    │ │ (8)     │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ Recent Activity                 │
│ ┌─────────────────────────────┐ │
│ │ 2:00 PM - Received:         │ │
│ │           Ground Beef (10lb)│ │
│ │ 1:30 PM - Used:             │ │
│ │           Lettuce (2 heads) │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📦] [📊] [👤]            │
└─────────────────────────────────┘
```

### Desktop Inventory Management
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Inventory Management System                                    [Add Item] [⚙️] │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ ┌─────────────┐ ┌───────────────────────────────────────────────────────────┐   │
│ │ Categories  │ │                    Inventory Items                        │   │
│ │             │ │                                                           │   │
│ │ 🥬 Produce  │ │ [Search items...] [Filter: All] [Sort: Name ↑] [⚠️ Low Stock] │
│ │    (23)     │ │                                                           │   │
│ │ 🥩 Meat     │ │ ┌─────┬─────────────┬─────────┬─────────┬─────────┬─────┐ │   │
│ │    (12)     │ │ │Item │ Name        │ Current │ Min     │ Unit    │ Act │ │   │
│ │ 🧀 Dairy    │ │ ├─────┼─────────────┼─────────┼─────────┼─────────┼─────┤ │   │
│ │    (15)     │ │ │🍅   │ Tomatoes    │ 5 lbs   │ 10 lbs  │ lbs     │[⚠️]│ │   │
│ │ 🍞 Bakery   │ │ │🥬   │ Lettuce     │ 15 heads│ 8 heads │ heads   │[✅]│ │   │
│ │    (8)      │ │ │🧅   │ Onions      │ 20 lbs  │ 5 lbs   │ lbs     │[✅]│ │   │
│ │ 🥤 Beverages│ │ │🥩   │ Ground Beef │ 25 lbs  │ 10 lbs  │ lbs     │[✅]│ │   │
│ │    (18)     │ │ │🧀   │ Cheddar     │ 3 blocks│ 5 blocks│ blocks  │[⚠️]│ │   │
│ │ 🍳 Condiments│ │ │🍞   │ Burger Buns │ 2 dozens│ 5 dozens│ dozens  │[⚠️]│ │   │
│ │    (25)     │ │ └─────┴─────────────┴─────────┴─────────┴─────────┴─────┘ │   │
│ │             │ │                                                           │   │
│ │ All Items   │ │ Selected: 6 items                    [Bulk Actions ▼]    │   │
│ │ (101)       │ │                                                           │   │
│ └─────────────┘ └───────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                              Quick Actions                                  │ │
│ │                                                                             │ │
│ │ [📦 Receive Delivery] [📝 Manual Adjustment] [📊 Generate Report] [⚠️ Alerts]│ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ Recent Activity:                                                                │
│ 2:00 PM - Received: Ground Beef (10 lbs) • 1:30 PM - Adjustment: Lettuce (-2) │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5. Admin Configuration Panel

### Admin Dashboard - Mobile
```
┌─────────────────────────────────┐
│ [☰] Admin Portal         [👤]   │
│ ─────────────────────────────── │
│                                 │
│ System Overview                 │
│ ┌─────────────────────────────┐ │
│ │ Active Orders:          12  │ │
│ │ Staff Online:           8   │ │
│ │ Tables Available:       3   │ │
│ │ Revenue Today:     $1,250   │ │
│ └─────────────────────────────┘ │
│                                 │
│ Quick Admin                     │
│ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │ [📋]  │ │ [👥]  │ │ [⚙️]  │  │
│ │ Menu  │ │ Users │ │System │  │
│ │ Edit  │ │ Mgmt  │ │Config │  │
│ └───────┘ └───────┘ └───────┘  │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │ [📊]  │ │ [💰]  │ │ [🔧]  │  │
│ │Reports│ │Payment│ │Maint. │  │
│ │ View  │ │ Setup │ │ Mode  │  │
│ └───────┘ └───────┘ └───────┘  │
│                                 │
│ System Alerts                   │
│ ┌─────────────────────────────┐ │
│ │ ✅ All systems operational  │ │
│ │ ⚠️ Low stock: 3 items       │ │
│ │ 📊 Weekly report ready      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📊] [⚙️] [👤]            │
└─────────────────────────────────┘
```

### Desktop Admin Configuration
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Admin Configuration Portal                              Administrator [Logout]  │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ ┌─────────────┐ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Admin Menu  │ │                   System Configuration                      │ │
│ │             │ │                                                             │ │
│ │ 🏠 Dashboard│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ 📋 Menu Mgmt│ │ │ Business Info   │ │ Payment Systems │ │ Notification    │ │ │
│ │ 👥 Users    │ │ │                 │ │                 │ │ Settings        │ │ │
│ │ 🏪 Locations│ │ │ Restaurant Name │ │ ☑️ Credit Cards │ │                 │ │ │
│ │ 💰 Payments │ │ │ [Bella Vista]   │ │ ☑️ Mobile Pay   │ │ ☑️ SMS Alerts   │ │ │
│ │ 📊 Analytics│ │ │                 │ │ ☑️ Cash         │ │ ☑️ Email        │ │ │
│ │ ⚙️ Settings │ │ │ Address         │ │ ☐ Crypto        │ │ ☑️ Push         │ │ │
│ │ 🔧 Backup   │ │ │ [123 Main St]   │ │                 │ │ ☐ Voice Call    │ │ │
│ │ 📝 Logs     │ │ │                 │ │ Tax Rate        │ │                 │ │ │
│ │             │ │ │ Phone           │ │ [8.25%]         │ │ Order Updates   │ │ │
│ │             │ │ │ [(555)123-4567] │ │                 │ │ [Real-time]     │ │ │
│ │             │ │ │                 │ │ Tip Suggestions │ │                 │ │ │
│ │             │ │ │ Hours           │ │ [15%, 18%, 20%] │ │ Low Stock Alert │ │ │
│ │             │ │ │ Mon-Thu: 11-9   │ │                 │ │ [5 items]       │ │ │
│ │             │ │ │ Fri-Sat: 11-10  │ │ Service Fee     │ │                 │ │ │
│ │             │ │ │ Sun: 12-8       │ │ [2.5%]          │ │                 │ │ │
│ │             │ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │
│ │             │ │                                                             │ │
│ │             │ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │             │ │ │ Table Config    │ │ Menu Categories │ │ Staff Roles     │ │ │
│ │             │ │ │                 │ │                 │ │                 │ │ │
│ │             │ │ │ Total Tables: 20│ │ 🍕 Pizza (12)   │ │ 👑 Admin (2)    │ │ │
│ │             │ │ │ Available: 17   │ │ 🍔 Burgers (8)  │ │ 👥 Manager (3)  │ │ │
│ │             │ │ │ Reserved: 2     │ │ 🥗 Salads (6)   │ │ 👨‍🍳 Kitchen (5) │ │ │
│ │             │ │ │ Out of Order: 1 │ │ 🍰 Desserts (4) │ │ 👨‍💼 Server (12) │ │ │
│ │             │ │ │                 │ │ ☕ Beverages(15)│ │ 🧹 Cleaner (3)  │ │ │
│ │             │ │ │ [Manage Tables] │ │                 │ │                 │ │ │
│ │             │ │ │                 │ │ [Edit Menu]     │ │ [Manage Users]  │ │ │
│ │             │ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │
│ └─────────────┘ └─────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ System Status: ✅ Operational • Last Backup: 2 hours ago • Version: 2.1.4      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 6. Analytics Dashboard

### Mobile Analytics
```
┌─────────────────────────────────┐
│ [☰] Analytics            [📊]   │
│ ─────────────────────────────── │
│                                 │
│ [Today] [Week] [Month] [Year]   │
│                                 │
│ Revenue Summary                 │
│ ┌─────────────────────────────┐ │
│ │      Today's Sales          │ │
│ │        $1,247               │ │
│ │    ↑ +12% vs yesterday      │ │
│ └─────────────────────────────┘ │
│                                 │
│ Key Metrics                     │
│ ┌─────────┐ ┌─────────┐        │
│ │Orders   │ │Avg Order│        │
│ │   47    │ │ $26.52  │        │
│ │ ↑ +8%   │ │ ↑ +3%   │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ ┌─────────┐ ┌─────────┐        │
│ │Tables   │ │Wait Time│        │
│ │ 18/20   │ │ 12 min  │        │
│ │ 90%     │ │ ↓ -2min │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ Top Items Today                 │
│ ┌─────────────────────────────┐ │
│ │ 1. Classic Burger      (12) │ │
│ │ 2. Margherita Pizza    (9)  │ │
│ │ 3. Caesar Salad        (8)  │ │
│ │ 4. Fish & Chips        (6)  │ │
│ └─────────────────────────────┘ │
│                                 │
│ [View Full Report]              │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📋] [📊] [👤]            │
└─────────────────────────────────┘
```

### Desktop Analytics Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Analytics & Reporting Dashboard                        [Export] [Schedule] [⚙️] │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ Time Range: [Today ▼] [Last 7 Days ▼] [This Month ▼] [Custom Range]           │
│                                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Total Revenue   │ │ Orders Today    │ │ Average Order   │ │ Customer Rating │ │
│ │    $1,247       │ │       47        │ │     $26.52      │ │      4.8 ⭐      │ │
│ │  ↑ +12% ↑       │ │   ↑ +8% ↑       │ │   ↑ +3% ↑       │ │   ↑ +0.2 ↑      │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                                                 │
│ ┌───────────────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │          Revenue Trends               │ │        Order Status Overview       │ │
│ │                                       │ │                                     │ │
│ │  $1400 ┃                              │ │   ┌─────────────────────────────┐   │ │
│ │  $1200 ┃     ●                        │ │   │ 🟢 Completed:    42 (89%)   │   │ │
│ │  $1000 ┃   ●   ●                      │ │   │ 🟡 In Progress:   3 (6%)    │   │ │
│ │   $800 ┃ ●   ●   ●                    │ │   │ 🔴 Cancelled:     2 (4%)    │   │ │
│ │   $600 ┃       ●                      │ │   │ 🟠 Pending:       0 (0%)    │   │ │
│ │   $400 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━     │ │   └─────────────────────────────┘   │ │
│ │        Mon Tue Wed Thu Fri Sat Sun    │ │                                     │ │
│ └───────────────────────────────────────┘ └─────────────────────────────────────┘ │
│                                                                                 │
│ ┌───────────────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │         Top Menu Items                │ │         Peak Hours Analysis        │ │
│ │                                       │ │                                     │ │
│ │ 1. Classic Burger        12 orders    │ │  Orders ┃                          │ │
│ │    $144 revenue (11.5%)              │ │      8  ┃     ██                    │ │
│ │                                       │ │      6  ┃  ██ ██ ██                │ │
│ │ 2. Margherita Pizza       9 orders    │ │      4  ┃  ██ ██ ██ ██ ██          │ │
│ │    $153 revenue (12.3%)              │ │      2  ┃ ███ ██ ██ ██ ██ ██       │ │
│ │                                       │ │      0  ┗━━━━━━━━━━━━━━━━━━━━━━━━   │ │
│ │ 3. Caesar Salad           8 orders    │ │         11 12  1  2  3  4  5 PM    │ │
│ │    $96 revenue (7.7%)                │ │                                     │ │
│ │                                       │ │ Peak: 2:00 PM - 3:00 PM (8 orders)│ │
│ │ 4. Fish & Chips           6 orders    │ └─────────────────────────────────────┘ │
│ │    $108 revenue (8.7%)               │                                         │ │
│ │                                       │                                         │ │
│ │ [View Full Menu Report]               │                                         │ │
│ └───────────────────────────────────────┘                                         │ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7. Mobile App Interface (Capacitor)

### App Home Screen
```
┌─────────────────────────────────┐
│    ⚡ TableTap                   │
│ ─────────────────────────────── │
│                                 │
│ 📍 Near you                     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏪 Bella Vista Restaurant   │ │
│ │    ⭐4.8 • Italian • $$$    │ │
│ │    📍 0.3 miles away        │ │
│ │    ⏱️ 15 min wait          │ │
│ │                             │ │
│ │    [View Menu] [Directions] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏪 Mario's Pizzeria         │ │
│ │    ⭐4.6 • Pizza • $$       │ │
│ │    📍 0.5 miles away        │ │
│ │    ⏱️ 20 min wait          │ │
│ │                             │ │
│ │    [View Menu] [Directions] │ │
│ └─────────────────────────────┘ │
│                                 │
│ Recent Orders                   │
│ ┌─────────────────────────────┐ │
│ │ Bella Vista - Dec 15        │ │
│ │ Classic Burger, Caesar Salad│ │
│ │ $24.50 • ⭐5.0             │ │
│ │ [Reorder] [Rate]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📍] [🛒] [👤]            │
└─────────────────────────────────┘
```

### QR Code Scanner
```
┌─────────────────────────────────┐
│ [←] Scan QR Code          [💡]  │
│ ─────────────────────────────── │
│                                 │
│                                 │
│      ┌─────────────────────┐    │
│      │                     │    │
│      │  ┌───────────────┐  │    │
│      │  │               │  │    │
│      │  │   QR SCANNER  │  │    │
│      │  │               │  │    │
│      │  │     [📷]      │  │    │
│      │  │               │  │    │
│      │  └───────────────┘  │    │
│      │                     │    │
│      └─────────────────────┘    │
│                                 │
│                                 │
│ Point your camera at the QR     │
│ code on your table              │
│                                 │
│ [💡] Turn on flashlight         │
│ [📷] Upload from gallery        │
│ [⌨️] Enter table number         │
│                                 │
│ Need Help?                      │
│ • Ask staff for assistance      │
│ • Call restaurant directly      │
│                                 │
│ ─────────────────────────────── │
│ [🏠] [📍] [🛒] [👤]            │
└─────────────────────────────────┘
```

These wireframes provide a comprehensive foundation for implementing the restaurant ordering system interfaces across all platforms and user types. Each design prioritizes usability, efficiency, and accessibility while maintaining visual consistency throughout the system.