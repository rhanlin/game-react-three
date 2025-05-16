'use client';

import { useGame } from './GameContext';
import { useEffect, useRef, useState } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { Mesh, MeshPhysicalMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { soundManager } from './soundManager';

const FOOD_ICONS = [
  '/foods/burger.png',
  '/foods/pizza.png',
  '/foods/ramen.png',
  '/foods/fries.png',
  '/foods/chicken.png',
  '/foods/cake.png',
];
const FOOD_EMOJIS = ['🍔','🍕','🍜','🍟','🍗','🍰'];
const FLAG_EMOJIS = ['🥢','🍴'];
const MINE_EMOJIS = ['🌶️','💣'];
const NUMBER_COLORS = ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C']

function Cell({ x, y, value, revealed, flagged }: { 
  x: number; 
  y: number; 
  value: number; 
  revealed: boolean; 
  flagged: boolean;
}) {
  const { revealCell, toggleFlag, gameState } = useGame();
  const meshRef = useRef<Mesh>(null);
  const hoverRef = useRef(false);
  const materialRef = useRef<MeshPhysicalMaterial>(null);
  const [foodAnim, setFoodAnim] = useState(0); // 0:靜止, 1:動畫中
  const foodAnimRef = useRef(0);
  const prevRevealed = useRef(revealed);
  // 隨機食物icon
  const foodIdx = (x * 13 + y * 7) % FOOD_ICONS.length;
  const foodEmoji = FOOD_EMOJIS[foodIdx];
  const flagEmoji = FLAG_EMOJIS[(x + y) % FLAG_EMOJIS.length];
  const mineEmoji = MINE_EMOJIS[(x + y) % MINE_EMOJIS.length];
  // const foodTexture = useLoader(TextureLoader, foodIcon); // 若要用貼圖

  useEffect(() => {
    if (!prevRevealed.current && revealed && value > 0) {
      foodAnimRef.current = 0.01;
      setFoodAnim(0.01);
    }
    // 若遊戲重置（revealed 變 false），重置動畫狀態
    if (!revealed) {
      foodAnimRef.current = 0;
      setFoodAnim(0);
    }
    prevRevealed.current = revealed;
  }, [revealed, value]);

  useFrame((state, delta) => {
    if (meshRef.current && !revealed) {
      if (hoverRef.current) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.2;
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.1;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        meshRef.current.rotation.y = 0;
        meshRef.current.position.y = 0;
        meshRef.current.scale.set(1, 1, 1);
      }
      if (materialRef.current) {
        materialRef.current.emissive.set(hoverRef.current ? '#FFD700' : '#000000');
        materialRef.current.emissiveIntensity = hoverRef.current ? 1.2 : 0;
        materialRef.current.needsUpdate = true;
      }
    }
    // 食物icon動畫
    if (foodAnimRef.current > 0) {
      foodAnimRef.current += delta * 2; // 0~1, 0.5秒
      if (foodAnimRef.current >= 1) {
        foodAnimRef.current = 0;
        setFoodAnim(0);
      } else {
        setFoodAnim(foodAnimRef.current);
      }
    }
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    hoverRef.current = false;
    if (e.button === 0) {
      const opened = revealCell(x, y);
      if (value === -1 && !revealed) {
        setTimeout(() => soundManager.play('mine'), 100);
      }
      if (opened >= 3) {
        soundManager.play('click2');
      } else {
        soundManager.play('click');
      }
    } else if (e.button === 2) {
      toggleFlag(x, y);
    }
  };

  // 主題色盤
  const getColor = () => {
    if (!revealed) return '#49d9fc'; // 麵包金
    if (value === -1) return '#ff7043'; // 地雷: 番茄紅
    return '#fcf8eb';
  };

  // 計算從中心點出發的位置
  const boardSize = gameState.board.length;
  const centerOffset = (boardSize - 1) / 2;
  const posX = x - centerOffset;
  const posZ = y - centerOffset;

  return (
    <group position={[posX, 0, posZ]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onContextMenu={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!revealed) hoverRef.current = true;
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          hoverRef.current = false;
        }}
        position={[0, 0, 0]}
      >
        {/* 圓角方塊 */}
        <boxGeometry args={[0.92, 0.92, 0.92]} />
        <meshPhysicalMaterial
          ref={materialRef}
          color={getColor()}
          transparent
          opacity={revealed ? 0.7 : 0.92}
          metalness={0.2}
          roughness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.2}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>
      {/* 揭開且非地雷且非0，顯示數字+食物icon */}
      {revealed && value > 0 && (
        <Billboard>
          <group position={[0, 0.85, 0]}>
            <Text
              fontSize={0.5}
              color={NUMBER_COLORS[(value - 1) % NUMBER_COLORS.length]}
              anchorX="center"
              anchorY="middle"
              outlineColor="#fffbe6"
              outlineWidth={0.03}
            >
              {value}
            </Text>
            {/* 食物icon動畫，動畫結束後 entity 不再 render */}
            {foodAnim > 0 && foodAnim < 1 && (
              <group position={[0, -0.45 + foodAnim * 1.2, 0]}>
                <Text
                  fontSize={0.32}
                  color={`rgba(255,213,79,${1 - foodAnim})`}
                  anchorX="center"
                  anchorY="middle"
                >
                  {foodEmoji}
                </Text>
              </group>
            )}
          </group>
        </Billboard>
      )}
      {/* 插旗顯示筷子/叉子emoji */}
      {flagged && !revealed && (
        <Billboard>
          <Text
            position={[0, 0.85, 0]}
            fontSize={0.5}
            color="#81c784"
            anchorX="center"
            anchorY="middle"
          >
            {flagEmoji}
          </Text>
        </Billboard>
      )}
      {/* 地雷顯示辣椒emoji */}
      {revealed && value === -1 && (
        <Billboard>
          <Text
            position={[0, 0.85, 0]}
            fontSize={0.5}
            color="#ff7043"
            anchorX="center"
            anchorY="middle"
          >
            {mineEmoji}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

export default function GameBoard() {
  const { gameState, initializeGame } = useGame();

  useEffect(() => {
    initializeGame('easy');
  }, [initializeGame]);


  if (!gameState.board.length) return null;

  return (
    <group>
      {gameState.board.map((row, y) =>
        row.map((value, x) => (
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            value={value}
            revealed={gameState.revealed[y][x]}
            flagged={gameState.flagged[y][x]}
          />
        ))
      )}
    </group>
  );
} 