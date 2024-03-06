export class Simulation {
  // Property definitions
  private utterance: string;
  private seed: string;
  private score: number; // Score is defined as number to handle float values
  private simulationId?: string;
  private simulationResult?: any;

  // Constructor to initialize a new instance of the class with specified values
  public constructor(utterance: string, seed: string, score: number) {
    this.utterance = utterance;
    this.seed = seed;
    this.score = score;
  }

  // Getter methods (optional, in TypeScript you can directly access the properties)
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

  // Setter methods (optional, in TypeScript you can directly modify the properties)
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
    this.simulationResult = result;}

  // You can add other specific methods you need for managing simulations
}