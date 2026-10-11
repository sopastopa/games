import { describe, expect, it, vi } from 'vitest';
import { SnakeController } from '../../src/application/SnakeController';

describe('Snake application controller', () => {
  it('schedules ticks, pauses and clears timers on destruction', () => {
    let advance: () => void = () => {};
    const cancel = vi.fn();
    const clock = { every: vi.fn((_milliseconds: number, action: () => void) => { advance = action; return cancel; }) };
    const store = { read: () => 0, write: vi.fn() };
    const game = new SnakeController({ clock, store, random: () => 0 }, 8, 8);
    const observer = vi.fn();
    const unsubscribe = game.subscribe(observer);
    expect(observer).toHaveBeenCalledTimes(1);
    game.start();
    expect(clock.every).toHaveBeenCalledOnce();
    advance();
    expect(game.snapshot.snake[0]).toEqual({ x: 5, y: 4 });
    game.pause();
    expect(cancel).toHaveBeenCalledOnce();
    expect(game.snapshot.status).toBe('paused');
    unsubscribe();
    game.destroy();
  });
  it('restarts to a fresh game', () => {
    const game = new SnakeController({ clock: { every: () => () => {} }, store: { read: () => 50, write: () => {} }, random: () => 0 });
    game.start(); game.restart();
    expect(game.snapshot.status).toBe('ready');
    expect(game.snapshot.score).toBe(0);
    expect(game.snapshot.bestScore).toBe(50);
  });
});
