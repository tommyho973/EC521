//background.js
const apiKey = "AIzaSyDoXjXyprHsiI5sWSO4lXFTjDzf0QPvIrc";
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkUrls") {
        const urls = message.urls;
        const results = [];
        console.log("Received URLs for Safe Browsing check:", urls);

        const promises = urls.map((url) =>
            fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client: {
                        clientId: "my-extension",
                        clientVersion: "1.0"
                    },
                    threatInfo: {
                        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION", "UNWANTED_SOFTWARE"],
                        platformTypes: ["ANY_PLATFORM"],
                        threatEntryTypes: ["URL"],
                        threatEntries: [{ url }]
                    }
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log(`API response for ${url}:`, data);
                    results.push({ url, malicious: !!data.matches });
                })
                .catch((error) => {
                    console.error("Error checking URL:", error);
                    results.push({ url, malicious: false });
                })
        );

        Promise.all(promises).then(() => {
            console.log("Safe Browsing results:", results);
            sendResponse(results);
        });
        return true; // Keeps the message channel open for async response
    }
});
