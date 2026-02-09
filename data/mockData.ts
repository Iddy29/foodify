// Mock data layer for Foodify app
// Easily replaceable with a real backend in the future

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  ingredients: string[];
  sizes: { name: string; price: number }[];
  popular?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  distance: string;
  cuisine: string[];
  priceRange: string;
  address: string;
  description: string;
  featured?: boolean;
  menu: MenuItem[];
  menuCategories: string[];
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  selectedSize: { name: string; price: number };
  specialInstructions: string;
  restaurantId: string;
  restaurantName: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  status: 'received' | 'preparing' | 'on_the_way' | 'arrived';
  restaurantName: string;
  createdAt: string;
  estimatedDelivery: string;
  deliveryAddress: string;
  paymentMethod: string;
}

export const categories: Category[] = [
  { id: '1', name: 'Pizza', icon: '🍕' },
  { id: '2', name: 'Sushi', icon: '🍣' },
  { id: '3', name: 'Burgers', icon: '🍔' },
  { id: '4', name: 'Healthy', icon: '🥗' },
  { id: '5', name: 'Pasta', icon: '🍝' },
  { id: '6', name: 'Desserts', icon: '🍰' },
  { id: '7', name: 'Mexican', icon: '🌮' },
  { id: '8', name: 'Asian', icon: '🥡' },
  { id: '9', name: 'Indian', icon: '🍛' },
  { id: '10', name: 'Seafood', icon: '🦐' },
];

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Bella Italia',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
    rating: 4.7,
    reviewCount: 324,
    deliveryTime: '25-35 min',
    deliveryFee: 2.99,
    distance: '1.2 miles',
    cuisine: ['Italian', 'Pizza', 'Pasta'],
    priceRange: '$$',
    address: '123 Italian Ave, Downtown',
    description: 'Authentic Italian cuisine with handmade pasta and wood-fired pizzas. Family recipes passed down through generations.',
    featured: true,
    menuCategories: ['Appetizers', 'Pizza', 'Pasta', 'Desserts', 'Drinks'],
    menu: [
      {
        id: 'm1',
        name: 'Bruschetta',
        description: 'Diced tomatoes, fresh basil, garlic, and extra virgin olive oil on toasted ciabatta bread.',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop',
        category: 'Appetizers',
        ingredients: ['Tomatoes', 'Basil', 'Garlic', 'Olive Oil', 'Ciabatta Bread'],
        sizes: [
          { name: 'Small', price: 9.99 },
          { name: 'Medium', price: 12.99 },
          { name: 'Large', price: 15.99 },
        ],
      },
      {
        id: 'm2',
        name: 'Calamari Fritti',
        description: 'Crispy fried calamari served with marinara sauce and lemon wedges.',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
        category: 'Appetizers',
        ingredients: ['Calamari', 'Flour', 'Marinara Sauce', 'Lemon'],
        sizes: [
          { name: 'Small', price: 12.99 },
          { name: 'Medium', price: 16.99 },
          { name: 'Large', price: 19.99 },
        ],
      },
      {
        id: 'm3',
        name: 'Margarita Pizza',
        description: 'Classic pizza with fresh basil, mozzarella, and tomato sauce on our signature thin crust.',
        price: 14.99,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
        category: 'Pizza',
        ingredients: ['Mozzarella', 'Fresh Basil', 'Tomato Sauce', 'Olive Oil'],
        sizes: [
          { name: 'Small', price: 11.99 },
          { name: 'Medium', price: 14.99 },
          { name: 'Large', price: 18.99 },
        ],
        popular: true,
      },
      {
        id: 'm4',
        name: 'Pepperoni Pizza',
        description: 'Loaded with premium pepperoni, mozzarella cheese, and our signature tomato sauce.',
        price: 15.99,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
        category: 'Pizza',
        ingredients: ['Pepperoni', 'Mozzarella', 'Tomato Sauce'],
        sizes: [
          { name: 'Small', price: 12.99 },
          { name: 'Medium', price: 15.99 },
          { name: 'Large', price: 19.99 },
        ],
        popular: true,
      },
      {
        id: 'm5',
        name: 'Quattro Formaggi',
        description: 'Four cheese pizza with mozzarella, gorgonzola, parmesan, and fontina.',
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
        category: 'Pizza',
        ingredients: ['Mozzarella', 'Gorgonzola', 'Parmesan', 'Fontina'],
        sizes: [
          { name: 'Small', price: 13.99 },
          { name: 'Medium', price: 16.99 },
          { name: 'Large', price: 20.99 },
        ],
      },
      {
        id: 'm6',
        name: 'Spaghetti Carbonara',
        description: 'Traditional carbonara with pancetta, egg, parmesan, and black pepper.',
        price: 15.99,
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
        category: 'Pasta',
        ingredients: ['Spaghetti', 'Pancetta', 'Egg', 'Parmesan', 'Black Pepper'],
        sizes: [
          { name: 'Small', price: 12.99 },
          { name: 'Medium', price: 15.99 },
          { name: 'Large', price: 18.99 },
        ],
        popular: true,
      },
      {
        id: 'm7',
        name: 'Fettuccine Alfredo',
        description: 'Creamy alfredo sauce with freshly made fettuccine pasta and parmesan.',
        price: 14.99,
        image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&h=300&fit=crop',
        category: 'Pasta',
        ingredients: ['Fettuccine', 'Cream', 'Butter', 'Parmesan', 'Garlic'],
        sizes: [
          { name: 'Small', price: 11.99 },
          { name: 'Medium', price: 14.99 },
          { name: 'Large', price: 17.99 },
        ],
      },
      {
        id: 'm8',
        name: 'Tiramisu',
        description: 'Classic Italian dessert with espresso-soaked ladyfingers, mascarpone cream, and cocoa.',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
        category: 'Desserts',
        ingredients: ['Mascarpone', 'Espresso', 'Ladyfingers', 'Cocoa', 'Eggs'],
        sizes: [
          { name: 'Small', price: 8.99 },
          { name: 'Medium', price: 11.99 },
          { name: 'Large', price: 14.99 },
        ],
      },
      {
        id: 'm9',
        name: 'Panna Cotta',
        description: 'Silky vanilla panna cotta topped with fresh berry compote.',
        price: 7.99,
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
        category: 'Desserts',
        ingredients: ['Cream', 'Vanilla', 'Sugar', 'Gelatin', 'Berries'],
        sizes: [
          { name: 'Small', price: 7.99 },
          { name: 'Medium', price: 10.99 },
          { name: 'Large', price: 13.99 },
        ],
      },
      {
        id: 'm10',
        name: 'Italian Soda',
        description: 'Refreshing sparkling water with your choice of flavored syrup.',
        price: 4.99,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&h=300&fit=crop',
        category: 'Drinks',
        ingredients: ['Sparkling Water', 'Flavored Syrup', 'Ice'],
        sizes: [
          { name: 'Small', price: 4.99 },
          { name: 'Medium', price: 5.99 },
          { name: 'Large', price: 6.99 },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Burger Joint',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 512,
    deliveryTime: '25-35 min',
    deliveryFee: 1.99,
    distance: '0.8 miles',
    cuisine: ['American', 'Burgers', 'Fast Food'],
    priceRange: '$$',
    address: '456 Burger Blvd, Midtown',
    description: 'Premium handcrafted burgers made with 100% Angus beef. Crispy fries and creamy shakes complete the experience.',
    featured: true,
    menuCategories: ['Burgers', 'Sides', 'Drinks', 'Desserts'],
    menu: [
      {
        id: 'b1',
        name: 'Classic Smash Burger',
        description: 'Double smashed patties with American cheese, pickles, onions, and special sauce.',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
        category: 'Burgers',
        ingredients: ['Angus Beef', 'American Cheese', 'Pickles', 'Onions', 'Special Sauce', 'Brioche Bun'],
        sizes: [
          { name: 'Small', price: 9.99 },
          { name: 'Medium', price: 12.99 },
          { name: 'Large', price: 15.99 },
        ],
        popular: true,
      },
      {
        id: 'b2',
        name: 'BBQ Bacon Burger',
        description: 'Juicy patty topped with crispy bacon, cheddar cheese, onion rings, and smoky BBQ sauce.',
        price: 14.99,
        image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
        category: 'Burgers',
        ingredients: ['Angus Beef', 'Bacon', 'Cheddar', 'Onion Rings', 'BBQ Sauce'],
        sizes: [
          { name: 'Small', price: 11.99 },
          { name: 'Medium', price: 14.99 },
          { name: 'Large', price: 17.99 },
        ],
        popular: true,
      },
      {
        id: 'b3',
        name: 'Mushroom Swiss Burger',
        description: 'Topped with sautéed mushrooms, Swiss cheese, and garlic aioli.',
        price: 13.99,
        image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop',
        category: 'Burgers',
        ingredients: ['Angus Beef', 'Swiss Cheese', 'Mushrooms', 'Garlic Aioli'],
        sizes: [
          { name: 'Small', price: 10.99 },
          { name: 'Medium', price: 13.99 },
          { name: 'Large', price: 16.99 },
        ],
      },
      {
        id: 'b4',
        name: 'Truffle Fries',
        description: 'Crispy golden fries tossed in truffle oil and parmesan cheese.',
        price: 7.99,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
        category: 'Sides',
        ingredients: ['Potatoes', 'Truffle Oil', 'Parmesan', 'Sea Salt'],
        sizes: [
          { name: 'Small', price: 5.99 },
          { name: 'Medium', price: 7.99 },
          { name: 'Large', price: 9.99 },
        ],
      },
      {
        id: 'b5',
        name: 'Onion Rings',
        description: 'Beer-battered onion rings served with ranch dressing.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
        category: 'Sides',
        ingredients: ['Onions', 'Beer Batter', 'Ranch Dressing'],
        sizes: [
          { name: 'Small', price: 4.99 },
          { name: 'Medium', price: 6.99 },
          { name: 'Large', price: 8.99 },
        ],
      },
      {
        id: 'b6',
        name: 'Chocolate Milkshake',
        description: 'Thick and creamy chocolate milkshake made with premium ice cream.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
        category: 'Drinks',
        ingredients: ['Chocolate Ice Cream', 'Milk', 'Whipped Cream'],
        sizes: [
          { name: 'Small', price: 5.99 },
          { name: 'Medium', price: 6.99 },
          { name: 'Large', price: 8.99 },
        ],
      },
      {
        id: 'b7',
        name: 'Cookie Dough Sundae',
        description: 'Vanilla ice cream topped with cookie dough chunks, hot fudge, and whipped cream.',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
        category: 'Desserts',
        ingredients: ['Vanilla Ice Cream', 'Cookie Dough', 'Hot Fudge', 'Whipped Cream'],
        sizes: [
          { name: 'Small', price: 6.99 },
          { name: 'Medium', price: 8.99 },
          { name: 'Large', price: 11.99 },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'Sakura Sushi',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 287,
    deliveryTime: '30-40 min',
    deliveryFee: 3.99,
    distance: '2.1 miles',
    cuisine: ['Japanese', 'Sushi', 'Asian'],
    priceRange: '$$$',
    address: '789 Sakura Lane, East Side',
    description: 'Premium sushi and Japanese cuisine prepared by master chefs. Fresh fish delivered daily from Tsukiji market.',
    featured: true,
    menuCategories: ['Sushi Rolls', 'Sashimi', 'Ramen', 'Sides', 'Drinks'],
    menu: [
      {
        id: 's1',
        name: 'Dragon Roll',
        description: 'Shrimp tempura inside, topped with avocado, eel, and unagi sauce.',
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop',
        category: 'Sushi Rolls',
        ingredients: ['Shrimp Tempura', 'Avocado', 'Eel', 'Unagi Sauce', 'Rice', 'Nori'],
        sizes: [
          { name: 'Small', price: 12.99 },
          { name: 'Medium', price: 16.99 },
          { name: 'Large', price: 21.99 },
        ],
        popular: true,
      },
      {
        id: 's2',
        name: 'Rainbow Roll',
        description: 'California roll topped with assorted sashimi and avocado slices.',
        price: 18.99,
        image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=300&fit=crop',
        category: 'Sushi Rolls',
        ingredients: ['Salmon', 'Tuna', 'Shrimp', 'Avocado', 'Crab', 'Rice', 'Nori'],
        sizes: [
          { name: 'Small', price: 14.99 },
          { name: 'Medium', price: 18.99 },
          { name: 'Large', price: 23.99 },
        ],
        popular: true,
      },
      {
        id: 's3',
        name: 'Spicy Tuna Roll',
        description: 'Fresh tuna mixed with spicy mayo, topped with sriracha and tempura flakes.',
        price: 14.99,
        image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&h=300&fit=crop',
        category: 'Sushi Rolls',
        ingredients: ['Tuna', 'Spicy Mayo', 'Sriracha', 'Tempura Flakes', 'Rice', 'Nori'],
        sizes: [
          { name: 'Small', price: 11.99 },
          { name: 'Medium', price: 14.99 },
          { name: 'Large', price: 18.99 },
        ],
      },
      {
        id: 's4',
        name: 'Salmon Sashimi',
        description: 'Premium fresh salmon sliced to perfection. Served with wasabi and pickled ginger.',
        price: 15.99,
        image: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400&h=300&fit=crop',
        category: 'Sashimi',
        ingredients: ['Premium Salmon', 'Wasabi', 'Pickled Ginger', 'Soy Sauce'],
        sizes: [
          { name: 'Small', price: 12.99 },
          { name: 'Medium', price: 15.99 },
          { name: 'Large', price: 21.99 },
        ],
      },
      {
        id: 's5',
        name: 'Tonkotsu Ramen',
        description: 'Rich pork bone broth with chashu pork, soft-boiled egg, and fresh noodles.',
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
        category: 'Ramen',
        ingredients: ['Pork Bone Broth', 'Chashu Pork', 'Soft-Boiled Egg', 'Noodles', 'Green Onion', 'Nori'],
        sizes: [
          { name: 'Small', price: 13.99 },
          { name: 'Medium', price: 16.99 },
          { name: 'Large', price: 19.99 },
        ],
        popular: true,
      },
      {
        id: 's6',
        name: 'Miso Soup',
        description: 'Traditional miso soup with tofu, seaweed, and green onions.',
        price: 4.99,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
        category: 'Sides',
        ingredients: ['Miso Paste', 'Tofu', 'Seaweed', 'Green Onions'],
        sizes: [
          { name: 'Small', price: 4.99 },
          { name: 'Medium', price: 6.99 },
          { name: 'Large', price: 8.99 },
        ],
      },
      {
        id: 's7',
        name: 'Green Tea',
        description: 'Premium Japanese green tea served hot or iced.',
        price: 3.99,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&h=300&fit=crop',
        category: 'Drinks',
        ingredients: ['Green Tea Leaves', 'Hot Water'],
        sizes: [
          { name: 'Small', price: 3.99 },
          { name: 'Medium', price: 4.99 },
          { name: 'Large', price: 5.99 },
        ],
      },
    ],
  },
  {
    id: '4',
    name: 'Green Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=400&fit=crop',
    rating: 4.6,
    reviewCount: 198,
    deliveryTime: '20-30 min',
    deliveryFee: 2.49,
    distance: '1.5 miles',
    cuisine: ['Healthy', 'Salads', 'Bowls'],
    priceRange: '$$',
    address: '321 Health St, Westside',
    description: 'Fresh, nutritious bowls and salads made with locally sourced organic ingredients. Fuel your body the right way.',
    featured: false,
    menuCategories: ['Bowls', 'Salads', 'Smoothies', 'Snacks'],
    menu: [
      {
        id: 'g1',
        name: 'Acai Power Bowl',
        description: 'Acai blend topped with granola, banana, berries, coconut flakes, and honey.',
        price: 13.99,
        image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop',
        category: 'Bowls',
        ingredients: ['Acai', 'Granola', 'Banana', 'Mixed Berries', 'Coconut Flakes', 'Honey'],
        sizes: [
          { name: 'Small', price: 10.99 },
          { name: 'Medium', price: 13.99 },
          { name: 'Large', price: 16.99 },
        ],
        popular: true,
      },
      {
        id: 'g2',
        name: 'Mediterranean Quinoa Bowl',
        description: 'Quinoa with grilled chicken, hummus, feta, olives, and tahini dressing.',
        price: 14.99,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        category: 'Bowls',
        ingredients: ['Quinoa', 'Grilled Chicken', 'Hummus', 'Feta', 'Kalamata Olives', 'Tahini'],
        sizes: [
          { name: 'Small', price: 11.99 },
          { name: 'Medium', price: 14.99 },
          { name: 'Large', price: 17.99 },
        ],
        popular: true,
      },
      {
        id: 'g3',
        name: 'Caesar Salad',
        description: 'Crisp romaine, parmesan, croutons, and creamy caesar dressing.',
        price: 11.99,
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop',
        category: 'Salads',
        ingredients: ['Romaine Lettuce', 'Parmesan', 'Croutons', 'Caesar Dressing'],
        sizes: [
          { name: 'Small', price: 8.99 },
          { name: 'Medium', price: 11.99 },
          { name: 'Large', price: 14.99 },
        ],
      },
      {
        id: 'g4',
        name: 'Green Detox Smoothie',
        description: 'Spinach, kale, banana, mango, and coconut water blended to perfection.',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop',
        category: 'Smoothies',
        ingredients: ['Spinach', 'Kale', 'Banana', 'Mango', 'Coconut Water'],
        sizes: [
          { name: 'Small', price: 6.99 },
          { name: 'Medium', price: 8.99 },
          { name: 'Large', price: 10.99 },
        ],
      },
      {
        id: 'g5',
        name: 'Energy Bites',
        description: 'Oat and peanut butter energy bites with dark chocolate chips and chia seeds.',
        price: 5.99,
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
        category: 'Snacks',
        ingredients: ['Oats', 'Peanut Butter', 'Dark Chocolate', 'Chia Seeds', 'Honey'],
        sizes: [
          { name: 'Small', price: 5.99 },
          { name: 'Medium', price: 8.99 },
          { name: 'Large', price: 11.99 },
        ],
      },
    ],
  },
  {
    id: '5',
    name: 'Taco Fiesta',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=800&h=400&fit=crop',
    rating: 4.5,
    reviewCount: 256,
    deliveryTime: '20-30 min',
    deliveryFee: 1.99,
    distance: '0.5 miles',
    cuisine: ['Mexican', 'Tacos', 'Burritos'],
    priceRange: '$',
    address: '555 Fiesta Rd, South Side',
    description: 'Vibrant Mexican street food with authentic recipes. From tacos al pastor to loaded burritos.',
    featured: false,
    menuCategories: ['Tacos', 'Burritos', 'Sides', 'Drinks'],
    menu: [
      {
        id: 't1',
        name: 'Tacos Al Pastor',
        description: 'Marinated pork with pineapple, cilantro, and onions on corn tortillas.',
        price: 11.99,
        image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop',
        category: 'Tacos',
        ingredients: ['Marinated Pork', 'Pineapple', 'Cilantro', 'Onions', 'Corn Tortillas'],
        sizes: [
          { name: 'Small', price: 8.99 },
          { name: 'Medium', price: 11.99 },
          { name: 'Large', price: 14.99 },
        ],
        popular: true,
      },
      {
        id: 't2',
        name: 'Carne Asada Burrito',
        description: 'Grilled steak with rice, beans, guacamole, sour cream, and pico de gallo.',
        price: 13.99,
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop',
        category: 'Burritos',
        ingredients: ['Grilled Steak', 'Rice', 'Beans', 'Guacamole', 'Sour Cream', 'Pico de Gallo'],
        sizes: [
          { name: 'Small', price: 10.99 },
          { name: 'Medium', price: 13.99 },
          { name: 'Large', price: 16.99 },
        ],
        popular: true,
      },
      {
        id: 't3',
        name: 'Guacamole & Chips',
        description: 'Freshly made guacamole served with crispy tortilla chips.',
        price: 7.99,
        image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop',
        category: 'Sides',
        ingredients: ['Avocados', 'Lime', 'Cilantro', 'Onions', 'Tomatoes', 'Tortilla Chips'],
        sizes: [
          { name: 'Small', price: 5.99 },
          { name: 'Medium', price: 7.99 },
          { name: 'Large', price: 9.99 },
        ],
      },
      {
        id: 't4',
        name: 'Horchata',
        description: 'Traditional Mexican rice milk drink with cinnamon and vanilla.',
        price: 4.99,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
        category: 'Drinks',
        ingredients: ['Rice Milk', 'Cinnamon', 'Vanilla', 'Sugar'],
        sizes: [
          { name: 'Small', price: 3.99 },
          { name: 'Medium', price: 4.99 },
          { name: 'Large', price: 5.99 },
        ],
      },
    ],
  },
  {
    id: '6',
    name: 'Curry House',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800&h=400&fit=crop',
    rating: 4.4,
    reviewCount: 178,
    deliveryTime: '30-45 min',
    deliveryFee: 2.99,
    distance: '2.5 miles',
    cuisine: ['Indian', 'Curry', 'Asian'],
    priceRange: '$$',
    address: '888 Spice Rd, North End',
    description: 'Authentic Indian flavors with recipes from various regions of India. Handcrafted spice blends and fresh naan.',
    featured: false,
    menuCategories: ['Starters', 'Curry', 'Breads', 'Desserts', 'Drinks'],
    menu: [
      {
        id: 'c1',
        name: 'Samosa',
        description: 'Crispy pastry filled with spiced potatoes and peas, served with chutney.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400&h=300&fit=crop',
        category: 'Starters',
        ingredients: ['Potatoes', 'Peas', 'Spices', 'Pastry', 'Mint Chutney'],
        sizes: [
          { name: 'Small', price: 4.99 },
          { name: 'Medium', price: 6.99 },
          { name: 'Large', price: 9.99 },
        ],
      },
      {
        id: 'c2',
        name: 'Butter Chicken',
        description: 'Tender chicken in a rich, creamy tomato-based sauce with aromatic spices.',
        price: 15.99,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
        category: 'Curry',
        ingredients: ['Chicken', 'Tomato', 'Cream', 'Butter', 'Garam Masala', 'Fenugreek'],
        sizes: [
          { name: 'Small', price: 12.99 },
          { name: 'Medium', price: 15.99 },
          { name: 'Large', price: 18.99 },
        ],
        popular: true,
      },
      {
        id: 'c3',
        name: 'Garlic Naan',
        description: 'Freshly baked flatbread brushed with garlic butter.',
        price: 3.99,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
        category: 'Breads',
        ingredients: ['Flour', 'Garlic', 'Butter', 'Yogurt'],
        sizes: [
          { name: 'Small', price: 3.99 },
          { name: 'Medium', price: 5.99 },
          { name: 'Large', price: 7.99 },
        ],
      },
      {
        id: 'c4',
        name: 'Mango Lassi',
        description: 'Creamy yogurt drink blended with fresh mango and a hint of cardamom.',
        price: 5.99,
        image: 'https://images.unsplash.com/photo-1527685609591-44b0aef2400b?w=400&h=300&fit=crop',
        category: 'Drinks',
        ingredients: ['Yogurt', 'Mango', 'Cardamom', 'Sugar'],
        sizes: [
          { name: 'Small', price: 4.99 },
          { name: 'Medium', price: 5.99 },
          { name: 'Large', price: 7.99 },
        ],
      },
    ],
  },
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((r) => r.id === id);
}

export function getMenuItemById(restaurantId: string, itemId: string): MenuItem | undefined {
  const restaurant = getRestaurantById(restaurantId);
  return restaurant?.menu.find((m) => m.id === itemId);
}

export function getFeaturedRestaurants(): Restaurant[] {
  return restaurants.filter((r) => r.featured);
}

export function getPopularRestaurants(): Restaurant[] {
  return [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 4);
}

export function searchRestaurants(query: string): Restaurant[] {
  const q = query.toLowerCase();
  return restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.some((c) => c.toLowerCase().includes(q)) ||
      r.menu.some((m) => m.name.toLowerCase().includes(q))
  );
}

export function getRestaurantsByCategory(categoryName: string): Restaurant[] {
  const cn = categoryName.toLowerCase();
  return restaurants.filter(
    (r) =>
      r.cuisine.some((c) => c.toLowerCase().includes(cn)) ||
      r.menu.some((m) => m.category.toLowerCase().includes(cn) || m.name.toLowerCase().includes(cn))
  );
}
