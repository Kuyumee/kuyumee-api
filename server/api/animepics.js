const axios = require("axios");

async function animepics(dates, pages, host) {
  dates = dates ? JSON.parse(dates) : [];
  pages = pages ? JSON.parse(pages) : [];

  // Arrays must be most recent to oldest, else reverse()
  const limit = "10";
  const tags = `score%3A%3E20+-rating%3Asafe`;

  const allowedFiles = ["jpg", "jpeg", "png", "gif"];

  const links = [
    // {
    //   url: `https://gelbooru.com/index.php?page=dapi&s=post&q=index&limit=${limit}&tags=${tags}&json=1&api_key=${process.env.GEL_KEY}&user_id=${process.env.GEL_ID}&pid=`,
    //   firstPage: 0,
    //   response: (res, i) => {
    //     const posts = res.data.post;
    //     const dates = new Date(posts.at(-1).created_at).getTime();
    //     const images = posts.filter((post) => allowedFiles.some((a) => post.sample_url.endsWith(a))).map((post) => `//${host}/api/echo?q=${post.sample_url}`);

    //     return { dates: dates, images: images, i: i };
    //   },
    // },
    {
      url: `https://danbooru.donmai.us/posts.json?limit=${limit}&tags=${tags}&page=`,
      firstPage: 1,
      response: (res, i) => {
        const posts = res.data;
        const dates = new Date(posts.at(-1).created_at).getTime();
        const images = posts.filter((post) => post.large_file_url && allowedFiles.some((a) => post.large_file_url.endsWith(a))).map((post) => post.large_file_url);

        return { dates: dates, images: images, i: i };
      },
    },
    // {
    //   url: `https://yande.re/post.json?limit=${limit}&tags=${tags}&page=`,
    //   firstPage: 1,
    //   response: (res, i) => {
    //     const posts = res.data;
    //     const dates = posts.at(-1).created_at * 1000;
    //     const images = posts.filter((post) => allowedFiles.some((a) => post.sample_url.endsWith(a))).map((post) => `//${host}/api/echo?q=${post.sample_url}`);

    //     return { dates: dates, images: images, i: i };
    //   },
    // },
  ];

  let promises = [];
  if (!dates.length || !pages.length) {
    for (let i = 0; i < links.length; i++) {
      pages = links.map((a) => a.firstPage);
      promises.push(axios(links[i].url + pages[i]).then((res) => links[i].response(res, i)));
    }
  } else {
    const i = dates.indexOf(Math.max(...dates));

    pages[i]++;
    promises.push(axios(links[i].url + pages[i]).then((res) => links[i].response(res, i)));
  }

  const data = await Promise.all(promises);

  for (const d of data) {
    dates[d.i] = d.dates;
  }

  console.log(dates, pages);

  return {
    dates: JSON.stringify(dates),
    pages: JSON.stringify(pages),
    images: data.flatMap((d) => d.images),
  };
}

module.exports = { animepics };
