/**
 * Matcha Café Recipe Database
 * Minimal recipe system with ingredients, steps, and icons
 */

export const RECIPES = [
  {
    id: 'iced-matcha-latte',
    name: 'Iced Matcha Latte',
    description: 'Refreshing and creamy, perfect for warm days.',
    image: 'generated/iced-matcha-latte.png',
    icon: 'icons/ingredient-matcha.png',
    core: true,
    type: 'iced',
    tags: ['iced', 'creamy', 'latte'],
    ingredients: [
      { item: 'Matcha', icon: 'icons/ingredient-matcha.png', quantity: 1, unit: 'tsp' },
      { item: 'Hot Water', icon: 'icons/ingredient-water.png', quantity: 0.25, unit: 'cup' },
      { item: 'Milk', icon: 'icons/ingredient-oat-milk.png', quantity: 1, unit: 'cup' },
      { item: 'Ice', icon: 'icons/ingredient-ice.png', quantity: 'handful', unit: '' }
    ],
    steps: [
      { number: 1, action: 'Add matcha to bowl.', icon: 'icons/step-1-add.png' },
      { number: 2, action: 'Pour hot water and whisk smooth.', icon: 'icons/step-2-pour.png' },
      { number: 3, action: 'Add ice to glass.', icon: 'icons/ingredient-ice.png' },
      { number: 4, action: 'Pour matcha mixture, then add milk.', icon: 'icons/step-4-serve.png' }
    ]
  },
  {
    id: 'traditional-hot',
    name: 'Traditional Hot Matcha',
    description: 'A classic, pure matcha. Smooth, fragrant, and gently uplifting.',
    image: 'generated/traditional-hot-matcha.png',
    icon: 'icons/ingredient-matcha.png',
    core: true,
    type: 'hot',
    tags: ['classic', 'pure', 'hot'],
    ingredients: [
      { item: 'Matcha', icon: 'icons/ingredient-matcha.png', quantity: 1, unit: 'tsp' },
      { item: 'Hot Water', icon: 'icons/ingredient-water.png', quantity: 1, unit: 'cup' },
      { item: 'Sugar', icon: 'icons/ingredient-sugar.png', quantity: 0, unit: 'optional' }
    ],
    steps: [
      { number: 1, action: 'Add matcha to bowl.', icon: 'icons/step-1-add.png' },
      { number: 2, action: 'Pour hot water (175°F).', icon: 'icons/step-2-pour.png' },
      { number: 3, action: 'Whisk until smooth and frothy.', icon: 'icons/step-3-whisk.png' },
      { number: 4, action: 'Serve hot.', icon: 'icons/step-4-serve.png' }
    ]
  },
  {
    id: 'strawberry-coconut',
    name: 'Strawberry Coconut Matcha',
    description: 'Sweet and tropical. Fresh strawberries meet creamy coconut.',
    image: 'generated/strawberry-coconut-matcha.png',
    icon: 'icons/ingredient-strawberry.png',
    type: 'iced',
    tags: ['strawberry', 'tropical', 'fruity'],
    ingredients: [
      { item: 'Matcha', icon: 'icons/ingredient-matcha.png', quantity: 1, unit: 'tsp' },
      { item: 'Hot Water', icon: 'icons/ingredient-water.png', quantity: 0.25, unit: 'cup' },
      { item: 'Strawberry Purée', icon: 'icons/ingredient-strawberry.png', quantity: 0.5, unit: 'cup' },
      { item: 'Coconut Milk', icon: 'icons/ingredient-coconut-milk.png', quantity: 0.5, unit: 'cup' },
      { item: 'Ice', icon: 'icons/ingredient-ice.png', quantity: 'handful', unit: '' }
    ],
    steps: [
      { number: 1, action: 'Add matcha to bowl.', icon: 'icons/step-1-add.png' },
      { number: 2, action: 'Whisk with hot water until smooth.', icon: 'icons/step-3-whisk.png' },
      { number: 3, action: 'Pour strawberry purée into glass with ice.', icon: 'icons/ingredient-strawberry.png' },
      { number: 4, action: 'Add matcha mix, top with coconut milk.', icon: 'icons/step-4-serve.png' }
    ]
  },
  {
    id: 'blueberry-honey',
    name: 'Blueberry Honey Matcha',
    description: 'Naturally sweet with a touch of honey. Perfectly balanced.',
    image: 'generated/blueberry-honey-matcha.png',
    icon: 'icons/ingredient-blueberry.png',
    type: 'iced',
    tags: ['blueberry', 'honey', 'sweet'],
    ingredients: [
      { item: 'Matcha', icon: 'icons/ingredient-matcha.png', quantity: 1, unit: 'tsp' },
      { item: 'Hot Water', icon: 'icons/ingredient-water.png', quantity: 0.25, unit: 'cup' },
      { item: 'Honey', icon: 'icons/ingredient-honey.png', quantity: 2, unit: 'tbsp' },
      { item: 'Blueberry Purée', icon: 'icons/ingredient-blueberry.png', quantity: 0.5, unit: 'cup' },
      { item: 'Milk', icon: 'icons/ingredient-oat-milk.png', quantity: 0.5, unit: 'cup' },
      { item: 'Ice', icon: 'icons/ingredient-ice.png', quantity: 'handful', unit: '' }
    ],
    steps: [
      { number: 1, action: 'Add matcha to bowl.', icon: 'icons/step-1-add.png' },
      { number: 2, action: 'Whisk with hot water until smooth.', icon: 'icons/step-3-whisk.png' },
      { number: 3, action: 'Add honey and blueberry purée to glass with ice.', icon: 'icons/ingredient-honey.png' },
      { number: 4, action: 'Pour matcha mix and top with milk.', icon: 'icons/step-4-serve.png' }
    ]
  },
  {
    id: 'banana-watermelon-smoothie',
    name: 'Banana Watermelon Smoothie',
    description: 'A refreshing fruity blend that\'s creamy and naturally sweet.',
    image: 'generated/banana-watermelon-smoothie.png',
    icon: 'icons/ingredient-banana.png',
    type: 'iced',
    tags: ['smoothie', 'fruity', 'tropical'],
    ingredients: [
      { item: 'Banana', icon: 'icons/ingredient-banana.png', quantity: 1, unit: 'whole' },
      { item: 'Watermelon', icon: 'icons/ingredient-watermelon.png', quantity: 1, unit: 'cup' },
      { item: 'Coconut Milk', icon: 'icons/ingredient-coconut-milk.png', quantity: 0.5, unit: 'cup' },
      { item: 'Ice', icon: 'icons/ingredient-ice.png', quantity: 'handful', unit: '' }
    ],
    steps: [
      { number: 1, action: 'Peel and slice banana.', icon: 'icons/step-1-add.png' },
      { number: 2, action: 'Add watermelon and banana to blender.', icon: 'icons/step-2-pour.png' },
      { number: 3, action: 'Add ice and coconut milk.', icon: 'icons/ingredient-ice.png' },
      { number: 4, action: 'Blend until smooth and serve immediately.', icon: 'icons/step-4-serve.png' }
    ]
  },
  {
    id: 'hot-peach-oat-tea',
    name: 'Hot Peach Oat Tea',
    description: 'A warming tea with natural peach sweetness and comforting oat notes.',
    image: 'generated/hot-peach-oat-tea.png',
    icon: 'icons/ingredient-tea-leaves.png',
    type: 'hot',
    tags: ['tea', 'peach', 'oat', 'warm'],
    ingredients: [
      { item: 'Tea Leaves', icon: 'icons/ingredient-tea-leaves.png', quantity: 1, unit: 'tbsp' },
      { item: 'Peach', icon: 'icons/ingredient-peach.png', quantity: 0.5, unit: 'cup' },
      { item: 'Oat Milk', icon: 'icons/ingredient-oat-milk.png', quantity: 0.75, unit: 'cup' },
      { item: 'Hot Water', icon: 'icons/ingredient-water.png', quantity: 0.75, unit: 'cup' }
    ],
    steps: [
      { number: 1, action: 'Brew tea leaves in hot water.', icon: 'icons/step-1-add.png' },
      { number: 2, action: 'Steep for 3-4 minutes.', icon: 'icons/step-2-pour.png' },
      { number: 3, action: 'Strain and add peach.', icon: 'icons/step-3-whisk.png' },
      { number: 4, action: 'Top with oat milk and serve hot.', icon: 'icons/step-4-serve.png' }
    ]
  }
];

/**
 * Get a recipe by ID
 */
export function getRecipe(id) {
  return RECIPES.find(r => r.id === id);
}

/**
 * Get all recipes of a specific type (hot/iced)
 */
export function getRecipesByType(type) {
  return RECIPES.filter(r => r.type === type);
}

/**
 * Get core/starter recipes
 */
export function getCoreRecipes() {
  return RECIPES.filter(r => r.core);
}

/**
 * Search recipes by tag
 */
export function searchRecipesByTag(tag) {
  return RECIPES.filter(r => r.tags && r.tags.includes(tag));
}
