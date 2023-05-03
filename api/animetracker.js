async function animetracker(request, reply) {
  const axios = require("axios");
  const { si } = require("nyaapi");
  const db = await require("../helpers/db.js").getDB();

  const { f, d } = request.query;

  if (f === "home") {
    const watching = await axios(`https://api.myanimelist.net/v2/users/kuyumee/animelist?nsfw=1&status=watching&limit=1000`, {
      headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID },
    });

    let animes = watching.data.data.map((a) => ({
      title: a.node.title,
      nyaaTitle: null,
      searchKey: a.node.title.slice(1, 8),
      main_picture: a.node.main_picture.medium,
      episodes: [],
    }));

    const animeMagnets = await si.searchAll({ term: `[ASW] "${animes.map((a) => a.searchKey).join('"|"')}"` });

    for (const animeMagnet of animeMagnets) {
      const titleMatch = animeMagnet.name.match(/\[ASW\] (.+) - (?:(?<=- )[^-]+(?= \[))/);
      const episodeMatch = animeMagnet.name.match(/(?<=- )([^-]+)(?= \[)/);

      if (!titleMatch || !episodeMatch || episodeMatch[1].length > 4) continue;

      const title = titleMatch[1];
      const episode = episodeMatch[1];

      const index = animes.findIndex((a) => title === a.nyaaTitle || (title.includes(a.searchKey) && a.nyaaTitle === null));
      if (index === -1) continue;

      animes[index].nyaaTitle = title;
      animes[index].episodes.push({
        episode,
        magnetLink: animeMagnet.magnet,
        dateCreated: new Date(animeMagnet.date).getTime(),
        status: 0,
      });
    }

    animes = animes.filter((a) => a.episodes.length > 0);
    animes = animes.map((a) => ({ ...a, episodes: a.episodes.reverse() }));

    const dbResult = await db
      .collection("animetracker")
      .find({ _id: { $in: animes.map((a) => a.title) } })
      .toArray();

    for (const animeDbEntry of dbResult) {
      const index = animes.findIndex((a) => a.title === animeDbEntry._id);
      if (index === -1) continue;
      for (const episode of animeDbEntry.episodes) {
        const episodeIndex = animes[index].episodes.findIndex((a) => a.episode == episode);
        if (episodeIndex === -1) continue;
        animes[index].episodes[episodeIndex].status = 1;
      }
    }

    // Sorting: Top code should be the least priority
    // Sort by last episode date is first
    animes = animes.sort((a, b) => {
      return b.episodes.at(-1).dateCreated - a.episodes.at(-1).dateCreated;
    });

    // Sort unwatched is first
    animes = animes.sort((a, b) => {
      return a.episodes.at(-1).status - b.episodes.at(-1).status;
    });

    return reply.send(animes);
  } else if (f === "update") {
    const anime = JSON.parse(d);
    await db.collection("animetracker").updateOne({ _id: anime.title }, { $addToSet: { episodes: anime.episode } }, { upsert: true });

    return reply.send("OK");
  }
}

module.exports = animetracker;
