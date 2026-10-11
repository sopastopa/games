import { increment } from "../domain/counter";

export class GameController {
  private score = 0;
  get snapshot(): number {
    return this.score;
  }
  play(): number {
    this.score = increment(this.score);
    return this.score;
  }
}
