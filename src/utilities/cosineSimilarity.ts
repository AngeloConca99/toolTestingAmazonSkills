export function calculateCosineSimilarity(text1, text2) {
    const freqVector1 = createFrequencyVector(text1);
    const freqVector2 = createFrequencyVector(text2);
  
    let dotProduct = 0.0;
    for (let key in freqVector1) {
      if (freqVector2.hasOwnProperty(key)) {
        dotProduct += freqVector1[key] * freqVector2[key];
      }
    }
  
    const norm1 = calculateVectorNorm(freqVector1);
    const norm2 = calculateVectorNorm(freqVector2);
  
    return dotProduct / (norm1 * norm2);
  }
  
  function createFrequencyVector(text) {
    const freqVector = {};
    const words = text.split(/\s+/);
    words.forEach(word => {
      freqVector[word] = (freqVector[word] || 0) + 1;
    });
    return freqVector;
  }
  
  function calculateVectorNorm(freqVector) {
    let sum = 0.0;
    for (let key in freqVector) {
      sum += freqVector[key] * freqVector[key];
    }
    return Math.sqrt(sum);
  }