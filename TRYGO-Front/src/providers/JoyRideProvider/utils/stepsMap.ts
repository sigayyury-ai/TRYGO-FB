import { Step } from "react-joyride";

export const stepsMap: Record<string, Record<string, Step[]>> = {
  "/dashboard": {
    firstJourney: [
      { target: "#hypothesis-header", content: "Select a hypothesis to work with", disableBeacon: true, },
      { target: "#core-header", content: "You're now on the Core page - edit your business fundamentals" },
      { target: "#icp-header", content: "Next, visit the ICP page to define your target audience" },
    ],
  },
  "/gtm": {
    firstJourney: [
      { target: "#hypothesis-header", content: "Ensure you're working with the correct hypothesis", disableBeacon: true, },
      { target: "#gtm-header", content: "You're now on the GTM page" },
      { target: "#core-header", content: "Make sure your Core business model is solid" },
      { target: "#icp-header", content: "Ensure your ICP is well-defined before launching" },
    ],
  },
};