import { exec } from 'child_process';
import * as fs from 'fs';

export class AlexaUtteranceTester {
  private filePath: string;
  private invocationName: string;
  private skillId: string | null = null;
  private utterances: string[] = [];

  constructor(filePath: string, invocationName: string) {
    this.filePath = filePath;
    this.invocationName = invocationName;
  }

  private async findSkillId(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec('ask smapi list-skills-for-vendor', (error, stdout, stderr) => {
        if (error) {
          console.error(`Errore durante l'esecuzione del comando: ${error}`);
          return reject(error);
        }
        try {
          const response = JSON.parse(stdout);
          const skills = response.skills;
          const foundSkill = skills.find((skill: any) => skill.nameByLocale['en-US'] === this.invocationName);
          if (foundSkill) {
            this.skillId = foundSkill.skillId;
            resolve();
          } else {
            reject('Skill ID non trovato.');
          }
        } catch (parseError) {
          console.error(`Errore durante l'analisi dell'output: ${parseError}`);
          reject(parseError);
        }
      });
    });
  }

  private simulateUtterance(utterance: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.skillId === null) {
        console.error('Errore: Skill ID non trovato.');
        return reject('Skill ID non trovato.');
      }
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

  public async runSimulations(): Promise<void> {
    try {
      await this.findSkillId();
      // Assumi che "this.utterances" sia già popolato con le utterances da simulare
      for (const utterance of this.utterances) {
        const simulationResult = await this.simulateUtterance(utterance);
        console.log(`Risultato simulazione per "${utterance}": ${simulationResult}`);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
