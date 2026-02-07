const express = require('express');
const cors = require('cors');
const { translate } = require('google-translate-api-x');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

app.post('/translate', async (req, res) => {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
        return res.status(400).json({ error: 'Text and target language are required' });
    }

    try {
        // Translate to target language
        const intermediate = await translate(text, { to: targetLang });
        const translatedText = intermediate.text;

        // Translate back to English
        const final = await translate(translatedText, { to: 'en' });
        const backTranslatedText = final.text;

        res.json({
            original: text,
            translated: translatedText,
            backTranslated: backTranslatedText,
            targetLang: targetLang
        });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
