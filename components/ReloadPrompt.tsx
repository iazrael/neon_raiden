import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt: React.FC = () => {
    const [autoReloadCountdown, setAutoReloadCountdown] = useState(5);

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
            // 每隔1小时检查一次更新
            if (r) {
                setInterval(() => {
                    console.log('Checking for SW updates...');
                    r.update();
                }, 60 * 60 * 1000); // 1 hour
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
        onNeedRefresh() {
            console.log('New content available, update downloaded automatically');
        },
    });

    // 自动倒计时刷新
    useEffect(() => {
        if (needRefresh) {
            const timer = setInterval(() => {
                setAutoReloadCountdown((prev) => {
                    if (prev <= 1) {
                        // 倒计时结束，自动刷新
                        updateServiceWorker(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        } else {
            setAutoReloadCountdown(5); // 重置倒计时
        }
    }, [needRefresh, updateServiceWorker]);

    const handleReloadNow = () => {
        updateServiceWorker(true);
    };

    const handleDismiss = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    // 只在需要刷新时显示提示
    if (!needRefresh) {
        return null;
    }

    // 获取当前版本号
    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'Unknown';

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-slideUp">
            <div className="relative w-[90%] max-w-md p-1 rounded-lg bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ff88] animate-pulse-slow">
                <div className="bg-[#0a0a0a] rounded-lg p-6 border border-[#00ffff]/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#00ff88]">
                            UPDATE READY
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping"></div>
                    </div>

                    {/* Content */}
                    <div className="mb-6 space-y-3">
                        <p className="text-gray-300 font-mono text-sm leading-relaxed">
                            <span>
                                新版本已自动下载完成，点击刷新即可更新。
                                <br />
                                <span className="text-[#00ffff] text-xs mt-1 block">
                                    Version: {currentVersion}
                                </span>
                                <span className="text-[#ff00ff] text-xs mt-1 block">
                                    自动刷新倒计时: {autoReloadCountdown}秒
                                </span>
                            </span>
                        </p>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ff00ff]/50 to-transparent"></div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleReloadNow}
                            className="px-4 py-2 bg-[#00ffff]/10 border border-[#00ffff]/50 text-[#00ffff] rounded hover:bg-[#00ffff]/20 hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all duration-300 font-mono text-sm uppercase tracking-wider"
                        >
                            立即刷新
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 bg-transparent border border-gray-600 text-gray-400 rounded hover:border-gray-400 hover:text-gray-200 transition-all duration-300 font-mono text-sm uppercase tracking-wider"
                        >
                            稍后
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReloadPrompt;
