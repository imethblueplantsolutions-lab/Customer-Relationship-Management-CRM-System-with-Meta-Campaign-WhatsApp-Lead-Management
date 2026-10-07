"use client";

import { useEffect, useRef, useCallback } from "react";
import useSound from "use-sound";
import confetti from "canvas-confetti";

let lastCelebrationTimestamp = 0;

/**
 * Fires the localized button celebration effect studied from utils_codes/confeti.html.
 * Creates a dedicated canvas anchored to the button wrapper and bursts confetti
 * with exact matching parameters:
 * - particleCount: 200
 * - spread: 200
 * - startVelocity: 15
 * - scalar: 0.9
 * - ticks: 90
 */
export function fireConvertedButtonConfetti(targetContainer?: HTMLElement | null) {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastCelebrationTimestamp < 350) return; // Prevent duplicate rapid bursts
  lastCelebrationTimestamp = now;

  try {
    let container = targetContainer || null;

    // If container is not provided or is hidden (offsetParent is null when display: none),
    // automatically find the currently visible .button-wrapper in the active viewport (mobile vs desktop)
    if (!container || container.offsetParent === null) {
      const visibleWrapper = Array.from(
        document.querySelectorAll<HTMLElement>(".button-wrapper")
      ).find((el) => el.offsetParent !== null);
      if (visibleWrapper) {
        container = visibleWrapper;
      }
    }

    if (!container) {
      container = document.body;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    canvas.style.position = "absolute";
    canvas.style.top = "50%";
    canvas.style.left = "50%";
    canvas.style.transform = "translate(-50%, -50%)";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "50";

    container.appendChild(canvas);

    const confettiButton = confetti.create(canvas, {
      resize: false,
      useWorker: true,
    });

    confettiButton({
      particleCount: 200,
      spread: 360,
      startVelocity: 15,
      scalar: 0.9,
      ticks: 90,
    })?.then(() => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    });
  } catch (err) {
    console.warn("[fireConvertedButtonConfetti] Error firing confetti:", err);
  }
}

/**
 * Custom hook to trigger the button celebration effect when transitioning into the "CONVERTED" stage,
 * or when manually invoking triggerCelebration().
 *
 * @param currentStage - The current pipeline status of the lead (e.g., 'CONVERTED')
 * @param containerRef - Optional React ref to the Converted button wrapper element
 */
export function useCrmWinCelebration(
  currentStage?: string,
  containerRef?: React.RefObject<HTMLElement | null>
) {
  const [playSuccessSound] = useSound("/sounds/crm-win-notification.mp3", {
    volume: 0.5,
  });

  const normalizedStage = currentStage?.toUpperCase() || "";
  const previousStageRef = useRef<string>(normalizedStage);

  const triggerCelebration = useCallback((customContainer?: HTMLElement | null) => {
    try {
      playSuccessSound();
    } catch (err) {
      console.warn("[useCrmWinCelebration] Audio playback error:", err);
    }
    const target = customContainer || containerRef?.current;
    fireConvertedButtonConfetti(target);
  }, [containerRef, playSuccessSound]);

  useEffect(() => {
    // Only fire if transitioning from a non-converted stage into CONVERTED
    if (
      previousStageRef.current !== "CONVERTED" &&
      normalizedStage === "CONVERTED"
    ) {
      triggerCelebration();
    }

    // Record stage to prevent repeat triggers on rerenders
    previousStageRef.current = normalizedStage;
  }, [normalizedStage, triggerCelebration]);

  return { triggerCelebration };
}
