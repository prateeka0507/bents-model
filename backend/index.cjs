const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
//const  connectDb  = require('./config/dbConnection.cjs');
const Contact = require('./contact.cjs'); // Mongoose model
const User = require('./userModel.cjs');
const mongoose=require('mongoose')
const app = express();
const port = 5002;


const corsOptions = {
  origin: ['https://bents-model-frontend.vercel.app','https://www.bentsassistant.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.options('*', (req, res) => {
  res.sendStatus(204);
});

app.get('/test-cors', (req, res) => {
  res.json({ message: 'CORS is working' });
});
// Middleware
app.use(bodyParser.json());

// Connect to the database
// Uncomment the next line when you're ready to connect to the database
mongoose.connect('mongodb+srv://mohamedrasheq:rasheq@cluster0.vsdcw.mongodb.net/bents-contact?retryWrites=true&w=majority&appName=Cluster0')

// Flask backend URL
const FLASK_BACKEND_URL = 'https://bents-model-phi.vercel.app';

// Get user data
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save user data
app.post('/api/user/:userId', async (req, res) => {
  try {
    const { conversations, searchHistory, selectedIndex } = req.body;
    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      { conversations, searchHistory, selectedIndex },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});






app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    console.log('Received contact form submission:', { name, email, subject, message });

    const newContact = new Contact({
      name,
      email,
      subject,
      message,
    });

    const savedContact = await newContact.save();
    console.log('Contact saved successfully:', savedContact);

    res.json({ message: 'Message received successfully!', data: savedContact });
  } catch (err) {
    console.error('Error saving contact data:', err);
    console.error('Error details:', err.message, err.stack);
    res.status(500).json({ message: 'An error occurred while processing your request.', error: err.message });
  }
});



app.post('/chat', async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_BACKEND_URL}/chat`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding chat request to Flask:', error);
    res.status(500).json({ message: 'An error occurred while processing your chat request.' });
  }
});

app.get('/documents', async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_BACKEND_URL}/documents`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching documents from Flask:', error);
    res.status(500).json({ message: 'An error occurred while fetching documents.' });
  }
});

app.post('/add_document', async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_BACKEND_URL}/add_document`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error adding document through Flask:', error);
    res.status(500).json({ message: 'An error occurred while adding the document.' });
  }
});

app.post('/delete_document', async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_BACKEND_URL}/delete_document`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting document through Flask:', error);
    res.status(500).json({ message: 'An error occurred while deleting the document.' });
  }
});

app.post('/update_document', async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_BACKEND_URL}/update_document`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating document through Flask:', error);
    res.status(500).json({ message: 'An error occurred while updating the document.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Express server is running on http://localhost:${port}`);
  console.log(connectDb());
});
