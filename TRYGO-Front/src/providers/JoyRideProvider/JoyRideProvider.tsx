import { useLocation } from "react-router-dom";
import Joyride, { CallBackProps, Step } from "react-joyride";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { stepsMap } from "./utils/stepsMap";

export const JoyRideProvider = () => {
  const { pathname } = useLocation();
  const journeys = stepsMap[pathname] || {};

  const showJoyride = useUserStore((state) => state.showJoyride);
  const setShowJoyride = useUserStore((state) => state.setShowJoyride);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Стан для управління туром
  const [run, setRun] = useState(false);
  const [activeJourney, setActiveJourney] = useState<string | null>(null);

  useEffect(() => {
    // Показуємо JoyRide тільки якщо:
    // 1. Користувач аутентифікований
    // 2. Флаг showJoyride встановлений
    // 3. Є доступні тури для поточної сторінки
    if (!isAuthenticated || !showJoyride || !Object.keys(journeys).length) {
      setActiveJourney(null);
      setRun(false);
      return;
    }

    // Запускаємо перший доступний тур
    setActiveJourney("firstJourney");
  }, [pathname, journeys, showJoyride, isAuthenticated]);

  useEffect(() => {
    if (!activeJourney) return;
    const steps: Step[] = journeys[activeJourney];
    if (!steps || !steps.length) return;

    const checkInterval = setInterval(() => {
      const allTargetsExist = steps.every(
        (step) =>
          typeof step.target === "string" && document.querySelector(step.target)
      );

      if (allTargetsExist) {
        clearInterval(checkInterval);
        setTimeout(() => setRun(true), 300);
      }
    }, 300);

    return () => clearInterval(checkInterval);
  }, [pathname, journeys, activeJourney]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, step, type } = data;

    if (type === "step:before") {
      if (index === 0) {
        return;
      }
      if (typeof step.target === "string") {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          const header = document.querySelector("header");
          const headerHeight = 80;
          const viewportHeight = window.innerHeight;
          const rect = targetElement.getBoundingClientRect();

          const isFullyVisible =
            rect.top >= headerHeight && rect.bottom <= viewportHeight;

          if (!isFullyVisible) {
            const elementPosition =
              targetElement.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }
      }
    }

    // Коли тур завершений або пропущений - вимикаємо JoyRide назавжди
    if ((status === "finished" || status === "skipped") && run) {
      setRun(false);
      setActiveJourney(null);
      setShowJoyride(false); // Вимикаємо JoyRide назавжди
    }
  };

  const steps: Step[] = journeys[activeJourney] ? journeys[activeJourney] : [];

  // Не рендеримо Joyride якщо не потрібно показувати
  if (!showJoyride || !isAuthenticated || !activeJourney) {
    return null;
  }

  return (
    <Joyride
      key={activeJourney || "no-journey"}
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      disableScrolling={true}
      styles={{
        tooltip: {
          maxWidth: "320px",
          maxHeight: "220px",
          backgroundColor: "#ffffff",
        },
        options: {
          zIndex: 10000,
          primaryColor: "#2563eb",
          textColor: "#1e293b",
          backgroundColor: "#ffffff",
          arrowColor: "#2563eb",
          overlayColor: "rgba(0, 0, 0, 0.4)",
          spotlightShadow: "0 0 15px rgba(37, 99, 235, 0.4)",
        },
        tooltipContainer: {
          borderRadius: "12px",

          fontFamily: `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
          maxWidth: "320px",
        },
        tooltipTitle: {
          fontWeight: 600,
          fontSize: "25px",
          color: "#0f172a",
          marginBottom: "8px",
        },
        tooltipContent: {
          fontSize: "18px",
          color: "#334155",
          lineHeight: "1.5",
        },
        tooltipFooter: {
          marginTop: "0",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        },
        buttonNext: {
          backgroundColor: "#2563eb",
          border: "none",
          borderRadius: "6px",
          color: "#ffffff",
          padding: "8px 14px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background-color 0.2s",
        },
        buttonBack: {
          backgroundColor: "transparent",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          color: "#475569",
          padding: "8px 14px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background-color 0.2s, border-color 0.2s",
        },
        buttonSkip: {
          backgroundColor: "transparent",
          border: "none",
          color: "#94a3b8",
          fontSize: "14px",
          cursor: "pointer",
        },
      }}
      locale={{
        last: "Ready",
        next: "Next",
        nextLabelWithProgress: "Next",
      }}
    />
  );
};
