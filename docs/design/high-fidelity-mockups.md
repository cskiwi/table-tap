# High-Fidelity Mockups - Table Tap Restaurant Ordering System

## Mockup Overview

This document presents detailed high-fidelity mockups with actual content, realistic data, and production-ready visual design for all interfaces in the Table Tap system.

## Color Implementation

### Primary Brand Colors
- **Primary Orange**: `#E67E22` (Warm, appetizing)
- **Primary Light**: `#F39C12` (Hover states)
- **Primary Dark**: `#D35400` (Active states)
- **Success Green**: `#27AE60` (Order completed)
- **Warning Yellow**: `#F1C40F` (Pending orders)
- **Danger Red**: `#E74C3C` (Cancelled/alerts)

## 1. Customer Ordering Interface - Mobile

### Landing Page (After QR Scan)
```
┌─────────────────────────────────┐
│ Bella Vista                🛒 2 │ #E67E22 header
│ ─────────────────────────────── │
│ 🍽️                             │
│ Welcome to Bella Vista!         │ #2C3E50 text
│ Authentic Italian Cuisine       │ #7F8C8D secondary
│                                 │
│ 📍 Table #12 • Patio Section   │ #3498DB location
│                                 │
│ [🔍 Search pizza, pasta...   ] │ #ECF0F1 background
│                                 │
│ 🔥 Popular Right Now            │ #E67E22 accent
│ ┌─────┬─────┬─────┬─────┐       │
│ │🍕   │🍝   │🥗   │🍷   │       │
│ │Marg │Carb │Caes │Chia │       │ Real menu items
│ │$18  │$22  │$14  │$8   │       │ Actual pricing
│ │⭐4.8│⭐4.9│⭐4.7│⭐4.6│       │ Real ratings
│ └─────┴─────┴─────┴─────┘       │
│                                 │
│ 📂 Menu Categories              │
│ ┌───────┬───────┬───────┐       │
│ │ 🍕    │ 🍝    │ 🥗    │       │
│ │Pizza  │Pasta  │Salads │       │ #FFFFFF cards
│ │(12)   │(8)    │(6)    │       │ #95A5A6 counts
│ └───────┴───────┴───────┘       │
│ ┌───────┬───────┬───────┐       │
│ │ 🍖    │ 🍰    │ ☕    │       │
│ │Mains  │Desert │Drinks │       │
│ │(15)   │(7)    │(18)   │       │
│ └───────┴───────┴───────┘       │
│                                 │
│ 💡 Try our Chef's Special:      │ #F39C12 highlight
│    Truffle Risotto - $28        │ #2C3E50 text
│    Limited time only!           │ #E74C3C
│                                 │
│ ─────────────────────────────── │ #BDC3C7 divider
│ [🏠][📋][❤️][👤]            │ #E67E22 active tab
└─────────────────────────────────┘
```

### Pizza Category View - Mobile
```
┌─────────────────────────────────┐
│ [←] 🍕 Artisan Pizzas    🛒 2   │ #E67E22 header
│ ─────────────────────────────── │
│ [🔥Hot] [🌱Veg] [🧀Classic]    │ Filter tags
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🍕    Margherita Classic    │ │ #FFFFFF card
│ │       Fresh mozzarella, ba- │ │ #7F8C8D description
│ │       sil, San Marzano to-  │ │
│ │       matoes, extra virgin  │ │
│ │       olive oil             │ │
│ │       ⭐4.8 (342) 👥 12+   │ │ #F1C40F stars
│ │       ⏱️ 12-15 min    $18  │ │ #27AE60 time
│ │                      [Add] │ │ #E67E22 button
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🍕    Quattro Stagioni     │ │
│ │       Ham, mushrooms, arti- │ │
│ │       chokes, olives, moz-  │ │
│ │       zarella on wood-fired │ │
│ │       thin crust            │ │
│ │       ⭐4.9 (287) 👥 8+    │ │
│ │       ⏱️ 14-18 min    $24  │ │
│ │                      [Add] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🍕 🌱 Truffle & Arugula    │ │ 🌱 = Vegetarian
│ │       Black truffle paste,  │ │
│ │       wild arugula, parm-   │ │
│ │       esan, truffle oil     │ │
│ │       ⭐4.7 (156) 👥 5+    │ │
│ │       ⏱️ 15-20 min    $28  │ │
│ │                      [Add] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │ Status indicators
│ │ 🍕    Prosciutto di Parma  │ │
│ │ ❌    Currently unavailable │ │ #E74C3C unavailable
│ │       18-month aged prosc-  │ │ #95A5A6 muted text
│ │       iutto, buffalo mozzar │ │
│ │       ⭐4.9 (423) 👥 20+   │ │
│ │       ⏱️ 16-20 min    $32  │ │
│ │                  [Notify]   │ │ #3498DB notify button
│ └─────────────────────────────┘ │
│                                 │
│ 💰 Current total: $18.00        │ Floating cart total
│ 🚚 Free delivery over $25       │ Promo messaging
└─────────────────────────────────┘
```

### Item Detail Modal - High Fidelity
```
┌─────────────────────────────────┐
│                           [✕]   │ #95A5A6 close
│ ┌─────────────────────────────┐ │
│ │    [High-res pizza image]   │ │ Actual food photography
│ │    with garnish & steam     │ │ Professional lighting
│ └─────────────────────────────┘ │
│                                 │
│ Margherita Classic        $18   │ #2C3E50 title, #E67E22 price
│ ⭐4.8 (342 reviews) 🔥Popular   │ #F1C40F stars, #E74C3C fire
│                                 │
│ Made with San Marzano tomatoes, │ #7F8C8D description
│ fresh buffalo mozzarella, and   │
│ hand-picked basil leaves.       │
│ Wood-fired for authentic flavor.│
│                                 │
│ 🌱 Vegetarian • 🌿 Gluten-Free  │ #27AE60 dietary tags
│    Crust Available              │
│                                 │
│ Customize Your Pizza:           │ #2C3E50 heading
│ ┌─ Size ─────────────────────┐  │
│ │ ◉ Personal 10" (+$0)       │  │ #E67E22 selected
│ │ ○ Medium 12" (+$4)         │  │
│ │ ○ Large 16" (+$8)          │  │
│ │ ○ Family 18" (+$12)        │  │
│ └────────────────────────────┘  │
│                                 │
│ ┌─ Extra Toppings ───────────┐  │
│ │ ☐ Extra Mozzarella (+$3)   │  │
│ │ ☐ Prosciutto (+$5)         │  │
│ │ ☐ Wild Mushrooms (+$4)     │  │
│ │ ☐ Fresh Arugula (+$2)      │  │
│ │ ☐ Truffle Oil (+$3)        │  │
│ └────────────────────────────┘  │
│                                 │
│ ┌─ Crust Options ────────────┐  │
│ │ ◉ Traditional Wood-Fired    │  │
│ │ ○ Thin & Crispy            │  │
│ │ ○ Gluten-Free (+$3)        │  │
│ └────────────────────────────┘  │
│                                 │
│ Special Instructions:           │
│ [Light sauce, well done crust]  │ #ECF0F1 textarea
│                                 │
│ Quantity: [－] 1 [＋]          │ #E67E22 quantity controls
│ ⏱️ Ready in 12-15 minutes       │ #27AE60 timing
│                                 │
│ [Add to Cart - $18.00] 🛒       │ #E67E22 CTA button
│                                 │
│ 📞 Questions? Call us!          │ #3498DB contact link
│ ⚡ Add to favorites             │ #F1C40F favorite option
└─────────────────────────────────┘
```

## 2. Desktop Customer Interface

### Full Desktop Menu Layout
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🍽️ Bella Vista Ristorante            [Search pasta, wine...] 🛒 Cart (2) [👤] │ #E67E22 brand
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ ┌─────────────┐ ┌───────────────────────────────────────────┐ ┌─────────────────┐│
│ │🏷️ Categories│ │                  Featured Menu             │ │   Your Order    ││
│ │             │ │                                           │ │                 ││
│ │🍕 Pizzas    │ │ ┌─────────┐┌─────────┐┌─────────┐         │ │ 📍 Table #12    ││
│ │   (12 items)│ │ │[Pizza   ]││[Pasta  ]││[Wine   ]│         │ │ 👤 Party of 4   ││
│ │🍝 Pasta     │ │ │Margherita││Carbonara││Chianti │         │ │                 ││
│ │   (8 items) │ │ │$18 ⭐4.8 ││$22 ⭐4.9││$8 ⭐4.6│         │ │ 🛒 Current Items││
│ │🥗 Salads    │ │ │[Add Cart]││[Add Cart]││[Add Cart]│         │ │ ┌─────────────┐ ││
│ │   (6 items) │ │ └─────────┘└─────────┘└─────────┘         │ │ │Margherita   │ ││
│ │🍖 Secondi   │ │                                           │ │ │Classic      │ ││
│ │   (15 items)│ │ 🔥 Chef's Recommendations                  │ │ │Personal size│ ││
│ │🍰 Dolci     │ │ ┌─────────┐┌─────────┐┌─────────┐         │ │ │Qty: 1  $18 │ ││
│ │   (7 items) │ │ │Osso Buco││Tiramisu ││Prosecco │         │ │ │[- Edit +]   │ ││
│ │☕ Beverages │ │ │$34 ⭐4.9 ││$9 ⭐4.8 ││$12 ⭐4.7│         │ │ └─────────────┘ ││
│ │   (18 items)│ │ │Milan-style││House-made││Valdobbia│         │ │ ┌─────────────┐ ││
│ │             │ │ │[Add Cart]││[Add Cart]││[Add Cart]│         │ │ │Caesar Salad │ ││
│ │📊 Popular   │ │ └─────────┘└─────────┘└─────────┘         │ │ │Extra parm   │ ││
│ │📈 New Items │ │                                           │ │ │Qty: 1  $14 │ ││
│ │🌱 Vegetarian│ │ 🏷️ Today's Specials (20% off wine!)       │ │ │[- Edit +]   │ ││
│ │🌿 Gluten-Free│ │ ┌─────────┐┌─────────┐┌─────────┐         │ │ └─────────────┘ ││
│ │             │ │ │Truffle  ││Burrata  ││Amarone  │         │ │                 ││
│ │🔍 Search:   │ │ │Risotto  ││Antipasto││della Vpl│         │ │ ─────────────── ││
│ │[           ]│ │ │$28 ⭐4.7││$16 ⭐4.8││$15 ⭐4.9│         │ │ Subtotal: $32   ││
│ │             │ │ │Limited! ││Fresh!   ││Special! │         │ │ Tax (8.5%): $2.72││
│ │🏷️ Filters:  │ │ │[Add Cart]││[Add Cart]││[Add Cart]│         │ │ Service: $4.80  ││
│ │💰 Under $15 │ │ └─────────┘└─────────┘└─────────┘         │ │ ─────────────── ││
│ │⚡ Quick (10m)│ │                                           │ │ 💳 Total: $39.52││
│ │🔥 Spicy     │ │ 💡 Pairing Suggestions:                   │ │                 ││
│ │             │ │    Wine pairings available for each dish  │ │ 📝 Special Notes││
│ │             │ │    Ask your server for recommendations!   │ │ [No onions...] ││
│ │             │ │                                           │ │                 ││
│ └─────────────┘ └───────────────────────────────────────────┘ │ [💳 Checkout]   ││
│                                                               │ [🛒 Keep Browse]││
│ 🏪 Bella Vista • Est. 1987 • ⭐4.8 (2,847 reviews) • €€€     │ [📞 Call Server]││
│ 📍 Via Roma 123, Milano • 📞 +39 02 1234567 • 🌐 bellavista.it└─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Kitchen Display System - High Fidelity

### Large Screen Kitchen Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🔥 Bella Vista Kitchen • Monday, Dec 18, 2023 • 7:23 PM    [⚙️Settings] [🔄]  │
│ ─────────────────────────────────────────────────────────────────────────────── │
│ 📊 Evening Stats: 47 orders • $1,247 revenue • 12 min avg time • 89% on-time   │
│                                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│ │🆕 New Orders│ │🔄 In Progress│ │✅ Ready      │ │📤 Completed │                │
│ │    (3)      │ │    (5)      │ │    (2)      │ │    (37)     │                │
│ │─────────────│ │─────────────│ │─────────────│ │─────────────│                │
│ │             │ │             │ │             │ │             │                │
│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│                │
│ ││Order #1247││ ││Order #1244││ ││Order #1242││ ││Order #1241││                │
│ ││⏰ 00:02:15││ ││⏰ 00:08:42││ ││⏰ 00:15:33││ ││✅ Done    ││                │
│ ││📍Table 12 ││ ││📍Table 8  ││ ││📍Table 15 ││ ││📍Table 3  ││                │
│ ││👥 4 guests ││ ││👥 2 guests ││ ││👥 6 guests ││ ││👥 2 guests ││                │
│ ││           ││ ││           ││ ││🔔READY    ││ ││📱Rated 5⭐││                │
│ ││• Margherta││ ││• Carbonara││ ││• Osso Buco││ ││• Tiramisu ││                │
│ ││  Personal ││ ││  Regular  ││ ││  Well-done││ ││  House-made││                │
│ ││• Caesar   ││ ││• Bruschtta││ ││• Chianti  ││ ││• Espresso ││                │
│ ││  No crtns ││ ││  Extra    ││ ││  Decanted ││ ││  Double   ││                │
│ ││           ││ ││• Wine Pair││ ││           ││ ││           ││                │
│ ││💰 $32     ││ ││💰 $45     ││ ││💰 $67     ││ ││💰 $23     ││                │
│ ││           ││ ││           ││ ││           ││ ││           ││                │
│ ││🏷️ VIP     ││ ││🌶️ ALLERGY ││ ││👑 REGULR  ││ ││💕 ANNIV   ││                │
│ ││[ACCEPT]   ││ ││[READY]    ││ ││[SERVED]   ││ ││           ││                │
│ │└───────────┘│ │└───────────┘│ │└───────────┘│ │└───────────┘│                │
│ │             │ │             │ │             │ │             │                │
│ │┌───────────┐│ │┌───────────┐│ │             │ │┌───────────┐│                │
│ ││Order #1248││ ││Order #1245││ │             │ ││Order #1240││                │
│ ││⏰ NEW     ││ ││⏰ 00:12:18││ │             │ ││✅ Done    ││                │
│ ││📱Takeout  ││ ││📍Table 22 ││ │             │ ││📱Delivery ││                │
│ ││🕐 8:00PM  ││ ││👥 8 guests ││ │             │ ││🏠2.3mi   ││                │
│ ││           ││ ││           ││ │             │ ││📱Rated 4⭐││                │
│ ││• Quattro  ││ ││• Lasagna  ││ │             │ ││• Pizza 4S ││                │
│ ││  Stagioni ││ ││  Classic  ││ │             │ ││  Large    ││                │
│ ││• Antipsto ││ ││• Garlic   ││ │             │ ││• Gelato   ││                │
│ ││  Mixed    ││ ││  Bread x2 ││ │             │ ││  Pistachio││                │
│ ││           ││ ││           ││ │             │ ││           ││                │
│ ││💰 $28     ││ ││💰 $38     ││ │             │ ││💰 $34     ││                │
│ ││           ││ ││           ││ │             │ ││           ││                │
│ ││📞 Customer││ ││⚠️ URGENT  ││ │             │ ││💡 GOOD TIP││                │
│ ││[ACCEPT]   ││ ││[READY]    ││ │             │ ││           ││                │
│ │└───────────┘│ │└───────────┘│ │             │ │└───────────┘│                │
│ │             │ │             │ │             │ │             │                │
│ │┌───────────┐│ │┌───────────┐│ │             │ │             │                │
│ ││Order #1249││ ││Order #1246││ │             │ │             │                │
│ ││⏰ NEW     ││ ││⏰ 00:05:27││ │             │ │             │                │
│ ││📍Table 7  ││ ││📍Bar Seat ││ │             │ │             │                │
│ ││👥 2 guests ││ ││👤 1 guest ││ │             │ │             │                │
│ ││🎂 BIRTHDAY││ ││🍷 Wine Flt││ │             │ │             │                │
│ ││• Special  ││ ││• Antipasto││ │             │ │             │                │
│ ││  Dessert  ││ ││  Plate    ││ │             │ │             │                │
│ ││• Prosecco ││ ││• Tasting  ││ │             │ │             │                │
│ ││  Bottle   ││ ││  Menu     ││ │             │ │             │                │
│ ││💰 $67     ││ ││💰 $45     ││ │             │ │             │                │
│ ││🎵 Play    ││ ││🍷 Sommeli ││ │             │ │             │                │
│ ││   Music   ││ ││   Recomm  ││ │             │ │             │                │
│ ││[ACCEPT]   ││ ││[READY]    ││ │             │ │             │                │
│ │└───────────┘│ │└───────────┘│ │             │ │             │                │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                                 │
│ ⚡ Quick Stats: Pizza Oven 89% | Pasta Station 76% | Grill 45% | Desserts 23%  │
│ 🎯 Tonight's Goals: 50 orders | $1,500 revenue | <10min avg | >95% satisfaction│
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4. Employee Dashboard - Mobile & Desktop

### Mobile Employee App Home
```
┌─────────────────────────────────┐
│ [☰] Hi Sarah! 👋          [👤] │ #E67E22 personalized greeting
│ ─────────────────────────────── │
│ Monday, December 18, 2023       │ #7F8C8D date
│ Evening Shift • Section: Patio  │ #3498DB shift info
│                                 │
│ 📊 Your Performance Today       │
│ ┌─────────────────────────────┐ │ #FFFFFF performance card
│ │ Tables Served: 23 🏆        │ │ #27AE60 achievement
│ │ Average Rating: 4.9⭐       │ │ #F1C40F rating
│ │ Tips Earned: $127.50        │ │ #27AE60 money
│ │ Order Accuracy: 97%         │ │ #27AE60 percentage
│ └─────────────────────────────┘ │
│                                 │
│ 🔔 Active Alerts (2)            │ #E74C3C alerts
│ ┌─────────────────────────────┐ │
│ │ ⚠️ Table 12: Needs refills  │ │ #F39C12 warning
│ │ 🍕 Kitchen: Pizza ready T8   │ │ #27AE60 food ready
│ └─────────────────────────────┘ │
│                                 │
│ 🎯 Quick Actions                │ #2C3E50 section header
│ ┌───────┬───────┬───────┐       │
│ │ [📋]  │ [⏰]  │ [💰]  │       │ #E67E22 action buttons
│ │Orders │Clock  │Tips   │       │
│ │  (5)  │ Out   │Today  │       │ #95A5A6 labels
│ └───────┴───────┴───────┘       │
│ ┌───────┬───────┬───────┐       │
│ │ [🍽️]  │ [📞]  │ [📊]  │       │
│ │Tables │Call   │Reports│       │
│ │ Map   │Mgr    │ View  │       │
│ └───────┴───────┴───────┘       │
│                                 │
│ 🕐 Your Schedule                │
│ ┌─────────────────────────────┐ │ #ECF0F1 schedule card
│ │ Today: 5:00 PM - 11:00 PM   │ │
│ │ Break: 8:00 PM - 8:30 PM    │ │ #3498DB break time
│ │ Tomorrow: OFF 🎉            │ │ #27AE60 day off
│ │                             │ │
│ │ [📅 Request Time Off]       │ │ #E67E22 button
│ └─────────────────────────────┘ │
│                                 │
│ 💬 Team Chat (3 new)           │ #95A5A6 chat
│ "Table 15 needs wine recommen-  │ Real team communication
│ dation for anniversary couple" │ Contextual messages
│ - Marco, Sommelier             │
│                                 │
│ ─────────────────────────────── │
│ [🏠][📋][💬][👤]            │ #E67E22 bottom nav
└─────────────────────────────────┘
```

## 5. Admin Configuration Panel

### Desktop Admin Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ Bella Vista Admin Portal • System Health: ✅ Excellent    Admin [Logout]    │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│ ┌─────────────┐ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎛️ Controls │ │                    System Overview                          │ │
│ │             │ │                                                             │ │
│ │🏠 Dashboard │ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │📋 Menu Mgmt │ │ │📊 Live Metrics  │ │🛒 Order Queue   │ │👥 Staff Status  │ │ │
│ │👥 Staff     │ │ │                 │ │                 │ │                 │ │ │
│ │🏢 Tables    │ │ │Active Orders: 8 │ │New: 3 orders    │ │On Duty: 12/15   │ │ │
│ │💳 Payments  │ │ │Avg Wait: 12min  │ │Prep: 5 orders   │ │Kitchen: 6/8     │ │ │
│ │📈 Analytics │ │ │Revenue: $1,247  │ │Ready: 2 orders  │ │Servers: 6/7     │ │ │
│ │⚙️ Settings  │ │ │Tables: 17/20    │ │Served: 37 today │ │On Break: 2      │ │ │
│ │🔧 Maintenance│ │ │Rating: 4.8⭐    │ │                 │ │Late: 0 👍       │ │ │
│ │📝 Logs      │ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │
│ │🔒 Security  │ │                                                             │ │
│ │💾 Backup    │ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │📊 Reports   │ │ │🚨 System Alerts │ │📈 Revenue Trend │ │🍕 Top Items     │ │ │
│ │             │ │ │                 │ │                 │ │                 │ │ │
│ │🔍 Quick:    │ │ │✅ All systems OK│ │Today: $1,247    │ │1. Margherita    │ │ │
│ │             │ │ │⚠️ Low: Parmesan │ │Week: $8,945     │ │2. Carbonara     │ │ │
│ │[Reset POS]  │ │ │⚠️ Printer B jam │ │Month: $34,892   │ │3. Tiramisu      │ │ │
│ │[Backup Now] │ │ │⚡ Peak hour soon│ │Quarter: $98K    │ │4. Prosecco      │ │ │
│ │[Staff Alert]│ │ │📊 Report ready  │ │📈 +12% vs last │ │5. Burrata       │ │ │
│ │             │ │ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │
│ │📅 Calendar: │ │                                                             │ │
│ │Dec 18, 2023 │ │ ┌───────────────────────────────────────────────────────┐   │ │
│ │Monday       │ │ │                    Quick Actions                      │   │ │
│ │Evening Rush │ │ │                                                       │   │ │
│ │             │ │ │[📋 View All Orders] [👥 Manage Staff] [💳 Process Tips]│   │ │
│ │🎯 Targets:  │ │ │[📊 Generate Report] [⚙️ System Settings] [🔧 Maintenance]│   │ │
│ │Revenue:     │ │ │[📞 Call Kitchen] [📧 Email Staff] [💾 Backup System]  │   │ │
│ │$1,500 (83%) │ │ │[🚨 Emergency Mode] [🎵 Background Music] [💡 Lighting]│   │ │
│ │Orders:      │ │ └───────────────────────────────────────────────────────┘   │ │
│ │50 (94%)     │ │                                                             │ │
│ │Satisfaction:│ │ 💡 Smart Insights:                                          │ │
│ │95% (98%)    │ │ • Peak dinner rush expected at 8:30 PM (+15 orders)        │ │
│ │             │ │ • Recommend pre-prep: Extra pizza dough, Caesar salads      │ │
│ │🏆 Today's   │ │ • Table 12 is VIP customer - last visit rated 5⭐          │ │
│ │   Heroes:   │ │ • Weather forecast: Clear - patio bookings likely ↑        │ │
│ │• Sarah (5⭐)│ │ • Inventory alert: Order parmesan by Thursday               │ │
│ │• Marco (Som)│ │                                                             │ │
│ │• Team Kit   │ │                                                             │ │
│ └─────────────┘ └─────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ 📍 Bella Vista Ristorante • Via Roma 123, Milano • Licensed Capacity: 85      │
│ 🕐 Current Time: 7:23 PM • Next Backup: 11:00 PM • System Version: 2.1.4      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

This comprehensive set of high-fidelity mockups provides realistic, production-ready designs with actual content, proper color usage, and detailed interaction states. Each interface demonstrates the complete user experience with real data, appropriate typography, and consistent branding throughout the Table Tap restaurant ordering system.