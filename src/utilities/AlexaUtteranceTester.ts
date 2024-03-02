const fs = require('fs');
const { exec } = require('child_process');

export class AlexaUtteranceTester {
  constructor(filePath, skillId) {
    this.filePath = filePath;
    this.skillId = skillId;
    this.utterances = [];
  }

  private loadUtterances() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, 'utf8', (err, data) => {
        if (err) {
          reject("Errore nella lettura del file: " + err);
        } else {
          const json = JSON.parse(data);
          json.forEach(item => {
            this.utterances = this.utterances.concat(item.generate);
          });
          resolve(this.utterances);
        }
      });
    });
  }

  private simulateUtterance(utterance) {
    return new Promise((resolve, reject) => {
      const command = `ask simulate -l en-US -t "${utterance}" --skill-id ${this.skillId}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Errore durante la simulazione: ${error}`);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  public runSimulations() {
    this.loadUtterances().then(utterances => {
      utterances.forEach(utterance => {
        this.simulateUtterance(utterance).then(response => {
          fs.appendFile('simulation_output.txt', `Utterance: ${utterance}\nResponse: ${response}\n\n`, (err) => {
            if (err) {throw err;}
            console.log(`Risposta salvata per l'utterance: "${utterance}"`);
          });
        }).catch(error => console.error(error));
      });
    }).catch(error => console.error(error));
  }
}
/*
// Utilizzo della classe
const tester = new AlexaUtteranceTester('./path/to/your/file.json', 'your-skill-id');
tester.runSimulations();*/
