import { exec } from 'child_process';
import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';
import { Console } from 'console';
import * as vscode from "vscode";
export class AlexaUtteranceTester {
  private filePath: string;
  private invocationName: string;
  private skillId: string | null = null;
  private utterances: string[] = [];
  private utteranceSimulationMap: { [utterance: string]: string } = {}; 

  constructor(filePath: string, invocationName: string) {
    this.filePath = filePath;
    this.invocationName = invocationName;
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
  private calculateTestResults(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error("Errore durante la lettura del file:", err);
        return;
      }
  
      const results = JSON.parse(data);
      let passedTests = 0;
      let failedTests = 0;
  
      results.forEach(result => {
        if (result.status === "FAILED") {
          failedTests++;
        } else {
          passedTests++;
        }
      });
      console.log(`Test Passati: ${passedTests} \n Test Falliti: ${failedTests}`);
      vscode.window.showInformationMessage(`Test Passati: ${passedTests} \nTest Falliti: ${failedTests}`);
    });
  }
  public generateTestSummaryFile(): void {
    console.log("generazione file txt");
    // Assumendo che i risultati delle simulazioni siano già stati raccolti e salvati in precedenza
    const simulationResultsFilePath = path.join(path.dirname(this.filePath), 'simulation_results.json');
    const simulationResultsData = fs.readFileSync(simulationResultsFilePath, 'utf8');
    const simulationResults = JSON.parse(simulationResultsData);

    // Prepara le linee di riepilogo
    const summaryLines = simulationResults.map(result => {
        // Trova l'utterance corrispondente all'ID di simulazione nel risultato
        const utterance = Object.entries(this.utteranceSimulationMap).find(([key, value]) => value === result.id)?.[0] || 'Utterance non trovata';
        const status = result.status;
        let message = 'Nessun messaggio di errore disponibile';

        // Estrai il messaggio di errore o successo se presente
        if (result.result && result.result.error && result.result.error.message) {
            message = result.result.error.message;
        } else if (result.result && result.result.successMessage) {
            message = result.result.successMessage;
        }

        // Ora ogni elemento va su una nuova riga come richiesto
        return `Utterance: ${utterance}\nSimulation ID: ${result.id}\nStatus: ${status}\nMessage: ${message}\n\n`;
    });

    // Percorso al nuovo file di testo di riepilogo
    const summaryFilePath = path.join(path.dirname(this.filePath), 'test_summary.txt');

    // Scrivi le informazioni nel nuovo file di testo
    fs.writeFileSync(summaryFilePath, summaryLines.join(''));
    console.log(`File di riepilogo test salvato in: ${summaryFilePath}`);
}



  private async findSkillId(): Promise<void> {
    try {
        const out = await this.executeCommand('ask smapi list-skills-for-vendor');
        const response = JSON.parse(out);
        const skills = response.skills;
        const foundSkill = skills.find(skill => skill.nameByLocale['en-US'] === this.invocationName);
        if (foundSkill) {
            this.skillId = foundSkill.skillId;
        } else {
            throw new Error('Skill ID non trovato.');
        }
    } catch (error) {
        console.error(`Errore durante la ricerca dello Skill ID o l'analisi dell'output: ${error}`);
        throw error;
    }
}
private async simulateUtterance(utterance: string): Promise<void> {
  console.log("simulazione in corso di " +utterance);
  if (!this.skillId) {
      throw new Error('Skill ID non trovato.');
  }

  try {
      const command = `ask smapi simulate-skill --skill-id ${this.skillId} --input-content "${utterance}" --device-locale en-US`;
      const out = await this.executeCommand(command);
      const response = JSON.parse(out);
      const simulationId = response.id;

      if (simulationId) {
          this.utteranceSimulationMap[utterance] = simulationId;
      } else {
          throw new Error('ID di simulazione non trovato.');
      }
  } catch (error) {
      console.error(`Errore durante la simulazione: ${error}`);
      throw error;
  }
}



private async fetchSimulationResults(): Promise<void> {
  console.log("Recupero simulazioni in corso...");
  const simulationResults = [];

  for (const [utterance, simulationId] of Object.entries(this.utteranceSimulationMap)) {
      try {
          const command = `ask smapi get-skill-simulation --simulation-id ${simulationId} --skill-id ${this.skillId}`;
          const result = await this.executeCommand(command);
          const parsedResult = JSON.parse(result);
          simulationResults.push(parsedResult);
      } catch (error) {
          console.error(`Errore durante il recupero del risultato per la simulazione ${simulationId}: ${error}`);
      }
  }

  const resultsFilePath = path.join(path.dirname(this.filePath), 'simulation_results.json');
  
  // Utilizza fs.promises.writeFile per scrivere in modo asincrono
  try {
      await fs.promises.writeFile(resultsFilePath, JSON.stringify(simulationResults, null, 2));
      console.log('Risultati delle simulazioni salvati con successo.');
  } catch (err) {
      console.error(`Errore durante la scrittura dei risultati delle simulazioni: ${err}`);
      throw err;
  }
}



private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Errore durante l'esecuzione del comando: ${error}`);
                return reject(error);
            }
            resolve(stdout);
        });
    });
}


  public async runSimulations(): Promise<void> {
    try {
      this.deleteSimulationFiles();
      await this.loadUtterances();
      await this.findSkillId();
      await this.forWaiting();
      await this.fetchSimulationResults();
      await this.generateTestSummaryFile();
      await this.calculateTestResults(path.join(path.dirname(this.filePath), 'simulation_results.json'));
      

    } catch (error) {
      console.error(error);
    }
  }
  private async forWaiting(){
    for (const utterance of this.utterances) {
        await this.delay(1000);
         await this.simulateUtterance(utterance);
   }}




  private deleteSimulationFiles(): void {
    const simulationResultsPath = path.join(path.dirname(this.filePath), 'simulation_results.json');
    const simulationIdsPath = path.join(path.dirname(this.filePath), 'simulation_ids.txt');

    if (fs.existsSync(simulationResultsPath)) {
        fs.unlinkSync(simulationResultsPath);
    } 
    if (fs.existsSync(simulationIdsPath)) {
        fs.unlinkSync(simulationIdsPath);
    } 
}
private async delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
}
