"use client";

import { DownloadIcon, ShareIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type InstallMode = "chromium" | "ios" | "browser" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isRunningStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export default function InstallPwaButton() {
  const [installMode, setInstallMode] = useState<InstallMode>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallHelpOpen, setIsInstallHelpOpen] = useState(false);
  const [isCtaVisible, setIsCtaVisible] = useState(false);

  useEffect(() => {
    if (isRunningStandalone()) {
      return;
    }

    if (isIosDevice()) {
      setInstallMode("ios");
      setIsCtaVisible(true);
      return;
    }

    setInstallMode("browser");
    setIsCtaVisible(true);

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallMode("chromium");
    }

    function onAppInstalled() {
      setDeferredPrompt(null);
      setInstallMode(null);
      setIsCtaVisible(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isCtaVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsCtaVisible(false), 10_000);

    return () => window.clearTimeout(timeoutId);
  }, [isCtaVisible]);

  async function promptChromiumInstall() {
    if (!deferredPrompt) {
      return;
    }

    const prompt = deferredPrompt;
    setDeferredPrompt(null);
    setInstallMode(null);
    setIsCtaVisible(false);

    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      // The browser controls the prompt and may reject it when it is no longer available.
    }
  }

  if (!installMode && !isInstallHelpOpen) {
    return null;
  }

  return (
    <>
      {isCtaVisible && installMode ? (
        <Button
          aria-label="Pasang aplikasi Pesisir"
          className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 h-11 animate-[pwa-install-attention_2s_ease-in-out_5] rounded-full px-4 shadow-lg motion-reduce:animate-none sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
          onClick={() => {
            if (installMode === "ios") {
              setIsInstallHelpOpen(true);
              return;
            }

            if (installMode === "chromium") {
              void promptChromiumInstall();
              return;
            }

            setIsInstallHelpOpen(true);
          }}
        >
          <DownloadIcon aria-hidden="true" />
          Pasang aplikasi
        </Button>
      ) : null}

      <AlertDialog open={isInstallHelpOpen} onOpenChange={setIsInstallHelpOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              {installMode === "ios" ? (
                <ShareIcon aria-hidden="true" />
              ) : (
                <DownloadIcon aria-hidden="true" />
              )}
            </AlertDialogMedia>
            <AlertDialogTitle>Pasang Pesisir di perangkat Anda</AlertDialogTitle>
            <AlertDialogDescription>
              {installMode === "ios" ? (
                <>
                  Ketuk <strong>Bagikan</strong> di browser Safari, lalu pilih{" "}
                  <strong>Tambahkan ke Layar Utama</strong>. Pesisir akan
                  tersedia seperti aplikasi biasa.
                </>
              ) : (
                <>
                  Pilih ikon instalasi di bilah alamat atau buka menu browser,
                  lalu pilih <strong>Pasang Pesisir</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
