package com.mycompany.core.nlp.logic;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Result {
    @JsonProperty("intent")
    private String intent; // Aggiunto nuovo campo per l'intent

    @JsonProperty("seed")
    private String seed;

    @JsonProperty("generate")
    private String generatedSentences;

    @JsonProperty("score")
    private float score;

    // Constructors, getters, and setters

    // Aggiorna il costruttore per includere l'intent
    public Result(String intent, String seed, String generatedSentences, float score) {
        this.intent = intent; // Assegna il nuovo campo
        this.seed = seed;
        this.generatedSentences = generatedSentences;
        this.score = score;
    }

    // Getter e Setter per il nuovo campo intent
    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getSeed() {
        return seed;
    }

    public void setSeed(String seed) {
        this.seed = seed;
    }

    public String getGeneratedSentences() {
        return generatedSentences;
    }

    public void setGeneratedSentences(String generatedSentences) {
        this.generatedSentences = generatedSentences;
    }

    public float getScore() {
        return score;
    }

    public void setScore(float score) {
        this.score = score;
    }
}

