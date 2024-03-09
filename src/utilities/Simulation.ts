export class Simulation {

  private utterance: string;
  private seed: string;
  private score: number;
  private simulationId?: string;
  private simulationResult?: any;
  private intent:string;

  public constructor(utterance: string, seed: string, score: number,intent:string) {
    this.utterance = utterance;
    this.seed = seed;
    this.score = score;
    this.intent=intent;
  }


  public getUtterance(): string {
    return this.utterance;
  }

  public getSeed(): string {
    return this.seed;
  }

  public getSimulationId(): string {
    return this.simulationId;
  }

  public getScore(): number {
    return this.score;
  }

  public getSimulationResult(): any {
    return this.simulationResult;
  }


  public setUtterance(value: string) {
    this.utterance = value;
  }

  public setSeed(value: string) {
    this.seed = value;
  }

  public setSimulationId(value: string) {
    this.simulationId = value;
  }

  public setScore(value: number) {
    this.score = value;
  }
  public setSimulationResult(result: any) {
    this.simulationResult = result;
  }
  public getIntent(): string {
    return this.intent;
  }
  public setIntent(value: string) {
    this.intent = value;
  }

}