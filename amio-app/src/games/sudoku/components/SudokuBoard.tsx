import React from 'react';
import { View, Text } from '@tarojs/components';
import { SudokuCellValue } from '@/games/sudoku/solver';

interface SudokuBoardProps {
  size: number;
  boxRows: number;
  boxCols: number;
  grid: SudokuCellValue[][];
  givens: SudokuCellValue[][];
  selectedCell: { row: number; col: number } | null;
  errorCells: Array<{ row: number; col: number }>;
  onSelect: (row: number, col: number) => void;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({
  size,
  boxRows,
  boxCols,
  grid,
  givens,
  selectedCell,
  errorCells,
  onSelect,
}) => {
  return (
    <View className="sudoku-board" data-board-size={String(size)}>
      {grid.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="sudoku-row">
          {row.map((value, colIndex) => {
            const isGiven = givens[rowIndex][colIndex] !== null;
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isError = errorCells.some((item) => item.row === rowIndex && item.col === colIndex);
            const isTopBoundary = rowIndex % boxRows === 0;
            const isLeftBoundary = colIndex % boxCols === 0;
            const isBottomBoundary = rowIndex === size - 1;
            const isRightBoundary = colIndex === size - 1;

            const className = [
              'sudoku-cell',
              isGiven ? 'sudoku-cell--given' : '',
              isSelected ? 'sudoku-cell--selected' : '',
              isError ? 'sudoku-cell--error' : '',
              isTopBoundary ? 'sudoku-cell--box-top' : '',
              isLeftBoundary ? 'sudoku-cell--box-left' : '',
              isBottomBoundary ? 'sudoku-cell--box-bottom' : '',
              isRightBoundary ? 'sudoku-cell--box-right' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <View
                key={`cell-${rowIndex}-${colIndex}`}
                className={className}
                data-cell-row={String(rowIndex)}
                data-cell-col={String(colIndex)}
                data-cell-given={isGiven ? 'true' : 'false'}
                data-cell-selected={isSelected ? 'true' : 'false'}
                data-cell-error={isError ? 'true' : 'false'}
                onClick={() => onSelect(rowIndex, colIndex)}
              >
                <Text>{value ?? ''}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default SudokuBoard;
