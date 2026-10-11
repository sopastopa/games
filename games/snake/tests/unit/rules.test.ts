import { describe, expect, it } from 'vitest';
import { changeDirection, chooseFood, createGame, startGame, tick, togglePause } from '../../src/domain/rules';
import type { GameState } from '../../src/domain/types';
const random = () => 0;
const running = (): GameState => startGame(createGame(8, 8, random));

describe('Snake domain rules', () => {
  it('creates a valid, deterministic board', () => {
    const state = createGame(8, 8, random);
    expect(state.status).toBe('ready');
    expect(state.snake).toHaveLength(3);
    expect(state.score).toBe(0);
    expect(state.food).not.toBeNull();
    expect(state.snake).not.toContainEqual(state.food);
  });
  it('rejects invalid boards', () => {
    expect(() => createGame(3, 8, random)).toThrow(RangeError);
    expect(() => createGame(8.5, 8, random)).toThrow(RangeError);
  });
  it('starts and advances by one cell', () => {
    const state = running();
    expect(tick(state, random).snake[0]).toEqual({ x: state.snake[0]!.x + 1, y: state.snake[0]!.y });
  });
  it('rejects an immediate 180-degree turn', () => {
    expect(changeDirection(running(), 'left').nextDirection).toBe('right');
  });
  it('accepts a perpendicular direction', () => {
    expect(tick(changeDirection(running(), 'up'), random).snake[0]).toEqual({ x: 4, y: 3 });
  });
  it('does not advance while paused', () => {
    const state = togglePause(running());
    expect(state.status).toBe('paused');
    expect(tick(state, random)).toEqual(state);
    expect(togglePause(state).status).toBe('running');
  });
  it('loses upon hitting a wall', () => {
    const state = { ...running(), snake: [{ x: 7, y: 3 }], food: { x: 2, y: 2 } };
    expect(tick(state, random).status).toBe('lost');
  });
  it('loses upon hitting its own body', () => {
    const state: GameState = { ...running(), snake: [{ x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 5, y: 3 }], food: { x: 0, y: 0 } };
    expect(tick(state, random).status).toBe('lost');
  });
  it('can enter the cell vacated by its tail', () => {
    const state: GameState = { ...running(), snake: [{ x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }], food: { x: 0, y: 0 } };
    expect(tick(state, random).status).toBe('running');
  });
  it('grows and awards points on eating', () => {
    const state = { ...running(), food: { x: 5, y: 4 } };
    const next = tick(state, random);
    expect(next.snake).toHaveLength(4);
    expect(next.score).toBe(10);
    expect(next.food).not.toEqual(state.food);
  });
  it('wins when the grid is full', () => {
    const snake = [];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (x !== 3 || y !== 3) snake.push({ x, y });
    const state: GameState = { columns: 4, rows: 4, snake: [{ x: 2, y: 3 }, ...snake.filter(p => !(p.x === 2 && p.y === 3))], food: { x: 3, y: 3 }, direction: 'right', nextDirection: 'right', score: 0, status: 'running' };
    expect(tick(state, random).status).toBe('won');
  });
  it('clamps random input safely and reports no remaining space', () => {
    expect(chooseFood([{ x: 0, y: 0 }], 1, 1, random)).toBeNull();
    expect(chooseFood([], 2, 1, () => 99)).toEqual({ x: 1, y: 0 });
  });
});
