// Quick debug script to understand target extraction
const words = ['befriend', 'the', 'goblin', 'king'];
const prepositions = ['the', 'a', 'an', 'at', 'to', 'in', 'on', 'with', 'by', 'from'];
const compoundNouns = ['goblin king', 'dragon', 'dark lord', 'witch queen', 'village elder', 'merchant', 'guard', 'princess', 'prince'];
const socialKeywords = ['befriend', 'talk', 'speak', 'converse', 'chat', 'greet', 'meet', 'introduce', 'help', 'assist', 'rescue', 'save', 'protect', 'defend', 'ally', 'join', 'persuade', 'convince', 'negotiate', 'trade', 'barter', 'agree', 'promise', 'marry', 'propose', 'love', 'like', 'respect', 'trust', 'follow', 'lead'];

console.log('Processing words:', words);

for (let i = 1; i < words.length; i++) {
  const prevWord = words[i - 1];
  const currentWord = words[i];
  const nextWord = words[i + 1];

  console.log(`\nIteration i=${i}: prev="${prevWord}", current="${currentWord}", next="${nextWord}"`);

  // Skip prepositions and action keywords
  const shouldSkip = prepositions.includes(prevWord) || prepositions.includes(currentWord) || socialKeywords.includes(currentWord);
  console.log(`Should skip? ${shouldSkip} (prev in prepositions: ${prepositions.includes(prevWord)}, current in prepositions: ${prepositions.includes(currentWord)}, current in keywords: ${socialKeywords.includes(currentWord)})`);

  if (shouldSkip) {
    console.log('Skipping');
    continue;
  }

  // Look for multi-word targets, prioritizing compound nouns
  let target = currentWord;
  console.log('Initial target:', target);

  if (nextWord && !prepositions.includes(nextWord) && !socialKeywords.includes(nextWord)) {
    const twoWordTarget = target + ' ' + nextWord;
    console.log('Two-word target:', twoWordTarget);

    // Check if this forms a known compound noun
    const isCompound = compoundNouns.some(compound => compound.includes(twoWordTarget) || twoWordTarget.includes(compound));
    console.log('Is compound noun?', isCompound);

    if (isCompound) {
      target = twoWordTarget;
      console.log('Updated target to compound:', target);
    } else {
      // Also allow two-word targets even if not in compound list, if they seem reasonable
      if (currentWord.length > 1 && nextWord.length > 1) {
        target = twoWordTarget;
        console.log('Updated target to two-word:', target);
      }
    }
  }

  // Clean up target (remove trailing punctuation)
  target = target.replace(/[.,!?;:]$/, '');
  console.log('Final target after cleanup:', target);

  if (target && target.length > 1) {
    console.log('Returning target:', target);
    break;
  }
}