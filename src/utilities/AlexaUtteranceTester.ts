import { exec } from 'child_process';
import { Simulation } from './Simulation';
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
  private simulations: Simulation[] = [];

  constructor(filePath: string, invocationName: string) {
    this.filePath = filePath;
    this.invocationName = invocationName;
  }
  private loadUtterances(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, 'utf8', (err, data) => {
        if (err) {
          reject("Errore nella lettura del file: " + err);
        } else {
          console.log('else');
          const json = JSON.parse(data);
          
         
          json.forEach(item => {
              const simulation = new Simulation(
                 item.generate.toString(),
                 item.seed,
                 item.score,
                );
              this.simulations.push(simulation);
              console.log('prova jeson' +simulation.getScore());
            
          });
          resolve();
        }
      });
    });
  }
  private calculateTestResults() {
    let passedTests = 0;
    let failedTests = 0;
  
    this.simulations.forEach(simulation => {
      const result = simulation.getSimulationResult();
      if (result && result.status) {
        if (result.status === "FAILED") {
          failedTests++;
        } else {
          passedTests++;
        }
      }
    });
  
    console.log(`Test Passati: ${passedTests} \nTest Falliti: ${failedTests}`);
    vscode.window.showInformationMessage(`Test Passati: ${passedTests} \nTest Falliti: ${failedTests}`);
  }
  
  public generateTestSummaryFile(): void {
    console.log("Generazione file txt di riepilogo del test...");
  
    // Prepara le linee di riepilogo direttamente dall'array `this.simulations`
    const summaryLines = this.simulations.map(simulation => {
      const utterance = simulation.getUtterance();
      const score = simulation.getScore();
      const seed = simulation.getSeed();
      const simulationId = simulation.getSimulationId();
      const result = simulation.getSimulationResult();
  
      let status = result ? result.status : 'Unknown';
      let message = 'Nessun messaggio di errore o successo disponibile';
  
      // Estrai il messaggio di errore o successo se presente
      if (result && result.result && result.result.error && result.result.error.message) {
        message = result.result.error.message;
      } else if (result && result.result && result.result.successMessage) {
        message = result.result.successMessage;
      }
  
      // Includi score e seed nel riepilogo
      return `Utterance: ${utterance}\nScore: ${score}\nSeed: ${seed}\nSimulation ID: ${simulationId}\nStatus: ${status}\nMessage: ${message}\n\n`;
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
  private async simulateUtterance(simulation: Simulation): Promise<void> {
    console.log("simulazione in corso di " + simulation.getUtterance());
    if (!this.skillId) {
      throw new Error('Skill ID non trovato.');
    }

    try {
      const command = `ask smapi simulate-skill --skill-id ${this.skillId} --input-content "${simulation.getUtterance()}" --device-locale en-US`;
      const out = await this.executeCommand(command);
      const response = JSON.parse(out);
      const simulationId = response.id;

      if (simulationId) {
        simulation.setSimulationId(simulationId);
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
  
    for (const simulation of this.simulations) {
      const simulationId = simulation.getSimulationId();
      if (!simulationId) {
        console.log("ID di simulazione non definito per un'utterance, continuo con la prossima.");
        continue;
      }
  
      try {
        const command = `ask smapi get-skill-simulation --simulation-id ${simulationId} --skill-id ${this.skillId}`;
        const result = await this.executeCommand(command);
        const parsedResult = JSON.parse(result);
        simulation.setSimulationResult(parsedResult);
      } catch (error) {
        console.error(`Errore durante il recupero del risultato per la simulazione ${simulationId}: ${error}`);
      }
    }
  
    console.log('Risultati delle simulazioni associati agli oggetti Simulation.');
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
  private async forWaiting() {
    for (const simulation of this.simulations) {
      await this.delay(1000)
      await this.simulateUtterance(simulation);
    }
  }




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
