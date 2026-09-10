import { BrowserAgent } from "@newrelic/browser-agent/loaders/browser-agent";

// Remaining import statements

const options = {
  info: {
    applicationID: "1120556152",
    beacon: "bam.nr-data.net",
    errorBeacon: "bam.nr-data.net",
    licenseKey: "NRJS-317e2c91ba6684cf827",
    sa: 1,
  },
  init: {
    ajax: {
      deny_list: ["bam.nr-data.net"],
    },
    browser_consent_mode: {
      enabled: false,
    },
    distributed_tracing: {
      enabled: true,
    },
    performance: {
      capture_detail: false,
      capture_marks: false,
      capture_measures: true,
    },
    privacy: {
      cookies_enabled: true,
    },
  },
  loader_config: {
    accountID: 8345926,
    agentID: 1120556152,
    applicationID: 1120556152,
    licenseKey: "NRJS-317e2c91ba6684cf827",
    trustKey: 8345926,
  },
};

// The agent loader code executes immediately on instantiation.
new BrowserAgent(options);

// Remaining code

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
