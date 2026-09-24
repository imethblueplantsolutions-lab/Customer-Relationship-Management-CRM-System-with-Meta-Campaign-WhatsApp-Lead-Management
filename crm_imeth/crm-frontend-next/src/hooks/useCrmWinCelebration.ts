"use client";

import { useEffect, useRef } from "react";
import useSound from "use-sound";
import confetti from "canvas-confetti";

/**
 * Custom hook to trigger a gamified celebration (audio chime + visual emoji & green confetti)
 * strictly once when a lead transitions into the "CONVERTED" stage.
 *
 * Featured celebration emojis: 🎉 🥂 🎇 🎈
 *
 * @param currentStage - The current pipeline status of the lead (e.g., 'CONVERTED', 'Converted')
 */
export function useCrmWinCelebration(currentStage: string | undefined) {
  const [playSuccessSound] = useSound("/sounds/crm-win-notification.mp3", {
    volume: 0.5,
  });

  const normalizedStage = currentStage?.toUpperCase() || "";
  const previousStageRef = useRef<string>(normalizedStage);

  useEffect(() => {
    // Only fire if transitioning from a non-converted stage into CONVERTED
    if (
      previousStageRef.current !== "CONVERTED" &&
      normalizedStage === "CONVERTED"
    ) {
      // 1. Play celebration audio chime
      try {
        playSuccessSound();
      } catch (err) {
        console.warn("[useCrmWinCelebration] Audio playback error:", err);
      }

      // 2. Trigger celebration confetti & emoji bursts (🎉 🥂 🎇 🎈)
      try {
        const scalar = 2.2;
        const emojiShapes = [
          confetti.shapeFromText({ text: "🎉", scalar }),
          confetti.shapeFromText({ text: "🥂", scalar }),
          confetti.shapeFromText({ text: "🎇", scalar }),
          confetti.shapeFromText({ text: "🎈", scalar }),
        ];

        // Primary: CRM green confetti shimmer
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#059669", "#10B981", "#34D399"],
          zIndex: 9999,
        });

        // Secondary: Floating celebration emojis (🎉 🥂 🎇 🎈)
        confetti({
          particleCount: 45,
          spread: 90,
          origin: { y: 0.6 },
          shapes: emojiShapes,
          scalar,
          zIndex: 9999,
        });
      } catch (err) {
        console.warn("[useCrmWinCelebration] Confetti error:", err);
      }
    }

    // Immediately record current stage to prevent repeat triggers on subsequent renders
    previousStageRef.current = normalizedStage;
  }, [normalizedStage, playSuccessSound]);
}
