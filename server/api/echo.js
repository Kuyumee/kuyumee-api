const axios = require("axios");

let safeProxies = [];
let safeProxiesExpire = 0;
let dontGetSafeProxies = false;
let interval = 100;

async function echo(url) {
  try {
    const res = await axios(url, { responseType: "arraybuffer" });
    return res.data;
  } catch {
    if ((!dontGetSafeProxies && !safeProxies.length) || safeProxiesExpire < Date.now()) {
      safeProxiesExpire = Date.now() + 300000;
      getSafeProxies(url);
    }

    if (!safeProxies.length) {
      await waitSafeProxies();
    }

    safeProxies.push(safeProxies.shift());

    try {
      console.log("Requesting...");
      console.log(`Safe: ${safeProxies.length}`);
      const res = await axios(url, { proxy: safeProxies[0], responseType: "arraybuffer", timeout: 10000 }).catch((e) => console.log(e.code));
      return res.data;
    } catch (e) {
      safeProxies.shift();
      return main(url);
    }
  }
}

async function waitSafeProxies() {
  await new Promise((r) => setTimeout(r, 5000));
  if (!safeProxies.length) {
    return waitSafeProxies();
  }
}

async function getSafeProxies(url) {
  console.log("Generating Proxies...");

  dontGetSafeProxies = true;

  let proxies = [];

  const proxySites = [
    "https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt",
    "https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-http.txt",
    "https://www.proxy-list.download/api/v1/get?type=http",
    "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all",
  ];

  for (let i = 0; i < proxySites.length; i++) {
    proxies.push(axios(proxySites[i]).then((a) => a.data.split("\n").map((a) => (a = a.split(":")))));
  }

  proxies = await Promise.all(proxies);

  proxies = proxies.flat();
  proxies = [...new Set(proxies)];

  shuffle(proxies);
  console.log(`Estimated: ${(proxies.length * interval) / 1000}s`);

  let ongoing = [];
  let dataSizes = [];

  for (let i = 0; i < proxies.length; i++) {
    await new Promise((r) => setTimeout(r, interval));
    ongoing.push(
      axios(url, { proxy: { host: proxies[i][0], port: proxies[i][1] }, responseType: "arraybuffer", timeout: 15000 })
        .then((result) => {
          if (dataSizes.includes(result.data.length)) {
            console.log("+1");
            safeProxies.push(result.config.proxy);
          } else {
            dataSizes.push(result.data.length);
          }
        })
        .catch(() => {})
    );
  }

  await Promise.allSettled(ongoing);

  dontGetSafeProxies = false;

  console.log("Got proxies");
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

module.exports = { echo };
