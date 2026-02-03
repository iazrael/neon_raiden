import React, { useEffect, useRef, useState } from 'react';
import { ReactEngine } from './src/engine/ReactEngine';
import { GameUI } from './components/GameUI';
import { WeaponType, ClickType } from './types';

import { SpriteManager } from './src/engine/SpriteManager';
// import ReloadPrompt from './src/views/components/ReloadPrompt';
import { ComboState, GameState } from './src/engine';
import { GAME_CONFIG } from './src/engine/configs';
import { audioPlayer } from './src/engine/audio';
import { DebugConfig } from './src/engine/config/DebugConfig';

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ReactEngine | null>(null);

    // React State for UI Sync
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameState, setGameState] = useState<GameState>(GameState.MENU);
    const [hp, setHp] = useState(100);
    const [bombs, setBombs] = useState(0);
    const [shieldPercent, setShieldPercent] = useState(0);
    const [showLevelTransition, setShowLevelTransition] = useState(false);
    const [levelTransitionTimer, setLevelTransitionTimer] = useState(0);
    const [maxLevelReached, setMaxLevelReached] = useState(1);
    const [stateBeforeGallery, setStateBeforeGallery] = useState<GameState>(GameState.MENU);
    const [showBossWarning, setShowBossWarning] = useState(false);
    const [comboState, setComboState] = useState<ComboState>({ count: 0, timer: 0, level: 0, maxCombo: 0, hasBerserk: false }); // P2 Combo
    const [weaponType, setWeaponType] = useState<WeaponType>(WeaponType.VULCAN); // P2 Current weapon
    const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponType | null>(null); // P2 Secondary weapon
    const [weaponLevel, setWeaponLevel] = useState<number>(1);
    const [boss, setBoss] = useState<{ hp: number; maxHp: number } | null>(null); // Boss 血条数据
    const [performanceData, setPerformanceData] = useState<{ fps: number; frameTime: number } | null>(null); // 性能监控数据

    // 性能监控滑动窗口（保存最近 60 帧的数据）
    const frameTimesRef = useRef<number[]>([]);

    useEffect(() => {
        // Preload assets - both old and new systems
        Promise.all([
            SpriteManager.preloadAll(),
        ]).then(() => {
            console.log('[App] All assets preloaded');
        });

        // 隐藏加载指示器
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        // 解析URL参数以确定是否启用调试模式
        const urlParams = new URLSearchParams(window.location.search);
        const isMaster = urlParams.has('master');
        const debugMode = urlParams.get('debug') === '1';
        const bossDivisor = parseInt(urlParams.get('boss') || '1');

        // 如果是master模式且debug=1，则启用调试模式
        if (isMaster && debugMode) {
            GAME_CONFIG.debug = true;
            GAME_CONFIG.debugBossDivisor = Math.max(1, bossDivisor);
        }

        if (!canvasRef.current) return;

        // Initialize ReactEngine
        const engine = new ReactEngine(
            canvasRef.current,
            (newScore) => setScore(newScore),
            (newLevel) => setLevel(newLevel),
            (newState) => setGameState(newState),
            (newHp) => setHp(newHp),
            (newBombs) => setBombs(newBombs),
            (maxLevel) => setMaxLevelReached(maxLevel),
            (show) => setShowBossWarning(show),
            (newComboState) => setComboState(newComboState),
            (newBoss) => setBoss(newBoss)
        );
        engineRef.current = engine;

        // ReactEngine 内部通过 snapshot$ 同步状态，不需要手动动画循环
        // 只需要定期同步额外的 UI 状态
        const syncInterval = setInterval(() => {
            setShowLevelTransition(engine.showLevelTransition);
            setLevelTransitionTimer(engine.levelTransitionTimer);
            setWeaponType(engine.weaponId as any as WeaponType);
            setSecondaryWeapon(engine.secondaryWeapon as any as WeaponType);
            setWeaponLevel(engine.weaponLevel);
            setShieldPercent(engine.getShieldPercent());
            setBombs(engine.bombs);
        }, 100); // 每 100ms 同步一次 UI 状态

        return () => {
            clearInterval(syncInterval);
        };
    }, []);

    // 性能监控流订阅
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;

        const performanceSubscription = engine.performanceStream?.subscribe((snapshot) => {
            if (!snapshot) return;

            const frameTimes = frameTimesRef.current;

            if (DebugConfig.performance.enabled) {
                // 添加当前帧时间
                frameTimes.push(snapshot.frameTime);

                // 只保留最近 60 帧（约 1 秒）
                if (frameTimes.length > 60) {
                    frameTimes.shift();
                }

                // 计算平均帧时间
                const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
                const avgFps = 1000 / avgFrameTime;

                setPerformanceData({ fps: avgFps, frameTime: avgFrameTime });
            } else {
                // 清空数据
                frameTimes.length = 0;
                setPerformanceData(null);
            }
        });

        return () => {
            performanceSubscription?.unsubscribe();
        };
    }, []);

    // P 键切换性能监控
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'p' || e.key === 'P') {
                const newState = !DebugConfig.performance.enabled;
                DebugConfig.performance.enabled = newState;

                // 同步更新 PerformanceMonitor 的配置
                const engine = engineRef.current;
                if (engine) {
                    const monitor = (engine as any).engine?.performanceMonitor;
                    if (monitor?.updateConfig) {
                        monitor.updateConfig({ enabled: newState });
                    }
                }

                console.log('[Debug] Performance Monitor:', newState ? 'ON' : 'OFF');
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const handleStart = () => {
        engineRef.current?.startGame();
    };

    const handleBomb = (x?: number, y?: number) => {
        engineRef.current?.triggerBomb(x, y);
    };

    const playClick = (type: ClickType = ClickType.DEFAULT) => {
        audioPlayer.playClick(type);
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden touch-none select-none">
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
            />
            <GameUI
                state={gameState as any as GameState}
                score={score}
                level={level}
                hp={hp}
                bombs={bombs}
                onStart={handleStart}
                onRestart={handleStart}
                onUseBomb={handleBomb}
                showLevelTransition={showLevelTransition}
                levelTransitionTimer={levelTransitionTimer}
                maxLevelReached={maxLevelReached}
                showBossWarning={showBossWarning}
                comboState={comboState}
                weaponType={weaponType}
                secondaryWeapon={secondaryWeapon}
                weaponLevel={weaponLevel}
                shieldPercent={shieldPercent}
                boss={boss}
                performanceData={performanceData}
                onOpenGallery={() => {
                    setStateBeforeGallery(gameState);
                    if (gameState === GameState.PLAYING) {
                        engineRef.current?.pause();
                    }
                    setGameState(GameState.GALLERY);
                }}
                onCloseGallery={() => {
                    if (stateBeforeGallery === GameState.PLAYING) {
                        engineRef.current?.resume();
                    }
                    setGameState(stateBeforeGallery);
                }}
                playClick={playClick}
                onBackToMenu={() => {
                    engineRef.current?.stop();
                    setGameState(GameState.MENU);
                }}
                onPause={() => engineRef.current?.pause()}
                onResume={() => engineRef.current?.resume()}
            />
            {
                // <ReloadPrompt />
            }
        </div>
    );
}

export default App;
