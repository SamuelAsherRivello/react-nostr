import React from 'react';
import Box from '@mui/material/Box';
import { Cube, GameState } from './App';
import { ButtonGroup, Button, TextField, Typography } from '@mui/material';

interface GameStateRendererProps {
  gameState: GameState;
  onCubeClick: (cube: Cube) => void;
}

const GameStateRenderer: React.FC<GameStateRendererProps> = ({ gameState, onCubeClick }) => {
  return (
    <Box flexDirection={'column'} display={'flex'} alignItems={'left'} justifyContent={'center'}>
      <Typography sx={{ marginBottom: 2 }}></Typography>

      <Typography variant="caption">Game State Renderer</Typography>
      <ButtonGroup variant="contained" aria-label="outlined primary button group">
        {gameState.cubes.map((cube, index) => (
          <Button key={index} disabled={!cube.isAvailable} onClick={() => onCubeClick(cube)} color="secondary">
            {cube.x}
          </Button>
        ))}
      </ButtonGroup>
      <Typography variant="body1" component="div" sx={{ marginBottom: 2 }}></Typography>
    </Box>
  );
};

export default GameStateRenderer;
