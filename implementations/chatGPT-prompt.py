import os
import requests
import time

api_url = "https://api.openai.com/v1/chat/completions"

api_key = "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" 

model_name = "gpt-3.5-turbo"

current_directory = os.getcwd()
directories = [d for d in os.listdir(current_directory) if os.path.isdir(d)]
print("Elenco delle cartelle presenti nella directory corrente:")
print(directories)

for directory in directories:
    print("Analisi della cartella:", directory)
    folder_name = os.path.join(current_directory, directory)
    print("Percorso completo della cartella:", folder_name)

    files_in_directory = os.listdir(folder_name)
    seed_sentences_file = None
    for file_name in files_in_directory:
        if file_name.startswith('seed'):
            seed_sentences_file = os.path.join(folder_name, file_name)
            break

    if seed_sentences_file:
        print("File seed trovato:", seed_sentences_file)
    else:
        print("Nessun file seed trovato nella cartella:", folder_name)
        continue

    with open(seed_sentences_file, 'r') as file:
        lines = file.readlines()
        first_line = lines[0].strip()  
        seed_sentences = lines[1:]  

    for seed_sentence in seed_sentences:
        seed_sentence = seed_sentence.strip()
        input_text = f"Data la seguente frase di input '{seed_sentence}', genera tutte le possibili parafrasi che consideri semanticamente equivalenti."

        print("Invio della richiesta a OpenAI API per:", seed_sentence)

        response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "messages": [
                    {
                        "role": "system",
                        "content": "system"
                    },
                    {
                        "role": "user",
                        "content": input_text
                    }
                ],
                "model": model_name
            }
        )

        if response.status_code == 200:
            print("Risposta ricevuta correttamente.")
            data = response.json()
            reply_text = data["choices"][0]["message"]["content"]

            generated_points = reply_text.split(' - ')
            output_file_path = os.path.join(folder_name, f'{seed_sentence}.txt')
            with open(output_file_path, 'w') as output_file:
                output_file.write(f'{first_line}\n')
                for generated_point in generated_points:
                    output_file.write(generated_point + '\n')
            print(f"Risposte di ChatGPT per '{directory}/{seed_sentence}' sono state salvate in '{output_file_path}'")
        else:
            print(f"Errore durante la richiesta a ChatGPT per '{directory}/{seed_sentence}':", response.status_code, response.text)
        
        print("In pausa per 22 secondi...")
        time.sleep(22)
    print("Fine analisi della cartella", directory)
