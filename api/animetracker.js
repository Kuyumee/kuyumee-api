function createSearchKey(title) {
  // return title.slice(1, 12); // Keep only first 12 characters
  return title.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s\s+/g, " "); // Keep only alphanumeric and space
}

function sameTitle(title, simple) {
  // If all words in simple are in title, return true
  const simpleWords = simple.split(" ");
  for (const simpleWord of simpleWords) {
    if (!title.includes(simpleWord)) return false;
  }
  return true;
}

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
      officialTitle: a.node.title,
      nyaaTitle: null,
      searchKey: createSearchKey(a.node.title),
      main_picture: a.node.main_picture.medium,
      episodes: [],
    }));

    const allAnimeSearchKey = `"[ASW]"|"[EMBER]"|"[Erai-raws]" (${animes.map((a) => a.searchKey).join(")|(")})`;
    const animeMagnets = await si.searchAll({ term: allAnimeSearchKey });

    animeMagnets.sort();

    for (const animeMagnet of animeMagnets) {
      const titleAndEpisodeMatch = animeMagnet.name.match(/\[ASW\]\s(.*?)\s-\s(\d+)\s\[1080/) ?? animeMagnet.name.match(/\[EMBER\]\s(.*?)\sS\d+E(\d+)\s\[1080/) ?? animeMagnet.name.match(/\[Erai-raws\]\s(.*?)\s-\s(\d+)\s\[1080/);
      if (!titleAndEpisodeMatch) continue;

      const magnetAnimeTitle = titleAndEpisodeMatch[1];
      const magnetAnimeEpisode = titleAndEpisodeMatch[2];

      const index = animes.findIndex((a) => magnetAnimeTitle === a.nyaaTitle || (sameTitle(magnetAnimeTitle, a.searchKey) && a.nyaaTitle === null)); // Always bind to the first match
      if (index === -1) continue;

      //if episode already exists, skip
      if (animes[index].episodes.some((a) => a.episode == magnetAnimeEpisode)) continue;

      animes[index].nyaaTitle = magnetAnimeTitle;
      animes[index].episodes.push({
        episode: magnetAnimeEpisode,
        magnetName: animeMagnet.name,
        magnetLink: animeMagnet.magnet,
        dateCreated: new Date(animeMagnet.date).getTime(),
        status: 0,
      });
    }

    animes = animes.filter((a) => a.episodes.length > 0);
    animes = animes.map((a) => ({ ...a, episodes: a.episodes.reverse() }));

    const dbResult = await db
      .collection("animetracker")
      .find({ _id: { $in: animes.map((a) => a.officialTitle) } })
      .toArray();

    for (const animeDbEntry of dbResult) {
      const index = animes.findIndex((a) => a.officialTitle === animeDbEntry._id);
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
    await db.collection("animetracker").updateOne({ _id: anime.officialTitle }, { $addToSet: { episodes: anime.episode } }, { upsert: true });

    return reply.send("OK");
  }
}

module.exports = animetracker;
