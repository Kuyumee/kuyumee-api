async function animetracker(f, d) {
  const axios = require("axios");
  const { si } = require("nyaapi");

  const db = require("../helpers/db.js");

  if (f === "home" && d) {
    //get reuest to mal, get request to nyaapi, return images and data of downloaded and available with magnet links
    const res = await axios(`https://api.myanimelist.net/v2/users/${d}/animelist?nsfw=1&status=watching&limit=1000`, {
      headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID },
    });

    const titles = res.data.data.map((a) => (a = { title: a.node.title, key: a.node.title.split(" ").slice(0, 2).join(" "), main_picture: a.node.main_picture.large }));

    const magnets = await si.searchAll({ term: `"[ASW]" ${titles.map((a) => `(${a.key})`).join("|")}` });
    magnets.reverse();

    let results = [];

    for (const magnet of magnets) {
      if (!magnet.name.match(/\[ASW\] (.*?) - /i)) {
        continue;
      }
      const title = magnet.name.match(/\[ASW\] (.*?) - /i)[1];
      const episode = magnet.name.match(/ - (.*?) \[/i)[1];

      let obj = results.find((a) => a.title === title);

      if (!obj) {
        results.push({ title: title, main_picture: titles.find((b) => b.title.includes(title)).main_picture, episodes: [] });
        obj = results.find((a) => a.title === title);
      }

      //0:not downloaded, 1:downloaded
      const status = db.get((d + title + episode).toLowerCase()) ? 1 : 0;
      const createdEpoch = new Date(magnet.date).getTime();
      obj.episodes.push({ episode: episode, magnet: magnet.magnet, status: status, dateCreated: createdEpoch });
    }

    results.sort((a, b) => a.episodes.at(-1).dateCreated - b.episodes.at(-1).dateCreated);
    results.sort((a, b) => b.episodes.some((c) => !c.status) - a.episodes.some((c) => !c.status));

    return results;
  } else if (f === "update" && d) {
    //update db of what clicked
    await db.set(d.toLowerCase(), true);
    return true;
  }
}

module.exports = { animetracker };
