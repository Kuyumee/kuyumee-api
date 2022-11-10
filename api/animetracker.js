async function animetracker(f, d) {
  const axios = require("axios");
  const { si } = require("nyaapi");

  const db = require("../helpers/db.js");

  if (f === "home" && d) {
    const res = await axios(`https://api.myanimelist.net/v2/users/${d}/animelist?nsfw=1&status=watching&limit=1000`, {
      headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID },
    }).then((a) => a.data.data);

    let result = res.map((a) => (a = { title: a.node.title, key: a.node.title.slice(0, 8), main_picture: a.node.main_picture.medium, episodes: [] }));

    const magnets = await si.searchAll({ term: `[ASW] \"${result.map((a) => a.key).join('"|"')}\"` });
    magnets.reverse();

    //Loop the magnets to put it in result in their respective location
    for (const magnet of magnets) {
      let title = magnet.name.match(/\[ASW\] (.*?) - /i);
      let episode = magnet.name.match(/.* - (.*?) \[/i);

      if (title && episode && !isNaN(parseInt(episode[1]))) {
        title = title[1];
        episode = episode[1];
      } else {
        continue;
      }

      const index = result.findIndex((a) => title.includes(a.key));

      const status = db.get((d + result[index].title + episode).toLowerCase()) ? 1 : 0;
      const dateCreated = new Date(magnet.date).getTime();

      result[index].episodes.push({ episode, magnet: magnet.magnet, status, dateCreated });
    }

    result = result.filter((a) => a.episodes.length > 0);
    result.sort((a, b) => a.episodes.at(-1).dateCreated - b.episodes.at(-1).dateCreated);
    result.sort((a, b) => b.episodes.some((c) => !c.status) - a.episodes.some((c) => !c.status));

    return result;
  } else if (f === "update" && d) {
    //update db of what clicked
    await db.set(d.toLowerCase(), true);
    return true;
  }
}

module.exports = { animetracker };
