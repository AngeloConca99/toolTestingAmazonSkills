package com.mycompany.core.nlp;
import com.mycompany.core.nlp.logic.Intent;
import com.mycompany.core.nlp.logic.CoreNlp;
import com.mycompany.core.nlp.logic.JesonProcessor;
import com.mycompany.core.nlp.logic.MyFile;
import java.io.*;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CoreNlpMain {
    private static ExecutorService executor = Executors.newCachedThreadPool();

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.out.println("USAGE: java -jar core-nlp-example.jar <input/file/path> <output/dir>");
            return;
        }
        String inputFilePath = args[0];
        String outputDir = args[1];

        MyFile myFile = new MyFile();
        CoreNlp coreNlp = new CoreNlp();
        List<Intent> intents = myFile.readFile(inputFilePath);

        File outputDirectory = new File(outputDir);
        if (!outputDirectory.exists()) {
            outputDirectory.mkdirs();
        }
        int fileIndex = 0;
        for (Intent intent : intents) {
            List<String> seedList=intent.getSamples();
            for(String seed : seedList){
                String outputGrammarFileName = "output" + (++fileIndex) + ".grammar";
                String outputGrammarPath = Paths.get(outputDir, outputGrammarFileName).toString();
                String seedSinitaized=seed.replace(" ","_" );
            try (PrintWriter writer = new PrintWriter(new FileOutputStream(outputGrammarPath, false))) {
                ArrayList<String> generatedSentences = coreNlp.coreNlpStart(seed); 
                writer.println(seedSinitaized + ':'); 
                String allSentences = String.join(" ", generatedSentences);
                writer.println(allSentences);
            }
            String outputGrammarPathWithoutOut = outputGrammarPath.replace(File.separator + "out" + File.separator,
                    File.separator);
            runJarAsync(outputDir, outputGrammarPathWithoutOut, fileIndex);}}
            executor.shutdown();
            if (executor.awaitTermination(Long.MAX_VALUE, TimeUnit.SECONDS)) {
                executor.shutdownNow();}
        
        try {
        File inputPhat = new File(inputFilePath);
        String filepat = inputPhat.getParent();
        File inputPath = new File(filepat);
        String normalizedinput = Paths.get(inputPath.getAbsolutePath()).normalize().toString();
        String normalizeoutput = Paths.get(outputDirectory.getAbsolutePath()).normalize().toString().replace(File.separator + "out" + File.separator, File.separator);
       
        JesonProcessor.processUtterances(normalizeoutput, normalizedinput,intents);}
                
        catch (Exception e) {
            e.printStackTrace();
        }
        
       

    }
    private static String capitalizeAfterSpace(String seed) {
        if (seed == null || seed.isEmpty()) {
            return seed;
        }

        char[] chars = seed.toCharArray();

        boolean capitalizeNext = false;

        for (int i = 0; i < chars.length; i++) {
            if (chars[i] == ' ') {
                capitalizeNext = true;
            } else if (capitalizeNext) {
                chars[i] = Character.toUpperCase(chars[i]);
                capitalizeNext = false;
            }
        }

        return new String(chars);
    }

    private static Future<?> runJarAsync(String baseOutputDir, String outputGrammarPath, int fileIndex) {
        if (executor.isShutdown() || executor.isTerminated()) {
            executor = Executors.newCachedThreadPool();
        }
        return executor.submit(() -> {
            try {
                // Crea una copia unica del JAR per questo specifico task
                File jarFile = extractJar(baseOutputDir, fileIndex);
                runJar(jarFile, baseOutputDir, outputGrammarPath, fileIndex);

                // Pulisci eliminando la copia del JAR usata da questo task
                jarFile.delete();
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private static File extractJar(String baseOutputDir, int fileIndex) throws IOException {
        String uniqueID = UUID.randomUUID().toString(); // Genera un ID unico
        String jarFileName = "alexa-generate-" + fileIndex + "-" + uniqueID + ".jar";
        File jarFile = new File(baseOutputDir, jarFileName);

        try (InputStream inputStream = CoreNlpMain.class.getResourceAsStream("/alexa-generate.jar");
                OutputStream outputStream = new FileOutputStream(jarFile)) {
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }
        return jarFile;
    }

    private static void runJar(File jarFile, String baseOutputDir, String outputGrammarPath, int fileIndex)
            throws Exception {
        // Normalizza il percorso per rimuovere segmenti come "./"
        Path normalizedBaseOutputDir = Paths.get(baseOutputDir).normalize();
        String outputDir = normalizedBaseOutputDir.toString();
        String adaptedOutputDir = outputGrammarPath.replace("/out", "");

        // Costruisci i percorsi dei file output.grammar e My-Utterance-TestSet.json
        String utteranceTestSetJsonPath = new File(outputDir, "My-Utterance-TestSet" + (fileIndex) + ".json")
                .getAbsolutePath();

        // Esegui il JAR alexa-generate.jar con i percorsi corretti
        ProcessBuilder processBuilder = new ProcessBuilder("java", "-jar", jarFile.getAbsolutePath(), adaptedOutputDir,
                utteranceTestSetJsonPath);
        System.out.println("" + adaptedOutputDir);

        processBuilder.directory(new File(outputDir)); // Imposta la directory di lavoro correttamente
        Process process = processBuilder.start();

        // Leggi e stampa l'output e l'errore del processo
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
            while ((line = errorReader.readLine()) != null) {
                System.err.println(line);
            }
        }

        int exitValue = process.waitFor();
        if (exitValue != 0) {
            throw new Exception("Executable jar terminated with an error. Exit value: " + exitValue);
        } else {
            System.out.println("Executable jar completed successfully.");
        }
        process.destroy(); // Assicurati che il processo sia terminato
        if (process.isAlive()) {
            process.destroyForcibly(); // Forza la terminazione se il processo è ancora attivo
        }
    }

}