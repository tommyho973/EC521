// content.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getLinks") {
      console.log("Received message to get links.");

      const links = Array.from(document.querySelectorAll('a'))
          .map(link => link.href)
          .filter(href => href.startsWith('http'));
      console.log("Links found:", links);
      sendResponse({ links });
      return true; // Keeps the channel open for asynchronous responses
  }
});

  