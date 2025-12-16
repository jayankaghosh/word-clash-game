class ComputerAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.name = 'Bot';
    
    // Difficulty settings
    this.settings = {
      easy: {
        thinkTimeMin: 8000,    // 8-15 seconds
        thinkTimeMax: 15000,
        failChance: 0.25,       // 25% chance to fail/timeout
        letterDelay: 3000       // 3 seconds to choose letter
      },
      medium: {
        thinkTimeMin: 4000,     // 4-10 seconds
        thinkTimeMax: 10000,
        failChance: 0.10,       // 10% chance to fail
        letterDelay: 2000       // 2 seconds
      },
      hard: {
        thinkTimeMin: 2000,     // 2-6 seconds
        thinkTimeMax: 6000,
        failChance: 0.02,       // 2% chance to fail
        letterDelay: 1000       // 1 second
      }
    };
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  // Get delay for letter selection
  getLetterDelay() {
    return this.settings[this.difficulty].letterDelay;
  }
  
  // Choose a letter strategically or randomly
  chooseLetter(words, usedCombinations = new Set()) {
    // For easy/medium, choose more random letters
    // For hard, try to choose letters with more word options
    
    if (this.difficulty === 'easy') {
      // Completely random
      return this.getRandomLetter();
    }
    
    if (this.difficulty === 'medium') {
      // 50% random, 50% strategic
      if (Math.random() < 0.5) {
        return this.getRandomLetter();
      }
    }
    
    // Strategic: choose common letters
    const commonLetters = ['A', 'E', 'I', 'O', 'S', 'T', 'R', 'N'];
    const availableLetters = commonLetters.filter(letter => {
      // Check if this letter is good
      return Math.random() < 0.7; // Still some randomness
    });
    
    if (availableLetters.length > 0) {
      return availableLetters[Math.floor(Math.random() * availableLetters.length)];
    }
    
    return this.getRandomLetter();
  }
  
  getRandomLetter() {
    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }
  
  // Find a valid word
  async findWord(startLetter, endLetter, usedWords, dictionary) {
    const settings = this.settings[this.difficulty];
    
    // Check if AI should fail this round
    if (Math.random() < settings.failChance) {
      // Simulate trying but failing - return null after delay
      const thinkTime = this.getRandomThinkTime();
      await this.delay(thinkTime);
      return null;
    }
    
    // Find valid words
    const validWords = this.getValidWords(startLetter, endLetter, usedWords, dictionary);
    
    if (validWords.length === 0) {
      // No valid words, fail after delay
      const thinkTime = this.getRandomThinkTime();
      await this.delay(thinkTime);
      return null;
    }
    
    // Choose a word based on difficulty
    let chosenWord;
    
    if (this.difficulty === 'easy') {
      // Easy: prefer shorter words, sometimes pick bad ones
      const shortWords = validWords.filter(w => w.length <= 6);
      const wordPool = shortWords.length > 0 ? shortWords : validWords;
      chosenWord = wordPool[Math.floor(Math.random() * wordPool.length)];
    } else if (this.difficulty === 'medium') {
      // Medium: balanced selection
      chosenWord = validWords[Math.floor(Math.random() * validWords.length)];
    } else {
      // Hard: prefer longer, more impressive words
      const longWords = validWords.filter(w => w.length >= 7);
      const wordPool = longWords.length > 0 ? longWords : validWords;
      chosenWord = wordPool[Math.floor(Math.random() * wordPool.length)];
    }
    
    // Simulate thinking time
    const thinkTime = this.getRandomThinkTime();
    await this.delay(thinkTime);
    
    return chosenWord;
  }
  
  getValidWords(startLetter, endLetter, usedWords, dictionary) {
    const start = startLetter.toLowerCase();
    const end = endLetter.toLowerCase();
    
    return dictionary.filter(word => {
      if (word.length < 3 || word.length > 15) return false;
      if (usedWords.has(word.toLowerCase())) return false;
      if (word[0] !== start) return false;
      if (word[word.length - 1] !== end) return false;
      return true;
    });
  }
  
  getRandomThinkTime() {
    const settings = this.settings[this.difficulty];
    return settings.thinkTimeMin + 
           Math.random() * (settings.thinkTimeMax - settings.thinkTimeMin);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Check if valid words exist for a combination
  hasValidWords(startLetter, endLetter, usedWords, dictionary) {
    const validWords = this.getValidWords(startLetter, endLetter, usedWords, dictionary);
    return validWords.length > 0;
  }
}

export default ComputerAI;
