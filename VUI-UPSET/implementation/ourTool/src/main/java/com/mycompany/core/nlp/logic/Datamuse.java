package com.mycompany.core.nlp.logic;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.core.nlp.CoreNlpMain;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;

public class Datamuse {
    private final String USER_AGENT = "Mozilla/5.0";
    
    public ArrayList<String> searchSynonyms(String wordToSearch) throws Exception {  //-->String wordToSearch, String syn_n
        System.out.println("Sending request...");

        //int syn_number= Integer.parseInt(syn_n);

        String url = "https://api.datamuse.com/words?rel_syn=" + wordToSearch;

        URL obj = new URL(url);
        HttpURLConnection con = (HttpURLConnection) obj.openConnection();

        con.setRequestMethod("GET");
        con.setRequestProperty("User-Agent", USER_AGENT);

        int responseCode = con.getResponseCode();
        System.out.println("\nSending request to: " + url);
        System.out.println("JSON Response: " + responseCode + "\n");

        StringBuilder response;
        try (BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()))) {
            String inputLine;
            response = new StringBuilder();

            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
        }

        ObjectMapper mapper = new ObjectMapper();

        try {
            ArrayList<Synonymous> synonyms = mapper.readValue(
                    response.toString(),
                    mapper.getTypeFactory().constructCollectionType(ArrayList.class, Synonymous.class)
            );

            ArrayList<String> syn = new ArrayList<>();

            if (synonyms.size() > 0) {
                if (synonyms.size() >= 2 ) {
                    for (int i = 0; i < synonyms.size(); i++) {
                       // if(synonyms.get(i).getScore() > 3000) {
                            syn.add(synonyms.get(i).getWord());
                        //    System.out.println("score:" + synonyms.get(i).getScore());
                        //}
                    }
                } else {
                    for (Synonymous synonym : synonyms) {
                        syn.add(synonym.getWord());
                    }
                }
                return syn;
            } else {
                return null;
            }
        } catch (IOException e) {
            return null;
        }
    }
}
