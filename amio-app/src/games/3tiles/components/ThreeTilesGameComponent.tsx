import React from 'react';
import Board from '@/components/Board/Board';
import Slot from '@/components/Slot/Slot';
import TempSlot from '@/components/TempSlot/TempSlot';
import ToolBar from '@/components/ToolBar/ToolBar';
import { GameComponentProps } from '@/types/game-plugin';
import { ThreeTilesState } from '@/games/3tiles/logic';

const ThreeTilesGameComponent: React.FC<GameComponentProps<ThreeTilesState>> = ({
  state,
  onAction,
  onUseTool,
}) => {
  return (
    <>
      <Board
        tiles={state.boardTiles}
        onTileClick={(tile) => onAction({ type: 'tile_click', payload: { tileId: tile.id } })}
      />
      <TempSlot
        stacks={state.tempStacks}
        onStackClick={(positionIndex) => onAction({ type: 'return_temp', payload: { positionIndex } })}
      />
      <Slot tiles={state.slotTiles} />
      <ToolBar
        onUndo={() => onUseTool('undo')}
        onShuffle={() => onUseTool('shuffle')}
        onRemove={() => onUseTool('pop')}
        undoDisabled={state.undoUsed}
        shuffleDisabled={state.shuffleUsed}
        removeDisabled={state.popUsed}
      />
    </>
  );
};

export default ThreeTilesGameComponent;
