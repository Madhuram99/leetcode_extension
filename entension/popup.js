console.log("📦 popup.js loaded");

document.getElementById("getHelp").addEventListener("click", async () => {
    const output = document.getElementById("output");
    const loader = document.getElementById("loader");
    const language = document.getElementById("languageSelector").value;

    loader.style.display = "block";
    output.innerHTML = "";
    document.getElementById("copyContainer").style.display = "none";

    try {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tab = tabs[0];
            const url = tab.url;
            let title = tab.title;
            let platform = "Unknown";
            
            // Detect the platform and get the title correctly
            if (url.includes("leetcode.com/problems")) {
                platform = "LeetCode";
                // For LeetCode, the tab title is usually sufficient
            } else if (url.includes("codeforces.com/contest/") || url.includes("codeforces.com/problemset/problem")) {
                platform = "Codeforces";
                // For Codeforces, let's extract the title from the URL or page content
                const parts = url.split('/');
                const problemCode = parts[parts.length - 1];
                const contestId = parts[parts.length - 3];
                title = `Codeforces ${contestId} - Problem ${problemCode}`;
            }

            if (platform === "Unknown") {
                loader.style.display = "none";
                output.innerHTML = "<p>Please navigate to a LeetCode or Codeforces problem page.</p>";
                return;
            }

            console.log(`Fetching ${language} solution for ${platform} problem:`, title);

            const response = await fetch("https://leetcode-extension-tsdj.onrender.com/api/solve/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, url, language, platform }) // Send the detected platform
            });

            const data = await response.json();
            loader.style.display = "none";

            if (data.solution) {
                output.innerHTML = marked.parse(data.solution);
                
                document.getElementById("copyContainer").style.display = "block";
                document.getElementById("copyBtn").onclick = () => {
                    const codeBlock = output.querySelector("pre code");
                    if (codeBlock) {
                        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
                            const btn = document.getElementById("copyBtn");
                            btn.innerText = "✅";
                            setTimeout(() => { btn.innerText = "Copy Code"; }, 1500);
                        });
                    }
                };
            } else {
                output.innerHTML = "<p>No solution found.</p>";
            }
        });
    } catch (err) {
        loader.style.display = "none";
        output.innerHTML = "<p style='color: red;'>Error fetching data. Is the backend running?</p>";
        console.error("❌ Error:", err);
    }
});