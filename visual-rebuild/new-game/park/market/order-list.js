// The counter cycles through ten guests before restarting its four-drink sequence.
function grocerOrder(index) {
  const recipes = [
    ['Iced Matcha Latte', ['matcha', 'ice', 'milk']],
    ['Traditional Hot Matcha', ['matcha', 'water']],
    ['Strawberry Coconut Matcha', ['berries', 'ice', 'coconut', 'matcha']],
    ['Blueberry Honey Matcha', ['honey', 'blueberries', 'ice', 'milk', 'matcha']]
  ];
  return recipes[(Math.max(0, Math.floor(Number(index) || 0)) % 10) % 4];
}
