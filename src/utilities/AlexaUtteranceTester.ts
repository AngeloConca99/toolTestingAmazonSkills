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
  private webview:vscode.Webview;
  private skillName:string;

  constructor(filePath: string,value:any, invocationName: string,webview:vscode.Webview,skillName:String) {
    this.filePath = filePath;
    this.invocationName = invocationName;
    this.sentence=value;
    this.webview=webview;
    this.skillName=skillName;
    console.log(skillName);
    console.log(invocationName);
  }
  public async runSkill() {
    try {
        if (!this.skillId) {
            throw new Error("Skill ID is not set. Cannot invoke skill without Skill ID.");
        }
        const command = `ask smapi simulate-skill -s ${this.skillId}  --input-content "open ${this.invocationName}" --device-locale en-US ''`;
        const output = await this.executeCommand(command);

    } catch (error) {
        throw error;
    }
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
  
 

  public async generateTestSummaryFile(): void {
    let passed=0;
    let failed=0;

    const summaryLines = this.simulations.map(simulation => {
      const utterance = simulation.getUtterance();
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

      return `Utterance: ${utterance}\nSeed: ${seed}\nSimulation ID: ${simulationId}\nStatus: ${status}\n${message}\n${intentResult}\nExpectedIntent: ${expectedIntent} \n\n`;
    });
    vscode.window.showInformationMessage("Test Passed: "+passed+"Test Failed: "+ failed );
    const date = new Date();
    const dateString = date.toISOString().replace(/:/g, '-'); 
    let summaryFileName = `test_summary_${dateString}.txt`;
    let summaryDir = path.dirname(this.filePath); 
    let summaryFilePath = path.join(summaryDir, summaryFileName);

    if (!fs.existsSync(summaryDir)) {
        await fs.promises.mkdir(summaryDir, { recursive: true });
    }
    await fs.promises.writeFile(summaryFilePath, summaryLines.join(''));
    vscode.window.showInformationMessage(`Test summary file saved in: ${summaryFilePath}`);}




  private async findSkillId(): Promise<void> {
    try {
      const out = await this.executeCommand('ask smapi list-skills-for-vendor');
      const response = JSON.parse(out);
      const skills = response.skills;
      const foundSkill = skills.find(skill => skill.nameByLocale['en-US'] === this.skillName);
      if (foundSkill) {
        this.skillId = foundSkill.skillId;
      } else {
        this.webview.postMessage({
          command:'idNotFound',
        });
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
        const expectedIntent = simulation.getIntent();
        
        try {
            const command = `ask smapi get-skill-simulation --simulation-id ${simulationId} --skill-id ${this.skillId}`;
            const result = await this.executeCommand(command);
            const parsedResult = JSON.parse(result);
            

            let actualIntent = "";
            if (parsedResult && parsedResult.result && parsedResult.result.alexaExecutionInfo && parsedResult.result.alexaExecutionInfo.consideredIntents && parsedResult.result.alexaExecutionInfo.consideredIntents.length > 0) {
                actualIntent = parsedResult.result.alexaExecutionInfo.consideredIntents[0].name;
            }

            const status = (expectedIntent === actualIntent) ? 'Success' : 'Failed';
            parsedResult.status = status;
           
            simulation.setSimulationResult(parsedResult);
            this.webview.postMessage({
              command:'Result',
              value:simulation.getUtterance().toString(),
              text:status,
              simulation:simulation
            });
            
        } catch (error) {
            const errorMessage = `Error getting result for simulation ${simulationId}: ${error}`;
            throw new Error(errorMessage);
        }
    }
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
            await this.runSkill();

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
