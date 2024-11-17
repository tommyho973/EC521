// popup.js

// Close popup when the close button is clicked
document.getElementById("closeButton").addEventListener("click", () => {
  window.close();
});

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id; // Get the active tab ID
      if (!tabId) {
          console.error("No active tab found.");
          return;
      }

      // Inject content.js into the current tab
      chrome.scripting.executeScript(
          {
              target: { tabId: tabId },
              files: ["content.js"]
          },
          () => {
              if (chrome.runtime.lastError) {
                  console.error("Content script injection failed:", chrome.runtime.lastError);
                  document.getElementById("link-list").innerHTML = "<li>No links found. Try reloading the page.</li>";
              } else {
                  console.log("Content script injected successfully.");
                  // Send a message to the content script to extract links
                  chrome.tabs.sendMessage(tabId, { action: "getLinks" }, (response) => {
                      if (chrome.runtime.lastError) {
                          console.error("Error communicating with content script:", chrome.runtime.lastError);
                          document.getElementById("link-list").innerHTML = "<li>No links found. Try reloading the page.</li>";
                      } else if (response && response.links) {
                          console.log("Links received from content script:", response.links);
                          checkLinksWithSafeBrowsing(response.links);
                      }
                  });
              }
          }
      );
  });
});

// Send extracted links to background.js to check with the Safe Browsing API
function checkLinksWithSafeBrowsing(links) {
  chrome.runtime.sendMessage(
      { action: "checkUrls", urls: links },
      (response) => {
          if (chrome.runtime.lastError) {
              console.error("Error communicating with background script:", chrome.runtime.lastError);
              document.getElementById("link-list").innerHTML = "<li>Error checking links.</li>";
          } else {
              console.log("Safe Browsing results received:", response);
              displayLinks(response);
          }
      }
  );
}

// Display the links in the popup
function displayLinks(links) {
  const linkList = document.getElementById("link-list");
  linkList.innerHTML = ""; // Clear any existing links

  links.forEach(({ url, malicious }) => {
      const listItem = document.createElement("li");
      const linkElement = document.createElement("a");
      linkElement.href = url;
      linkElement.textContent = url;
      linkElement.target = "_blank"; // Open link in a new tab
      listItem.appendChild(linkElement);

      if (malicious) {
          const alertSpan = document.createElement("span");
          alertSpan.textContent = " ⚠️ Malicious";
          alertSpan.style.color = "red";
          alertSpan.style.fontWeight = "bold";
          listItem.appendChild(alertSpan);
      }

      linkList.appendChild(listItem);
  });
}
