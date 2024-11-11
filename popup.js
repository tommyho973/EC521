// popup.js

document.getElementById("closeButton").addEventListener("click", () => {
    window.close();
});

document.addEventListener('DOMContentLoaded', () => {
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    
    // Inject content.js into the current tab
    chrome.scripting.executeScript(
    {
        target: { tabId: tabId },
        files: ['content.js']
    },
    () => {
        // Once injected, send a message to the content script to get links
        chrome.tabs.sendMessage(tabId, { action: "getLinks" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Content script injection failed:", chrome.runtime.lastError);
            document.getElementById('link-list').innerHTML = '<li>No links found. Try reloading the page.</li>';
        } else if (response && response.links) {
            displayLinks(response.links);
        }
        });
    }
    );
});
});

function displayLinks(links) {
const linkList = document.getElementById('link-list');
linkList.innerHTML = ''; // Clear any existing links

links.forEach((link) => {
    const listItem = document.createElement('li');
    const linkElement = document.createElement('a');
    linkElement.href = link;
    linkElement.textContent = link;
    linkElement.target = '_blank'; // Open link in new tab
    listItem.appendChild(linkElement);
    linkList.appendChild(listItem);
});
}