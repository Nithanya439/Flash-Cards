const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/flashcards', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Summary Schema
const SummarySchema = new mongoose.Schema({
    pdfName: String,
    summary: String
});

const Summary = mongoose.model('Summary', SummarySchema);

// Hugging Face Summarization API URL and your API Key
const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HF_API_KEY = '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';

// Function to summarize text using Hugging Face API
async function summarizeText(text) {
    try {
        const maxLength = 2000;
        const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;

        const response = await axios.post(HF_API_URL, {
            inputs: truncatedText,
            parameters: {
                max_length: 1000,
                min_length: 300,
                length_penalty: 2.0,
                num_beams: 4
            }
        }, {
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.length > 0) {
            return response.data[0].summary_text;
        } else {
            throw new Error('No summary text found in response');
        }
    } catch (error) {
        console.error('Error summarizing text:', error.response ? error.response.data : error.message);
        throw new Error('Failed to summarize text');
    }
}

// Route to handle PDF upload and process it for summarization
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const filePath = path.join(__dirname, req.file.path);
        const dataBuffer = fs.readFileSync(filePath);
        
        const pdfData = await pdfParse(dataBuffer);
        const extractedText = pdfData.text;

        // Log text length for debugging
        console.log(`Extracted text length: ${extractedText.length}`);

        const summarizedText = await summarizeText(extractedText);

        // Save summary to the database
        const newSummary = new Summary({
            pdfName: req.file.originalname,
            summary: summarizedText
        });

        await newSummary.save();

        res.json({ message: 'Summary generated and saved to database', summary: summarizedText });

        fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
});

// Route to fetch all summaries
app.get('/summaries', async (req, res) => {
    try {
        const summaries = await Summary.find();
        res.json(summaries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve summaries' });
    }
});

// Route to delete a specific summary by ID
app.delete('/summaries/:id', async (req, res) => {
    try {
        await Summary.findByIdAndDelete(req.params.id);
        res.json({ message: 'Summary deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete summary' });
    }
});

// Route to delete all summaries
app.delete('/summaries', async (req, res) => {
    try {
        await Summary.deleteMany({});
        res.json({ message: 'All summaries deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete all summaries' });
    }
});

// Start the server
app.listen(3001, () => {
    console.log('Server running at http://localhost:3001');
});
