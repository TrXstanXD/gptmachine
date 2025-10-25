import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/chat", upload.single("image"), async (req, res) => {
  const message = req.body.message;
  const imageFile = req.file;
  let imageBase64 = null;

  if (imageFile) {
    const img = fs.readFileSync(imageFile.path);
    imageBase64 = `data:image/png;base64,${img.toString("base64")}`;
  }

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        imageBase64
          ? { role: "user", content: [{ type: "text", text: message }, { type: "image_url", image_url: imageBase64 }] }
          : { role: "user", content: message },
      ],
    }),
  });

  const data = await openaiRes.json();
  res.json({ reply: data.choices?.[0]?.message?.content || "Error" });
});

app.use(express.static("."));
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
