// popup.js
const info = document.getElementById("banner-info");
// Close popup when the close button is clicked
document.getElementById("closeButton").addEventListener("click", () => {
    window.close();
  });
  
  // Wait for the DOM to load
  document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id; // Get the active tab ID
        console.log("current url:" + tabs[0].url);
        let url = (tabs[0].url);
        if (!tabId) {
            console.error("No active tab found.");
            return;
        }
  
      //   console.log(url.slice(-6));
      if (!url.startsWith("https://mail.google.com/mail/u/") || 
          !(url.includes("#inbox/") || url.includes("#spam/"))) {
        console.error("Not gmail site");
        const info = document.getElementById("banner-info");
        info.innerText = "Please select an email to scan."
        return;
    } else {
        info.innerHTML = '<span style="color: blue; font-weight: bold;">NO MALICIOUS LINKS DETECTED (^_^) </span>';
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
      if (malicious){
        info.innerHTML = '<span style="color: red; font-weight: bold;">MALICIOUS LINKS DETECTED (＠_＠;) </span>';
        const mlistItem = document.createElement("li");
          const mlinkElement = document.createElement("a");
          
          mlistItem.style.color = "yellow";
          mlistItem.style.fontWeight = "bold";
          
          mlinkElement.style.color = "red";  
          mlinkElement.style.fontWeight = "bold";  
          
          mlinkElement.textContent = url;
          mlinkElement.target = "_blank"; 
          
          mlistItem.appendChild(mlinkElement);
          
          const alertSpan = document.createElement("span");
          alertSpan.textContent = " ⚠️ Malicious";
          
          alertSpan.style.color = "red";
          alertSpan.style.fontWeight = "bold";
          
          mlistItem.appendChild(alertSpan);
          
          linkList.appendChild(mlistItem);
          
      }
      else {
          // Check if the URL does NOT match the specific patterns
          if (
              !url.startsWith("https://support.google.com/mail") && 
              !url.startsWith("https://mail.google.com/mail/u/") &&
              !url.startsWith("https://www.google.com/") &&
              !url.includes("#spam/")
          ) {
              // Create a new list item and link element
              const listItem = document.createElement("li");
              const linkElement = document.createElement("a");
              
              // Set the link's href to the current URL
              linkElement.href = url;
              linkElement.textContent = url;
              linkElement.target = "_blank"; // Open the link in a new tab
              
              // Append the link to the list item, and the list item to the link list
              listItem.appendChild(linkElement);
              linkList.appendChild(listItem);
              
              // Add a break element after each list item to create space between them
              const breakElement = document.createElement("br");
              linkList.appendChild(breakElement);
          }
      }
    });  
  };
  