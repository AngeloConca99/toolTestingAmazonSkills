package com.mycompany.core.nlp.logic;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

public class JesonProcessor {

    public static void processUtterances(String inputDirectoryPath, String outputDirectoryPath, List<Intent> intents)
            throws IOException {
        String expectedIntentName = "";
        File inputDirectory = new File(inputDirectoryPath);
        File[] files = inputDirectory
                .listFiles((dir, name) -> name.startsWith("My-Utterance") && name.endsWith(".json"));

        ObjectMapper mapper = new ObjectMapper();

        List<Result> allResults = new ArrayList<>();

        if (files != null) {
            for (File file : files) {
                String content = new String(Files.readAllBytes(file.toPath()));
                MyUtteranceFile utteranceFile = mapper.readValue(content, MyUtteranceFile.class);

                for (MyUtteranceFile.DataItem data : utteranceFile.getData()) {
                    String utterance = data.getInputs().getUtterance().replace("_", " ").toLowerCase();
                    String seedsaved = data.getExpected().get(0).getIntent().getName().replace("_", " ").toLowerCase();
                    float score = (float) SimilarityScoreCalculator.calculateCosineSimilarity(utterance, seedsaved);
                    boolean foundMatch = false;
                    for (Intent intent : intents) {
                        List<String> seedList = intent.getSamples();
                        for (String seed : seedList) {
                            if (seed.equalsIgnoreCase(seedsaved)) {
                                foundMatch = true;
                                expectedIntentName=intent.getName();
                                break;
                            }
                        }
                        if (foundMatch) {
                            break;
                        }
                    }

                    allResults.add(new Result(expectedIntentName, seedsaved, utterance, score));
                }
            }
        }

        String outputFileName = "combined_output.json";
        File outputFile = new File(outputDirectoryPath, outputFileName);

        mapper.writerWithDefaultPrettyPrinter().writeValue(outputFile, allResults);
    }

    // Classe MyUtteranceFile e le sue classi interne
    public static class MyUtteranceFile {
        private List<DataItem> data;

        public List<DataItem> getData() {
            return data;
        }

        public void setData(List<DataItem> data) {
            this.data = data;
        }

        public static class DataItem {
            private Inputs inputs;
            private List<Expected> expected;

            public Inputs getInputs() {
                return inputs;
            }

            public void setInputs(Inputs inputs) {
                this.inputs = inputs;
            }

            public List<Expected> getExpected() {
                return expected;
            }

            public void setExpected(List<Expected> expected) {
                this.expected = expected;
            }
        }

        public static class Inputs {
            private String utterance;

            public String getUtterance() {
                return utterance;
            }

            public void setUtterance(String utterance) {
                this.utterance = utterance;
            }
        }

        public static class Expected {
            private Intent intent;

            public Intent getIntent() {
                return intent;
            }

            public void setIntent(Intent intent) {
                this.intent = intent;
            }
        }

        public static class Intent {
            private String name;

            public String getName() {
                return name;
            }

            public void setName(String name) {
                this.name = name;
            }
        }
    }

}