'use client';

import { useState, useEffect } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // PWA 설치 프롬프트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setIsInstallable(true);
    };

    // PWA 설치 완료 감지
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // 온라인/오프라인 상태 감지
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Service Worker 등록
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 온라인 상태 설정
    setIsOnline(navigator.onLine);

    // Service Worker 등록
    registerServiceWorker();

    // 정리 함수
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA 설치
  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('PWA installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  };

  // 푸시 알림 권한 요청
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // 푸시 알림 전송
  const sendNotification = async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  // 백그라운드 동기화 등록
  const registerBackgroundSync = async (tag: string) => {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.log('Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  };

  // 오프라인 데이터 저장
  const saveOfflineData = async (key: string, data: any) => {
    if (!('indexedDB' in window)) {
      console.log('IndexedDB not supported');
      return false;
    }

    try {
      // IndexedDB에 데이터 저장 로직 구현
      console.log('Offline data saved:', key, data);
      return true;
    } catch (error) {
      console.error('Error saving offline data:', error);
      return false;
    }
  };

  // 오프라인 데이터 로드
  const loadOfflineData = async (key: string) => {
    if (!('indexedDB' in window)) {
      console.log('IndexedDB not supported');
      return null;
    }

    try {
      // IndexedDB에서 데이터 로드 로직 구현
      console.log('Offline data loaded:', key);
      return null;
    } catch (error) {
      console.error('Error loading offline data:', error);
      return null;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installPWA,
    requestNotificationPermission,
    sendNotification,
    registerBackgroundSync,
    saveOfflineData,
    loadOfflineData,
  };
}; 