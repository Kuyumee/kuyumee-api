const axios = require("axios");
const { si } = require("nyaapi");
const db = require("../helpers/db.js");

async function animetracker(f, d) {
  if (f === "home") {
    const res = await axios(`https://api.myanimelist.net/v2/users/kuyumee/animelist?nsfw=1&status=watching&limit=1000`, { headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID } }).then((a) => a.data.data);

    let result = res.map((a) => ({ title: a.node.title, nyaa: a.node.title.slice(0, 8), main_picture: a.node.main_picture.medium, episodes: [] }));

    const magnets = await si.searchAll({ term: `[ASW] "${result.map((a) => a.nyaa).join('"|"')}"` });

    for (const magnet of magnets.reverse()) {
      const titleMatch = magnet.name.match(/\[ASW\] (.*?) - /i);
      const episodeMatch = magnet.name.match(/.* - (.*?) \[/i);

      if (!titleMatch || !episodeMatch || isNaN(parseInt(episodeMatch[1]))) continue;

      const title = titleMatch[1];
      const episode = episodeMatch[1];
      const magnetLink = magnet.magnet;

      const index = result.findIndex((a) => title.includes(a.nyaa));
      if (index === -1) continue;

      const dateCreated = new Date(magnet.date).getTime();
      const status = db.collection("animetracker").findOne({ _id: title, episodes: { $in: [episode] } });

      result[index].episodes.push({ episode, magnetLink, dateCreated, status });
    }

    await Promise.all(result.flatMap((a) => a.episodes.map((b) => b.status)));

    for (const anime of result) {
      for (const episode of anime.episodes) {
        episode.status = (await episode.status) ? 1 : 0;
      }
    }

    result = result.filter((a) => a.episodes.length > 0);
    result.sort((a, b) => a.episodes.at(-1).dateCreated - b.episodes.at(-1).dateCreated);
    result.sort((a, b) => b.episodes.some((c) => !c.status) - a.episodes.some((c) => !c.status));

    return result;
  } else if (f === "update") {
    const anime = JSON.parse(d);
    await db.collection("animetracker").updateOne({ _id: anime.title }, { $addToSet: { episodes: anime.episode } }, { upsert: true });
    return true;
  }
}
module.exports = { animetracker };
