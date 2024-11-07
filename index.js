const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const URL = require("url").URL;

const app = express();
const port = process.env.PORT || 3000;

require("dotenv").config();
connect().catch((err) => console.log(err));

// MIDDLEWARES
app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

// SCHEMA
const ZhopaUrlSchema = new mongoose.Schema(
    {
        original_url: {
            type: String,
            required: true,
            unique: true,
        },
        short_url: {
            type: String,
            required: true,
            unique: true,
        },
    },
    { collection: "Zhopa URLs" },
);

// MODELS
const ZhopaUrl = mongoose.model("ZhopaUrl", ZhopaUrlSchema);

// API
app.get("/", function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
    res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
    try {
        const originalUrl = req.body.url;

        if (!isUrlValid(originalUrl)) {
            return res.json({ error: "invalid url" });
        }

        let zhopaUrlRecords = await ZhopaUrl.where("original_url").equals(originalUrl).exec();
        let zhopaUrlRecord;

        if (!zhopaUrlRecords || !zhopaUrlRecords.length) {
            zhopaUrlRecord = new ZhopaUrl({
                original_url: originalUrl
            });

            zhopaUrlRecord.short_url = zhopaUrlRecord._id.toString().slice(-8);

            await zhopaUrlRecord.save();
        } else {
            zhopaUrlRecord = zhopaUrlRecords.find((url) => url.original_url === originalUrl);
        }

        return res.status(200).json(zhopaUrlRecord);
    } catch (err) {
        console.error(err);

        return res.status(500).redirect("/");
    }
});

app.get("/api/shorturl/:short_url", async (req, res) => {
    const zhopaUrlRecord = await ZhopaUrl.findOne({ short_url: req.params.short_url });

    if (zhopaUrlRecord) {
        return res.status(200).redirect(zhopaUrlRecord.original_url);
    }

    res.sendStatus(404);
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});

// HELPERS
async function connect() {
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "utils",
    });
}

function isUrlValid(urlString) {
    try {
        new URL(urlString);
        return true;
    } catch {
        return false;
    }
}
