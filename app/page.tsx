'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useMemo } from 'react';
import GameBoard from './components/GameBoard';
import GameUI from './components/GameUI';
import { GameProvider, useGame } from './components/GameContext';
import { EffectComposer, Noise, Vignette, Bloom } from '@react-three/postprocessing';

function CameraController() {
  const { camera } = useThree();
  const { gameState } = useGame();
  const boardSize = useMemo(() => gameState.board.length || 8, [gameState.board.length]);

  useEffect(() => {
    const distance = boardSize * 1.2;
    const height = distance * 1.2;

    camera.position.set(0, height, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [boardSize, camera]);

  return null;
}

function Scene() {
  return (
    <Canvas 
      camera={{ position: [0, 0, 0], fov: 50 }}
      raycaster={{
        params: {
          Line: { threshold: 0.1 },
          Points: { threshold: 0.1 },
          Mesh: { threshold: 0.1 },
          LOD: {},
          Sprite: {}
        }
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.8} />
        <GameBoard />
        <CameraController />
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 3}
          target={[0, 0, 0]}
        />
        <EffectComposer>
        <Bloom 
            intensity={0.5} 
            luminanceThreshold={0.1}
            luminanceSmoothing={0.8}
          />
          <Noise opacity={0.08} />
          <Vignette darkness={0.2} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <main className="min-h-screen relative overflow-hidden">
        {/* 質感奶油紙背景 */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#f0e4d1] via-[#fdf6e3] to-[#fcf8eb] animate-gradient">
          <div className="absolute inset-0 bg-[url('https://create.viverse.com/assets/standalone/scenes/xnwnzveczw/1747300641/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 opacity-50 mix-blend-multiply" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        {/* 遊戲內容 */}
        <div className="relative z-10 h-screen">
          <Scene />
          <GameUI />
        </div>
      </main>
    </GameProvider>
  );
}