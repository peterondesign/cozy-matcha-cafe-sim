/**
 * Player name generator with game-appropriate names
 * Provides randomized names for new players
 */

const FIRST_NAMES = [
  'Akira', 'Yuki', 'Sakura', 'Haruto', 'Hana', 'Kenji', 'Mira', 'Takeshi',
  'Aiko', 'Daichi', 'Emiko', 'Fumi', 'Genta', 'Hisao', 'Ichiro', 'Jun',
  'Kaida', 'Leiko', 'Makoto', 'Noboru', 'Osamu', 'Priya', 'Qing', 'Raiden',
  'Satoshi', 'Tomoe', 'Ume', 'Violet', 'Wakana', 'Xander', 'Yasmine', 'Zara'
];

const LAST_NAMES = [
  'Tanaka', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Sato', 'Suzuki', 'Watanabe',
  'Ito', 'Nakano', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue',
  'Kimura', 'Hayashi', 'Shimizu', 'Mori', 'Ishikawa', 'Maeda', 'Fujita',
  'Okada', 'Hasegawa', 'Murakami', 'Kondo', 'Ishii', 'Saito', 'Sakamoto'
];

class PlayerNameGenerator {
  /**
   * Generate a random player name
   * @returns {string} Random Japanese-inspired name
   */
  static generate() {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate a unique name not in the excluded list
   * @param {Set<string>} excluded - Names to exclude
   * @returns {string} Random name
   */
  static generateUnique(excluded = new Set()) {
    let name;
    let attempts = 0;
    do {
      name = this.generate();
      attempts++;
    } while (excluded.has(name) && attempts < 50);
    return name;
  }

  /**
   * Generate multiple unique names
   * @param {number} count - Number of names to generate
   * @returns {string[]} Array of unique names
   */
  static generateMultiple(count) {
    const names = new Set();
    while (names.size < count) {
      names.add(this.generate());
    }
    return Array.from(names);
  }

  /**
   * Get all available first names
   * @returns {string[]} Array of first names
   */
  static getFirstNames() {
    return [...FIRST_NAMES];
  }

  /**
   * Get all available last names
   * @returns {string[]} Array of last names
   */
  static getLastNames() {
    return [...LAST_NAMES];
  }
}

globalThis.PlayerNameGenerator = PlayerNameGenerator;
