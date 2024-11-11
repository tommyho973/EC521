// content.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getLinks") {
      const links = Array.from(document.querySelectorAll('a'))
        .map(link => link.href)
        .filter(href => href.startsWith('http'));
  
      // Respond with the links
      sendResponse({ links });
    }
  });
  