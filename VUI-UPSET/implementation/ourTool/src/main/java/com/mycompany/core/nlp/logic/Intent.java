package com.mycompany.core.nlp.logic;

import java.util.List;

public class Intent {
    private String name;
    private List<String> samples;

    // Costruttori
    public Intent() {
    }

    public Intent(String name, List<String> samples) {
        this.name = name;
        this.samples = samples;
    }

    // Getter e Setter
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getSamples() {
        return samples;
    }

    public void setSamples(List<String> samples) {
        this.samples = samples;
    }

}
