package com.mycompany.core.nlp.logic;

import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.ling.CoreLabel;
import edu.stanford.nlp.ling.IndexedWord;
import edu.stanford.nlp.pipeline.Annotation;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import edu.stanford.nlp.semgraph.SemanticGraph;
import edu.stanford.nlp.semgraph.SemanticGraphCoreAnnotations;
import edu.stanford.nlp.trees.Tree;
import edu.stanford.nlp.trees.TreeCoreAnnotations;
import edu.stanford.nlp.util.CoreMap;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

public class CoreNlp {

    public ArrayList<String> coreNlpStart(String text) throws Exception {  //-->String text, String syn_n
        ArrayList<String> output = new ArrayList<>();

        ArrayList<String> utterance = new ArrayList<>();    //ADD

        MyFile myFile = new MyFile();       //ADD

        /* creates a StanfordCoreNLP object, with POS tagging, lemmatization, NER, parsing,
        and coreference resolution */
        Properties props = new Properties();
        props.setProperty("annotators", "tokenize, ssplit, pos, lemma, ner, parse, dcoref");
        StanfordCoreNLP pipeline = new StanfordCoreNLP(props);

        /* create an empty Annotation just with the given text */
        Annotation document = new Annotation(text);

        /* run all Annotators on this text */
        pipeline.annotate(document);

        List<CoreMap> sentences = document.get(CoreAnnotations.SentencesAnnotation.class);

        ArrayList<String> stopwords = myFile.readResource("stop_words_english.txt");
        System.out.println("Stopwords loaded: " + stopwords.size());

        for (CoreMap sentence : sentences) {
            /* traversing the words in the current sentence
               a CoreLabel is a CoreMap with additional token-specific methods */
            for (CoreLabel token : sentence.get(CoreAnnotations.TokensAnnotation.class)) {
                // this is the text of the token
                String word = token.get(CoreAnnotations.TextAnnotation.class);
                // this is the POS tag of the token
                String pos = token.get(CoreAnnotations.PartOfSpeechAnnotation.class);
                // this is the lemma label of the token
                String lemma = token.get(CoreAnnotations.LemmaAnnotation.class);        //ADD
                // this is the NER label of the token
                String ne = token.get(CoreAnnotations.NamedEntityTagAnnotation.class);

                System.out.println(String.format("Print: word: [%s] pos: [%s] lemma: [%s] ", word, pos, lemma));        //ADD


                StringBuilder grammar = new StringBuilder("");

                Datamuse datamuse = new Datamuse();

                /** add */
                // this is the parse tree of the current sentence
                Tree tree = sentence.get(TreeCoreAnnotations.TreeAnnotation.class);
                System.out.println("parse tree:\n" + tree);

                // this is the Stanford dependency graph of the current sentence
                SemanticGraph dependency = sentence.get(SemanticGraphCoreAnnotations.BasicDependenciesAnnotation.class);
                System.out.println("dependency graph:\n" + dependency);

                System.out.println(sentence);

                /** - */

                //if (text.contains("Intent:"))
                    //output.add(word);

                //check stopwords ADD
                if (stopwords.contains(lemma)) {
                    output.add(word);
                }
                else {


                    switch (pos) {
                        case "PDT":
                        case "UH":
                            //null
                            output.add("{|" + word + "}");

                            break;

                        case "JJ":
                        case "JJR":
                        case "JJS":
                        case "RBS":
                        case "RBR":

                            //synonyms or null
                            if (datamuse.searchSynonyms(lemma) != null) {                         //-->word, syn_n
                                ArrayList<String> synonyms = datamuse.searchSynonyms(lemma);

                                for (String syn : synonyms) {
                                    grammar.append(syn).append("|");
                                }
                                output.add("{|" + word + "|" + grammar.substring(0, grammar.length() - 1) + "}");
                            } else {
                                output.add(word);
                            }

                            break;

                        case "NN":
                        case "NNS":
                        case "NNP":
                        case "RB":
                        case "VB":
                        case "VBD":
                        case "VBG":
                        case "VBN":
                        case "VBZ":
                        //case "VBP":
                            //synonyms
                            if (datamuse.searchSynonyms(lemma) != null) {
                                ArrayList<String> synonyms = datamuse.searchSynonyms(lemma);

                                for (String syn : synonyms) {
                                    grammar.append(syn).append("|");
                                }
                                output.add("{" + word + "|" + grammar.substring(0, grammar.length() - 1) + "}");
                            } else {
                                output.add(word);
                            }

                            break;

                        case "VBP":    //ADD

                            List<IndexedWord> words = dependency.getAllNodesByPartOfSpeechPattern("VBP");
                            for (IndexedWord w : words) {
                                IndexedWord d = new ArrayList<>(dependency.getChildren(w)).stream().filter(tg -> tg.tag().equals("RP")).findFirst().orElse(null);
                                if (d != null) {
                                    dependency.getAllEdges(w, d).get(0).getRelation();

                                    System.out.println("w " + w + " e d " + d);
                                }
                            }
                            output.add(word);

                            break;

                        case "PRP":

                            if (word=="I" || word=="you"|| word=="she" || word=="he"|| word=="they"){
                              
                              output.add("{|I|you|she|he|they}");
                            }
                            else{
                              output.add("{|me|her|him|us}");

                            }
                            break;

                        case "PRP$":

                            output.add("{|my|our}");

                            break;

                        default:
                            output.add(word);
                    }
                    System.out.println(String.format("Print: word: [%s] pos: [%s] ne: [%s]", word, pos, ne));
                }
            }
        }
        return output;
    }
}
