package com.mycompany.core.nlp.logic;

import java.util.HashMap;
import java.util.Map;

public class SimilarityScoreCalculator {

    public static double calculateCosineSimilarity(String text1, String text2) {
        Map<String, Integer> freqVector1 = createFrequencyVector(text1);
        Map<String, Integer> freqVector2 = createFrequencyVector(text2);
        
        double dotProduct = 0.0;
        for (String key : freqVector1.keySet()) {
            dotProduct += freqVector1.getOrDefault(key, 0) * freqVector2.getOrDefault(key, 0);
        }
        
        double norm1 = calculateVectorNorm(freqVector1);
        double norm2 = calculateVectorNorm(freqVector2);
        
        return dotProduct / (norm1 * norm2);
    }

    private static Map<String, Integer> createFrequencyVector(String text) {
        Map<String, Integer> freqVector = new HashMap<>();
        for (String word : text.split("\\s+")) {
            freqVector.put(word, freqVector.getOrDefault(word, 0) + 1);
        }
        return freqVector;
    }

    private static double calculateVectorNorm(Map<String, Integer> freqVector) {
        double sum = 0.0;
        for (int freq : freqVector.values()) {
            sum += freq * freq;
        }
        return Math.sqrt(sum);
    }
}
