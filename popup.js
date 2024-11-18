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
  
      links.forEach(link => {
          const listItem = document.createElement("li");
  
          if (typeof link === "string") {
              // Handle plain string links
              const linkElement = document.createElement("a");
              linkElement.href = link;
              linkElement.textContent = link;
              linkElement.target = "_blank"; // Open link in a new tab
              listItem.appendChild(linkElement);
  
              // Trigger malicious alert if applicable
              if (link.malicious) {
                  triggerMaliciousWarning(link, linkElement);
              }
          } else {
              // Handle object data
              const linkElement = document.createElement("a");
              linkElement.href = link.url;
              linkElement.textContent = link.url;
              linkElement.target = "_blank"; // Open link in a new tab
              listItem.appendChild(linkElement);
  
              if (link.payload) {
                  console.log("In payload");
                  const payloadElement = document.createElement("p");
                  payloadElement.textContent = `Payload: ${link.payload}`;
                  payloadElement.style.fontSize = "0.9em";
                  payloadElement.style.color = "gray";
                  listItem.appendChild(payloadElement);
              }
  
              // Trigger malicious alert if applicable
              if (link.malicious) {
                  triggerMaliciousWarning(link);
              }
          }
  
          linkList.appendChild(listItem);
      });
  }
  
  // Function to trigger a warning modal for malicious links
  function triggerMaliciousWarning(link) {
      const modal = document.getElementById("warning-modal");
      const warningMessage = document.getElementById("warning-message");
      const confirmButton = document.getElementById("modal-confirm");
      const cancelButton = document.getElementById("modal-cancel");
  
      warningMessage.textContent = `Warning! A malicious link was detected:\n\n${link.url || link}\n\nProceed with caution.`;
  
      // Show the modal
      modal.style.display = "flex";
  
      // Handle user response
      confirmButton.onclick = () => {
          console.log("User chose to proceed with the link:", link.url || link);
          //window.open(link.url || link, "_blank"); // Proceed to open the link
          modal.style.display = "none"; // Close the modal
      };
  
      cancelButton.onclick = () => {
          console.log("User chose to close the tab.");
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const tabId = tabs[0]?.id;
              if (tabId) {
                  chrome.tabs.remove(tabId, () => {
                      console.log("Malicious tab closed.");
                  });
              }
          });
          modal.style.display = "none"; // Close the modal
      };
  }

// Function to trigger a warning popup for malicious links
/* This function is using the native confirm() dialog which stop all user interaction with the website
BUT it allows no customization */
/* function triggerMaliciousWarning(link) {
    const warningMessage = `Warning! A malicious link was detected:\n\n${link.url || link}\n\nProceed with caution.`;
    if (confirm(warningMessage)) {
        console.log("User chose to proceed with the link:", link.url || link);
        // User can click on the link, so do nothing here.
    } else {
        console.log("User chose to close the tab.");
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
                chrome.tabs.remove(tabId, () => {
                    console.log("Malicious tab closed.");
                });
            }
        });
    }
} */