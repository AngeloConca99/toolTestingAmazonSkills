package com.mycompany.core.nlp.logic;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;

public class MyFile {

    public void createFile(String path, String text, boolean append) {
        try {
            File myFile = new File(path);
            if (myFile.createNewFile()) {
                System.out.println("File created: " + myFile.getName());
            } else {
                System.out.println("File already exists.");
            }
            FileWriter myWriter = new FileWriter(path, append);
            myWriter.write(text + "\r\n");
            myWriter.close();
        } catch (IOException e) {
            System.out.println("An error occurred.");
            e.printStackTrace();
        }
    }

    // ADD
    public List<Intent> readFile(String path) {
        Gson gson = new Gson();
        try (FileReader reader = new FileReader(path)) {
            Type intentListType = new TypeToken<List<Intent>>() {}.getType();
            List<Intent> intents = gson.fromJson(reader, intentListType);
            return intents;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    public ArrayList<String> readResource(String resourceName) {
        ArrayList<String> lines = new ArrayList<>();
        
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(resourceName)) {
            if (inputStream == null) {
                throw new IllegalArgumentException("Resource not found: " + resourceName);
            }
            Scanner scanner = new Scanner(inputStream, "UTF-8");
            while (scanner.hasNextLine()) {
                lines.add(scanner.nextLine());
            }
        } catch (IOException e) {
            System.out.println("An error occurred while reading from the resource: " + e.getMessage());
            e.printStackTrace();
        }
        
        return lines;
    }
}
