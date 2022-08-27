const axios = require("axios");

async function animepics(next) {
  const nextMultiplier = 0.5; 

  const limit = 50;
  const tag = `score:>${next}+-rating:safe+(is:jpg+or+is:png)`;

  const url = `https://danbooru.donmai.us/posts.json?limit=${limit}&tags=${tag}`;
  let data = await axios(url).then((a) => a.data);
  data = data.filter((a) => a.large_file_url);

  const scores = data.map((a) => a.score).sort((a, b) => a - b); //sorted by lowest to highest

  console.log(new Date(data[0].created_at).toLocaleString(), "Current:", next, "Next:", scores[Math.floor((scores.length - 1) * nextMultiplier)]);

  return { next: scores[Math.floor((scores.length - 1) * nextMultiplier)], images: data.map((a) => a.large_file_url) };
}

module.exports = { animepics };
