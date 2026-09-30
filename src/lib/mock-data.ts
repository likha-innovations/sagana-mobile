export type CompostingPhase = 'Mesophilic' | 'Thermophilic' | 'Cooling';

// Helper to determine which step (1-3) the machine is in based on its phase
export const getPhaseStep = (phase: CompostingPhase): number => {
  const phaseMap: Record<CompostingPhase, number> = {
    'Mesophilic': 1,
    'Thermophilic': 2,
    'Cooling': 3,
  };
  return phaseMap[phase] || 1;
};

export const mockDashboardData = {
  metrics: {
    totalCompost: { value: 10.2, unit: "kg" },
    totalGreens: { value: 6.7, unit: "kg" },
    totalBrowns: { value: 5.4, unit: "kg" }
  },
  machines: [
    {
      id: "AIVSP-1",
      name: "AIVSP-1",
      day: 3,
      phase: "Mesophilic" as CompostingPhase,
      sensors: {
        temperature: { value: 57, unit: "°C", color: "#E84C4C" },
        moisture: { value: 23, unit: "%", color: "#51A7B1" },
        oxygen: { value: 67, unit: "%", color: "#DBCC41" },
        carbonDioxide: { value: 0.04, unit: "%", color: "#6CAD6C" }
      }
    },
    {
      id: "AIVSP-2",
      name: "AIVSP-2",
      day: 14,
      phase: "Thermophilic" as CompostingPhase,
      sensors: {
        temperature: { value: 68, unit: "°C", color: "#E84C4C" },
        moisture: { value: 45, unit: "%", color: "#51A7B1" },
        oxygen: { value: 40, unit: "%", color: "#DBCC41" },
        carbonDioxide: { value: 1.2, unit: "%", color: "#6CAD6C" }
      }
    },
    {
      id: "AIVSP-3",
      name: "AIVSP-3",
      day: 28,
      phase: "Cooling" as CompostingPhase,
      sensors: {
        temperature: { value: 35, unit: "°C", color: "#E84C4C" },
        moisture: { value: 30, unit: "%", color: "#51A7B1" },
        oxygen: { value: 85, unit: "%", color: "#DBCC41" },
        carbonDioxide: { value: 0.1, unit: "%", color: "#6CAD6C" }
      }
    }
  ]
};
