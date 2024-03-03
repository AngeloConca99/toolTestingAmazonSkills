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

    const simulationResultsFilePath = path.join(path.dirname(this.filePath), 'simulation_results.json');

    const simulationResultsData = fs.readFileSync(simulationResultsFilePath, 'utf8');
    const simulationResults = JSON.parse(simulationResultsData);

    const summaryLines = simulationResults.map(result => {
        const utterance = Object.keys(this.utteranceSimulationMap).find(key => this.utteranceSimulationMap[key] === result.id) || 'Utterance non trovata';
        const status = result.status;
        let message = 'Nessun messaggio di errore disponibile';

        if (result.result && result.result.error && result.result.error.message) {
            message = result.result.error.message;
        } else if (result.result && result.result.successMessage) {
            message = result.result.successMessage;
        }
        return `Utterance: ${utterance}\nSimulation ID: ${result.id}\nStatus: ${status}\nMessage: ${message}\n\n`;
    });

    const summaryFilePath = path.join(path.dirname(this.filePath), 'test_summary.txt');

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

          const simulationIdsFilePath = path.join(path.dirname(this.filePath), 'simulation_ids.txt');
          fs.appendFileSync(simulationIdsFilePath, `${simulationId}\n`);
          throw new Error('ID di simulazione non trovato.');
      }
  } catch (error) {
      console.error(`Errore durante la simulazione: ${error}`);
      throw error;
  }
}


private async fetchSimulationResults(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const simulationIdsFilePath = path.join(path.dirname(this.filePath), 'simulation_ids.txt');
        
        fs.readFile(simulationIdsFilePath, 'utf8', async (err, data) => {
            if (err) {
                console.error(`Errore durante la lettura del file degli ID di simulazione: ${err}`);
                return reject(err);
            }

            const simulationIds = data.split('\n').filter(line => line.trim() !== '');

            const simulationResults = [];

            for (const simulationId of simulationIds) {
                try {
                    const command = `ask smapi get-skill-simulation --simulation-id ${simulationId} --skill-id ${this.skillId}`;
                    const result = await this.executeCommand(command);
                    simulationResults.push(JSON.parse(result));
                } catch (error) {
                    console.error(`Errore durante il recupero del risultato per la simulazione ${simulationId}: ${error}`);
                }
            }

            const resultsFilePath = path.join(path.dirname(this.filePath), 'simulation_results.json');
            fs.writeFile(resultsFilePath, JSON.stringify(simulationResults, null, 2), (err) => {
                if (err) {
                    console.error(`Errore durante la scrittura dei risultati delle simulazioni: ${err}`);
                    return reject(err);
                }
                resolve();
            });
        });
    });
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
      await this.calculateTestResults(path.join(path.dirname(this.filePath), 'simulation_results.json'));
      this.generateTestSummaryFile();

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
