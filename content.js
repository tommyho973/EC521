chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getLinks") {
      console.log("Received message to get links.");

      // Extract links from <a> tags
      const linksFromAnchors = Array.from(document.querySelectorAll('a'))
          .map(link => link.href)
          .filter(href => href.startsWith('http'));

      console.log("Links from <a> tags found:", linksFromAnchors);

      // Extract URLs and payloads from <script> tags
      const scripts = Array.from(document.querySelectorAll("script"));
      const scriptData = scripts.map(script => {
          const scriptContent = script.textContent || '';
          const fetchMatch = scriptContent.match(/fetch\(['"`](.*?)['"`]/);
          const payloadMatch = scriptContent.match(/body:\s*['"`]?(.*?)['"`]?\s*[,\n}]/);

          if (fetchMatch) {
              const url = fetchMatch[1];
              const payload = payloadMatch ? payloadMatch[1].trim() : null;
              return { url, payload };
          }
          return null;
      }).filter(Boolean); // Remove null entries

      console.log("Links from <script> tags found:", scriptData);

      // Combine and send both sets of links
      const allLinks = linksFromAnchors.concat(
          scriptData.map(data => ({
              url: data.url,
              payload: data.payload,
          }))
      );

      sendResponse({ links: allLinks });
      return true; // Keeps the channel open for asynchronous responses
  }
});
