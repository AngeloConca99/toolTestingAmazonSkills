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
        this.sentence.forEach(item => {
          const simulation = new Simulation(
            item.generate.toString(),
            item.seed,
            item.score,
            item.intent.toString()
          );
          this.simulations.push(simulation);
        });
        resolve();
      } catch (error) {
        reject("Error in data processing: " + error);
      }
    });
  }
  
 

  public generateTestSummaryFile(): void {
    let passed=0;
    let failed=0;

    const summaryLines = this.simulations.map(simulation => {
      const utterance = simulation.getUtterance();
      const score = simulation.getScore()*100;
      const seed = simulation.getSeed();
      const simulationId = simulation.getSimulationId();
      const expectedIntent=simulation.getIntent();
      let result = simulation.getSimulationResult();
      let status=" ";
      let intentResultName=" ";
      
      
      let message = "Message: " + 'No error or success messages available';
      let intentResult;
      if (result && result.result && result.result.alexaExecutionInfo && result.result.alexaExecutionInfo.consideredIntents && result.result.alexaExecutionInfo.consideredIntents.length > 0) {
        intentResultName = result.result.alexaExecutionInfo.consideredIntents[0].name;
        intentResult = "Result Intent: " + intentResultName;
      }
      if (result && result.result && result.result.error && result.result.error.message) {
        message = "Message: " + result.result.error.message;
      } else if (result && result.result && result.result.successMessage) {
        message = "Message: " + result.result.successMessage;
      }
      status = (expectedIntent === intentResultName) ? 'Success' : 'Failed';
      result.status=status;
      simulation.setSimulationResult(result);
      if(status ==='Failed'){
        failed++;
      }else{
        passed++;
      }

      return `Utterance: ${utterance}\nScore: ${score}\nSeed: ${seed}\nSimulation ID: ${simulationId}\nStatus: ${status}\n${message}\n${intentResult}\nExpectedIntent: ${expectedIntent} \n\n`;
    });
    vscode.window.showInformationMessage("Test Passed: "+passed+"Test Failed: "+ failed );
    const summaryFilePath = path.join(path.dirname(this.filePath), 'test_summary.txt');

    fs.writeFileSync(summaryFilePath, summaryLines.join(''));
    vscode.window.showInformationMessage(`Test summary file saved in: ${summaryFilePath}`);
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
        throw new Error('Skill ID not found');
      }
    } catch (error) {
      const errorMessage = `Error while searching for Skill ID or parsing output: ${error.message}`;
      throw errorMessage;
    }
  }
  private async simulateUtterance(simulation: Simulation, retryCount = 0): Promise<void> {
    if (!this.skillId) {
      throw new Error('Skill ID not found');
    }
  
    const command = `ask smapi simulate-skill --skill-id ${this.skillId} --input-content "${simulation.getUtterance()}" --device-locale en-US`;
    try {
      const out = await this.executeCommand(command);
      const response = JSON.parse(out);
      const simulationId = response.id;
      if (simulationId) {
        simulation.setSimulationId(simulationId);
      } else {
        throw new Error('Simulation ID not found');
      }
    } catch (error) {
      if (error.toString().includes("409") && retryCount < 5) {
        await new Promise(resolve => setTimeout(resolve, 5000)); 
        return this.simulateUtterance(simulation, retryCount + 1); 
      } else {
        const errormessage=`Error during simulation: ${error}`;
        throw error;
      }
    }
  }
  

  private async fetchSimulationResults(): Promise<void> {
    let simulationResults = [];
    for (const simulation of this.simulations) {

      const simulationId = simulation.getSimulationId();
      if (!simulationId) {
        continue;
      }

      try {
        const command = `ask smapi get-skill-simulation --simulation-id ${simulationId} --skill-id ${this.skillId}`;
        const result = await this.executeCommand(command);
        const parsedResult = JSON.parse(result);
        simulation.setSimulationResult(parsedResult);
        simulationResults.push(parsedResult);
      } catch (error) {
        const errorMessage=`Error getting result for simulation ${simulationId}: ${error}`;
        throw new Error(errorMessage);
      }
    }
    const resultsFilePath = path.join(path.dirname(this.filePath), 'simulation_results.json');
    await fs.promises.writeFile(resultsFilePath, JSON.stringify(simulationResults, null, 2));
  }



  private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          const errorMessage=`Error executing command: ${error}`;
          return reject(error);
        }
        resolve(stdout);
      });
    });
  }

  public async runSimulations(): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Running simulations: ",
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ message: "Loading utterances..." });
            await this.loadUtterances();

            progress.report({ message: "Finding Skill ID..." });
            await this.findSkillId();

            progress.report({ message: "Waiting for simulations to complete..." });

            const timeoutPromise = setTimeout(async () => {
                await this.fetchSimulationResults();
            }, 540000);

            await this.forWaiting();

            clearTimeout(timeoutPromise);

            if (!this.fetchSimulationResultsCalled) {
                progress.report({ message: "Fetching the results..." });
                await this.fetchSimulationResults();
            }

            progress.report({ message: "Generating test summary..." });
            await this.generateTestSummaryFile();

        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage(`Error running simulations: ${error}`);
        }
    });
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
