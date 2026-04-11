console.log("BACKGROUND STARTED");
let startTime = Date.now();
let activeTime = 0;
let isActive = true;

chrome.tabs.onActivated.addListener(() => {
  startTime = Date.now();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    activeTime += Date.now() - startTime;
    isActive = false;
  } else {
    startTime = Date.now();
    isActive = true;
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "USER_ACTIVE") {
    startTime = Date.now();
  }
});

function getActiveTime() {
  let current = activeTime;
  if (isActive) {
    current += Date.now() - startTime;
  }
  return Math.floor(current / 1000);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_TIME") {
    sendResponse({ time: getActiveTime() });
  }
});

function detectSiteFromUrl(url) {
  if (!url || url.startsWith("chrome://")) return "Unknown";
  if (url.includes("meet.google.com")) return "Google Meet";
  if (url.includes("github.com")) return "GitHub";
  if (url.includes("youtube.com")) return "YouTube";
  return "Other";
}

function pushLiveSnapshot() {
  const timeSpent = getActiveTime();
  const hoursWorked = Math.max(0.01, timeSpent / 3600);

  let sentiment = 0;
  if (timeSpent > 3600) sentiment = 0.5;
  if (timeSpent > 7200) sentiment = 1;

  const tasksCompleted = Math.max(1, Math.floor(timeSpent / 1800));

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let currentSite = "Unknown";
    if (tabs && tabs[0] && tabs[0].url) {
      currentSite = detectSiteFromUrl(tabs[0].url);
    }

    const meetingCount = currentSite === "Google Meet" ? 1 : 0;

    const payload = {
      hours_worked: hoursWorked,
      meetings_count: meetingCount,
      sentiment,
      tasks_completed: tasksCompleted,
      current_site: currentSite,
    };

    console.log("DATA:", payload);

    fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => console.log("RESULT:", data))
      .catch((err) => console.error("ERROR:", err));
  });
}

setInterval(pushLiveSnapshot, 10000);
pushLiveSnapshot();
