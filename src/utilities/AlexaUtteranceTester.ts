import { exec } from 'child_process';
import { Simulation } from './Simulation';
import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';
import { Console } from 'console';
import * as vscode from "vscode";
import { measureMemory } from 'vm';
export class AlexaUtteranceTester {
  private filePath: string;
  private sentence:any;
  private invocationName: string;
  private skillId: string | null = null;
  private utterances: string[] = [];
  private simulations: Simulation[] = [];

  constructor(filePath: string,value:any, invocationName: string) {
    this.filePath = filePath;
    this.invocationName = invocationName;
    this.sentence=value;
  }
  private loadUtterances(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('else');
        this.sentence.forEach(item => {
          console.log(" "+item.intent);
          const simulation = new Simulation(
            item.generate.toString(),
            item.seed,
            item.score,
            item.intent.toString()
          );
          this.simulations.push(simulation);
          console.log('prova jeson' + simulation.getScore());
        });
        resolve();
      } catch (error) {
        reject("Errore nell'elaborazione dei dati: " + error);
      }
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

    const summaryLines = this.simulations.map(simulation => {
      const utterance = simulation.getUtterance();
      const score = simulation.getScore();
      const seed = simulation.getSeed();
      const simulationId = simulation.getSimulationId();
      const expectedIntent=simulation.getIntent();
      const result = simulation.getSimulationResult();

      let status = result ? result.status : 'Unknown';
      let message = "Message: " + 'Nessun messaggio di errore o successo disponibile';
      let intentResult;
      if (result && result.result && result.result.alexaExecutionInfo && result.result.alexaExecutionInfo.consideredIntents && result.result.alexaExecutionInfo.consideredIntents.length > 0) {
        intentResult = "Result Intent: " + result.result.alexaExecutionInfo.consideredIntents[0].name;
      }
      if (result && result.result && result.result.error && result.result.error.message) {
        message = "Message: " + result.result.error.message;
      } else if (result && result.result && result.result.successMessage) {
        message = "Message: " + result.result.successMessage;
      }

      return `Utterance: ${utterance}\nScore: ${score}\nSeed: ${seed}\nSimulation ID: ${simulationId}\nStatus: ${status}\n${message}\n${intentResult}\nExpectedIntent: ${expectedIntent} \n\n`;
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
    let simulationResults = [];
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
        simulationResults.push(parsedResult);
      } catch (error) {
        console.error(`Errore durante il recupero del risultato per la simulazione ${simulationId}: ${error}`);
      }
    }
    const resultsFilePath = path.join(path.dirname(this.filePath), 'simulation_results.json');
    await fs.promises.writeFile(resultsFilePath, JSON.stringify(simulationResults, null, 2));

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
      await this.loadUtterances();
      await this.findSkillId();


      const timeoutPromise = new Promise(resolve => setTimeout(async () => {
        console.log('9 minuti passati. Eseguo fetchSimulationResults.');
        await this.fetchSimulationResults();
        resolve('fetchSimulationResults eseguito dopo 9 minuti.');
      }, 540000));


      await Promise.race([this.forWaiting(), timeoutPromise]);


      if (!this.fetchSimulationResultsCalled) {
        await this.fetchSimulationResults();
      }

      await this.generateTestSummaryFile();
      await this.calculateTestResults(path.join(path.dirname(this.filePath), 'simulation_results.json'));

    } catch (error) {
      console.error(error);
    }
  }
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async forWaiting(): Promise<void> {
    for (const simulation of this.simulations) {
      await this.delay(1000);
      await this.simulateUtterance(simulation);
    }
  }


}
