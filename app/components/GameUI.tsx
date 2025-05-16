'use client';

import { useGame } from './GameContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import Modal from './Modal';

const ENCOURAGEMENTS = [
  { text: '小心！一不小心就只能吃泡麵了！', emoji: '🍜' },
  { text: '堅持下去，離大餐只差一步！', emoji: '🍱' },
  { text: '別踩地雷，不然午餐就變成白開水！', emoji: '💧' },
  { text: '再撐一下，美食就在前方！', emoji: '🍗' },
  { text: '你真的想吃樓下自助餐嗎？', emoji: '😱' },
  { text: '冷靜！美食就在下一格！', emoji: '🍣' },
  { text: '踩到地雷就只能吃草了喔！', emoji: '🥦' },
  { text: '午餐命運掌握在你手裡！', emoji: '🤲' },
  { text: '別緊張，踩錯就吃泡麵！', emoji: '🍜' },
  { text: '想吃大餐就要小心翼翼！', emoji: '🍲' },
  { text: '再一格就能吃美食了！', emoji: '🍣' },
  { text: '你離美食只差一點運氣！', emoji: '🎲' },
  { text: '別讓午餐變成悲劇！', emoji: '😭' },
  { text: '這一格會不會是地雷呢？', emoji: '💣' },
  { text: '美食與地雷只差一線之隔！', emoji: '🍔' },
];

const FLOATING_FOODS = [
  { src: '/foods/burger.png', size: 'w-20 h-20 sm:w-32 sm:h-32' },
  { src: '/foods/pizza.png', size: 'w-20 h-20 sm:w-32 sm:h-32' },
  { src: '/foods/ramen.png', size: 'w-20 h-20 sm:w-32 sm:h-32' },
  { src: '/foods/fries.png', size: 'w-20 h-20 sm:w-32 sm:h-32' },
  { src: '/foods/chicken.png', size: 'w-20 h-20 sm:w-32 sm:h-32' },
  { src: '/foods/cake.png', size: 'w-20 h-20 sm:w-32 sm:h-32' },
  { src: '/foods/burger.png', size: 'w-24 h-24 sm:w-40 sm:h-40' },
  { src: '/foods/pizza.png', size: 'w-24 h-24 sm:w-40 sm:h-40' },
  { src: '/foods/ramen.png', size: 'w-24 h-24 sm:w-40 sm:h-40' },
  { src: '/foods/fries.png', size: 'w-24 h-24 sm:w-40 sm:h-40' },
  { src: '/foods/chicken.png', size: 'w-24 h-24 sm:w-40 sm:h-40' },
  { src: '/foods/cake.png', size: 'w-24 h-24 sm:w-40 sm:h-40' },
];

function FloatingFoods() {
  const [foods, setFoods] = useState<Array<{ id: number; x: number; y: number; scale: number; rotation: number; duration: number; delay: number; opacity: number; z: number }>>([]);
  const timers = useRef<{ [id: number]: NodeJS.Timeout }>({});

  function genFood(index: number) {
    const scale = Math.random() * 0.8 + 0.8;
    const opacity = 0.5 + (scale - 0.8) / 1.0 * 0.5;
    const z = Math.round(scale * 100);
    return {
      id: index,
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 10,
      scale,
      rotation: Math.random() * 360,
      duration: Math.random() * 10 + 12,
      delay: Math.random() * 5,
      opacity,
      z,
    };
  }

  function scheduleUpdate(index: number) {
    const timeout = setTimeout(() => {
      setFoods(prev =>
        prev.map((f, i) => (i === index ? genFood(index) : f))
      );
      scheduleUpdate(index);
    }, Math.random() * 5000 + 4500); // 4.5~9.5 秒
    timers.current[index] = timeout;
  }

  useEffect(() => {
    setFoods(FLOATING_FOODS.map((_, index) => genFood(index)));
  }, []);

  useEffect(() => {
    if (foods.length === 0) return;
    foods.forEach((_, i) => scheduleUpdate(i));
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line
  }, [foods.length]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {foods.map((food, index) => (
        <div
          key={food.id}
          className={`absolute ${FLOATING_FOODS[index].size} animate-bgfood z-50`}
          style={{
            left: `${food.x}%`,
            top: `${food.y}%`,
            animationDuration: `${food.duration}s`,
            animationDelay: `${food.delay}s`,
            zIndex: food.z,
            '--max-opacity': food.opacity,
            '--init-scale': food.scale,
            '--init-rotate': `${food.rotation}deg`,
          } as React.CSSProperties}
        >
          <img
            src={FLOATING_FOODS[index].src}
            alt="floating food"
            className="w-full h-full object-contain select-none"
            draggable={false}
            style={{
              transform: 'scale(var(--init-scale,1)) rotate(var(--init-rotate,0deg))',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function GameUI() {
  const { gameState, initializeGame, getRandomLunch, setEncouragementRef, setFoodOptions } = useGame();
  const [isMinimized, setIsMinimized] = useState(false);
  const [encouragements, setEncouragements] = useState<{
    id: number;
    text: string;
    emoji: string;
    position: { top?: string; right?: string; bottom?: string; left?: string; };
  }[]>([]);
  const [showFoodInput, setShowFoodInput] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [favoriteFood, setFavoriteFood] = useState<string[]>(gameState.favoriteFood);
  const [normalFood, setNormalFood] = useState<string[]>(gameState.normalFood);
  const [favoriteInput, setFavoriteInput] = useState('');
  const [normalInput, setNormalInput] = useState('');
  const [lunchResult, setLunchResult] = useState<string>('');
  const [mascotAnim, setMascotAnim] = useState<'idle' | 'shake' | 'happy'>('idle');

  useEffect(() => {
    if (gameState.gameOver || gameState.gameWon) {
      setEncouragements([]);
      setLunchResult(getRandomLunch());
    }
  }, [gameState.gameOver, gameState.gameWon, getRandomLunch]);

  useEffect(() => {
    if (gameState.gameOver) {
      setMascotAnim('shake');
      setTimeout(() => setMascotAnim('idle'), 600);
    } else if (gameState.gameWon) {
      setMascotAnim('happy');
      setTimeout(() => setMascotAnim('idle'), 1300);
    } else {
      setMascotAnim('idle');
    }
  }, [gameState.gameOver, gameState.gameWon]);

  const handleShowEncouragement = useCallback(() => {
    if (gameState.gameOver || gameState.gameWon) return;
    const positions = [
      { top: '25%', left: '25%' },
      { top: '25%', right: '25%' },
      { bottom: '25%', left: '25%' },
      { bottom: '25%', right: '25%' },
      { top: '50%', left: '25%' },
      { top: '50%', right: '25%' },
      { bottom: '50%', left: '25%' },
      { bottom: '50%', right: '25%' },
    ];
    const randomPosition = positions[Math.floor(Math.random() * positions.length)];
    const randomEncouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    const id = Date.now() + Math.random();
    setEncouragements(prev => [...prev, { ...randomEncouragement, position: randomPosition, id }]);
    setTimeout(() => {
      setEncouragements(prev => prev.filter(e => e.id !== id));
    }, 1500);
  }, [gameState.gameOver, gameState.gameWon]);

  useEffect(() => {
    setEncouragementRef(handleShowEncouragement);
  }, [handleShowEncouragement, setEncouragementRef]);

  const handleDifficultyChange = (difficulty: 'easy' | 'medium' | 'hard') => {
    initializeGame(difficulty);
  };

  const handleFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFoodOptions(favoriteFood, normalFood);
    setShowFoodInput(false);
  };

  const handleAddFavorite = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && favoriteInput.trim()) {
      e.preventDefault();
      setFavoriteFood(prev => [...prev, favoriteInput.trim()]);
      setFavoriteInput('');
    }
  };

  const handleAddNormal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && normalInput.trim()) {
      e.preventDefault();
      setNormalFood(prev => [...prev, normalInput.trim()]);
      setNormalInput('');
    }
  };

  const removeFavorite = (index: number) => {
    setFavoriteFood(prev => prev.filter((_, i) => i !== index));
  };

  const removeNormal = (index: number) => {
    setNormalFood(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="absolute top-0 left-0 w-full p-4">
      <FloatingFoods />
      <img
        src="/game-player.png"
        alt="玩家"
        className={`fixed right-4 -bottom-4 w-64 h-auto lg:w-[33vw] xl:w-[33vw] 2xl:w-[33vw] z-20 pointer-events-none select-none drop-shadow-xl ${mascotAnim === 'shake' ? 'mascot-shake' : mascotAnim === 'happy' ? 'mascot-happy' : 'mascot-bounce'}`}
        style={{
          filter: gameState.gameOver
            ? 'grayscale(0.3) brightness(0.95)'
            : '',
          transition: 'filter 0.3s',
        }}
      />
      <Modal open={showWelcome}>
        <div className="bg-white/95 p-8 rounded-3xl shadow-xl w-full border-5 border-[#ffb347]">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-extrabold text-[#ffb347]">
              午餐吃什麼？
            </h1>
            <p className="text-[#a67c52] text-lg text-left font-semibold">
              還不知道午餐吃什麼？挑戰掃雷成功就能享用美食，踩錯一步的話... 就只能隨便吃吃啦！
            </p>
            <div className="space-y-4">
              <div className="bg-[#4ec3e0]/10 p-4 rounded-2xl ">
                <h2 className="text-2xl font-bold text-[#4ec3e0] mb-4">遊戲規則</h2>
                <ul className="text-[#4ec3e0] space-y-2 text-left font-bold">
                  <li>• 左鍵點擊：揭開格子</li>
                  <li>• 右鍵點擊：插旗/取消插旗</li>
                  <li>• 數字代表周圍8格中的地雷數量</li>
                  <li>• 贏了可以吃大餐，輸了就...隨便吃!</li>
                </ul>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full py-4 bg-[#ffb347] text-white rounded-2xl hover:bg-[#ff914d] transition-all shadow font-extrabold text-2xl border-5 border-[#ffb347]"
              >
                餓了！開始吧
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal open={!showWelcome && showFoodInput}>
        <div className="bg-white/95 p-8 rounded-3xl shadow-xl w-full border-5 border-[#ffb347]">
          <h2 className="text-4xl font-extrabold text-[#ffb347] mb-6 text-center">
            設定你的午餐選項
          </h2>
          <form onSubmit={handleFoodSubmit} className="space-y-6">
            <div>
              <label className="block font-bold text-[#ffb347] mb-2">
                想吃好一點的
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={favoriteInput}
                  onChange={(e) => setFavoriteInput(e.target.value)}
                  onKeyDown={handleAddFavorite}
                  className="text-[#ffb347] flex-1 px-4 py-2 bg-white/80 border-2 border-[#ffb347] rounded-xl focus:ring-2 focus:ring-[#ffb347] focus:border-[#ffb347] placeholder-[#ffb347]/50 font-bold"
                  placeholder="輸入餐廳名稱後按 Enter 新增"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {favoriteFood.map((food, index) => (
                  <div key={index} className="bg-white/20 text-gray-400 text-sm px-3 py-1 rounded-full flex items-center gap-2 border-2 border-gray-400 font-bold">
                    <span>{food}</span>
                    <button
                      type="button"
                      onClick={() => removeFavorite(index)}
                      className="text-gray-400 hover:text-[#ffb347] font-extrabold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-bold text-[#ffb347] mb-2">
                簡單吃吃的選擇
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={normalInput}
                  onChange={(e) => setNormalInput(e.target.value)}
                  onKeyDown={handleAddNormal}
                  className="text-[#ffb347] flex-1 px-4 py-2 bg-white/80 border-2 border-[#ffb347] rounded-xl focus:ring-2 focus:ring-[#ffb347] focus:border-[#ffb347] placeholder-[#ffb347]/50 font-bold"
                  placeholder="輸入餐廳名稱後按 Enter 新增"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {normalFood.map((food, index) => (
                  <div key={index} className="bg-white/20 text-gray-400 text-sm px-3 py-1 rounded-full flex items-center gap-2 border-2 border-gray-400 font-bold">
                    <span>{food}</span>
                    <button
                      type="button"
                      onClick={() => removeNormal(index)}
                      className="text-gray-400 hover:text-gray-400 font-extrabold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#ffb347] text-white rounded-2xl hover:bg-[#ff914d] transition-all shadow font-extrabold text-2xl border-5 border-[#ffb347]"
            >
              開始
            </button>
          </form>
        </div>
      </Modal>
      <Modal open={gameState.gameOver || gameState.gameWon} minimized={isMinimized}>
        <div className={`bg-white/95 p-8 rounded-3xl shadow-xl text-center border-5 border-[#ffb347] w-full transform transition-all duration-500 ${isMinimized ? 'scale-100' : 'scale-100 hover:scale-105'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="text-6xl animate-bounce">
              {gameState.gameWon ? '🎉' : '💥'}
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isMinimized ? '⬆' : '⬇'}
            </button>
          </div>
          <h2 className="text-4xl font-extrabold mb-6 text-[#ffb347]">
            {gameState.gameWon ? '恭喜你贏了！' : '遊戲結束'}
          </h2>
          <div className="bg-gray-500/10 p-6 rounded-2xl shadow-inner mb-6">
            <p className="text-xl text-[#a67c52] mb-2 font-bold">
              今天的午餐是：
            </p>
            <span className="text-3xl font-bold text-[#ffb347] block mt-2">
              {lunchResult}
            </span>
            {gameState.gameWon && (
              <p className="text-[#4ec3e0] mt-4 text-lg font-bold">
                完美通關！吃大餐 🏆
              </p>
            )}
          </div>
          <button
            onClick={() => handleDifficultyChange(gameState.difficulty)}
            className="w-full py-4 bg-[#ffb347] text-white rounded-2xl hover:bg-[#ff914d] transition-all shadow font-extrabold text-2xl border-5 border-[#ffb347]"
          >
            再玩一次
          </button>
        </div>
      </Modal>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleDifficultyChange('easy')}
            className="px-6 py-2 bg-[#4ec3e0] text-white rounded-2xl hover:bg-[#319db5] transition-all shadow font-bold border-2 border-[#4ec3e0]"
          >
            簡單
          </button>
          <button
            onClick={() => handleDifficultyChange('medium')}
            className="px-6 py-2 bg-[#ffb347] text-white rounded-2xl hover:bg-[#ff914d] transition-all shadow font-bold border-2 border-[#ffb347]"
          >
            中等
          </button>
          <button
            onClick={() => handleDifficultyChange('hard')}
            className="px-6 py-2 bg-[#ff914d] text-white rounded-2xl hover:bg-[#a67c52] transition-all shadow font-bold border-2 border-[#ff914d]"
          >
            困難
          </button>
        </div>
        <button
          onClick={() => setShowFoodInput(true)}
          className="px-6 py-2 bg-white text-[#4ec3e0] rounded-2xl hover:bg-[#ffb347] hover:text-white transition-all shadow font-bold border-2 border-[#4ec3e0]"
        >
          修改餐廳
        </button>
      </div>

      {encouragements.map(e => (
        <div 
          key={e.id}
          className="fixed transform -translate-x-1/2 -translate-y-1/2 animate-bounce z-50
            bottom-4 left-1/2 sm:bottom-auto sm:left-auto"
          style={{
            animationDuration: '1s',
            ...(window.innerWidth >= 640 ? e.position : {})
          }}
        >
          <div className="bg-[#fdf6e3] px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg flex items-center gap-2 border-2 border-[#4ec3e0] 
            min-w-[280px] max-w-[90vw] sm:min-w-0 sm:max-w-none">
            <span className="text-xl sm:text-2xl">{e.emoji}</span>
            <span className="text-base sm:text-lg font-extrabold text-[#a67c52] whitespace-normal">{e.text}</span>
          </div>
        </div>
      ))}

      <div className="mt-4 text-sm text-[#a67c52] font-bold">
        <p>操作說明：</p>
        <ul className="list-disc list-inside">
          <li>左鍵點擊：揭開格子</li>
          <li>右鍵點擊：插旗/取消插旗</li>
          <li>數字代表周圍8格中的地雷數量</li>
        </ul>
      </div>
    </div>
  );
} 