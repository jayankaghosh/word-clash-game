import fs from 'fs';

const URL = `https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_alpha_arrays.json`;
const filename = `dictionary.json`;

async function buildDictionary() {
  try {
    const res = await fetch(URL);
    const data = await res.json();

    const words = [];
    
    data.forEach(category => Object.keys(category).forEach(word => {
      if (word.length > 2) {
        words.push(word.toLowerCase())
      }
    }));

    fs.writeFileSync(filename, JSON.stringify(words, null, 2));
    console.log(`Saved ${words.length} words to ${filename}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

buildDictionary();

