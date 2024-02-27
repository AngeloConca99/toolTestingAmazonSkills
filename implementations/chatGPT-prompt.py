import os
import requests
import time
import sys

def main(seed_folder):
    api_url = "https://api.openai.com/v1/chat/completions"
    api_key = "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"
    model_name = "gpt-3.5-turbo"
    organization_id = "org-qgvNjJQOpDd8unaIaCah0WbN"  

   
    if not os.path.isdir(seed_folder):
        print(f"La cartella '{seed_folder}' non esiste.")
        return


    for file_name in os.listdir(seed_folder):
        if file_name.startswith('seed'):
            seed_sentences_file = os.path.join(seed_folder, file_name)
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
                        "organization": organization_id,  
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
                    output_file_path = os.path.join(seed_folder, f'{seed_sentence}.txt')
                    with open(output_file_path, 'w') as output_file:
                        output_file.write(f'{first_line}\n')
                        for generated_point in generated_points:
                            output_file.write(generated_point + '\n')
                    print(f"Risposte di ChatGPT per '{seed_sentence}' sono state salvate in '{output_file_path}'")
                else:
                    print(f"Errore durante la richiesta a ChatGPT per '{seed_sentence}':", response.status_code, response.text)

                print("In pausa per 22 secondi...")
                time.sleep(22)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python chatGPT-prompt.py <seed_folder>")
        sys.exit(1)

    seed_folder = sys.argv[1]
    main(seed_folder)
