import { defineFeature, loadFeature } from 'jest-cucumber';
import { generateSudokuPuzzle, getSudokuRules } from '@/games/sudoku/generator';
import { countSudokuSolutions } from '@/games/sudoku/solver';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-generator.feature');

defineFeature(feature, (test) => {
  test('Generated puzzle is uniquely solvable', ({ given, when, then }) => {
    let puzzle = generateSudokuPuzzle({ mode: 'normal', seed: 11 });
    let count = 0;

    given('a generated normal sudoku puzzle', () => {
      puzzle = generateSudokuPuzzle({ mode: 'normal', seed: 11 });
    });

    when('I count its solutions', () => {
      count = countSudokuSolutions(puzzle.givens, getSudokuRules('normal'), 2);
    });

    then('solution count should be exactly one', () => {
      expect(count).toBe(1);
    });
  });
});
