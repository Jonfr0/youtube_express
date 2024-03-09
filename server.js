const express = require("express");
const axios = require("axios");
const fs = require("fs");
const app = express();

app.set("view engine", "ejs");

const PORT = 3000;

// Search query (%20 == space)
const query = "latin%20music";

// API key
const key = "examplekey";

// Page token (example)
const pageToken = "CGQQAA";

// Complete url
const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${key}&type=video&part=snippet&maxResults=50&regionCode=US&order=date&pageToken=${pageToken}&q=${query}&relevanceLanguage=en`;

async function getChannelStats(channelId) {
  let channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${key}&part=statistics,snippet&id=${channelId}`;

  try {
    const response = await axios.get(channelUrl);
    const data = response.data.items[0];

    let stats = {};

    if (
      Number(data.statistics.subscriberCount) >= 20000 &&
      Number(data.statistics.subscriberCount) <= 120000
    ) {
      stats = {
        title: data.snippet.title,
        ID: Number(data.id),
        statistics: {
          viewCount: Number(data.statistics.viewCount),
          subscribers: Number(data.statistics.subscriberCount),
          videoCount: Number(data.statistics.videoCount),
        },
      };

      fs.writeFileSync("./data/stats.txt", `${JSON.stringify(stats)},`, {
        flag: "a",
      });
    }
  } catch (e) {
    console.log(e.message);
  }
}

app.get("/1", async (req, res) => {
  try {
    const response = await axios.get(apiUrl);
    const responseData = response.data;

    // Clear out all lists
    fs.writeFileSync("./list/ids.txt", "");
    fs.writeFileSync("./list/titles.txt", "");
    fs.writeFileSync("./data/stats.txt", "");
    fs.writeFileSync("data.json", "");

    console.log("File contents removed successfully.");

    // Write the response data to the local JSON file
    fs.writeFileSync(
      "./data/response.json",
      JSON.stringify(responseData, null, 2)
    );

    res.status(200).json({
      status: "success",
      data: {
        response: responseData,
      },
    });
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

app.get("/2", async (req, res) => {
  try {
    // Read local JSON file and filter
    const jsonData = fs.readFileSync("./data/response.json", "utf8");
    const parsedData = JSON.parse(jsonData);

    const channelTitleList = [];
    const channelIdList = [];

    parsedData.items.map((item) => {
      channelTitleList.push(item.snippet.channelTitle);
      channelIdList.push(item.snippet.channelId);
    });

    const uniqueTitles = [...new Set(channelTitleList)];
    const uniqueIdList = [...new Set(channelIdList)];

    uniqueTitles.forEach((item) => {
      fs.writeFileSync("./list/titles.txt", `${item}\n`, {
        flag: "a",
      });
    });

    uniqueIdList.forEach((item) => {
      fs.writeFileSync("./list/ids.txt", `${item}\n`, {
        flag: "a",
      });
    });

    console.log("Response filtered correctly!");

    res.status(200).send("Completed!");
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

app.get("/3", (req, res) => {
  try {
    const channelIds = fs.readFileSync("./list/ids.txt", "utf-8");
    const splitIds = channelIds.split("\n");
    const updatedList = splitIds.map((item) => item.replace(/\n/g, ""));

    updatedList.forEach(async (id) => {
      await getChannelStats(id);
    });

    console.log("Got channel statistics!");

    res.status(200).send("Got channel statistics");
  } catch (error) {
    console.log(`There was an error: ${error}`);
    res.status(500);
  }
});

app.get("/4", (req, res) => {
  try {
    const stringData = fs.readFileSync("./data/stats.txt", "utf-8");
    const slicedData = "[" + stringData.slice(0, -1) + "]";
    fs.writeFileSync("data.json", slicedData, { flag: "a" });

    console.log(`Finalized correctly!`);

    res.status(200).send("Finalized!");
  } catch (e) {
    console.log(e.message);
    res.status(500);
  }
});

app.get("/", (req, res) => {
  try {
    const stringData = fs.readFileSync("data.json", "utf-8");
    const jsonData = JSON.parse(stringData);
    res.render("index", { data: jsonData });
  } catch (e) {
    console.log("There was an error while gettine data.json data");
    res.send(e.message);
  }
});

app.listen(PORT);
