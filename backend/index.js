const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./model/userschema');
const Contact = require('./model/contactschema');
const app = express();
const path = require('path');
// Use environment variables
require('dotenv').config();

app.use(express.json());

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.static(path.join(__dirname + '/../frontend')));
app.use(express.json());
app.use(express.urlencoded({extended: true}));


   console.log("Starting");
app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname + '/../frontend/login.html'));
});

// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the user
    const user = new User({ username, password: hashedPassword });
    await user.save();

    //res.status(201).json({ message: 'User registered successfully' });

      res.redirect(303, "/");
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// Login a user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", { username, password });

    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ message: 'Invalid username or password' });
    }


    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.warn("Invalid password for user:", username);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    user.jwtToken = token;
    user.tokenExpiry = Date.now() + 3600000; // Token expiry set to 1 hour from now
    await user.save();
    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: 'Error logging in', error });
  }
});

//authenticate
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get contacts for the authenticated user
app.get('/contacts', authenticate, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user.userId });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error });
  }
});

// Add a new contact for the authenticated user
app.post('/add', authenticate, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const contact = new Contact({ name, email, phone, userId: req.user.userId });
    await contact.save();
    res.status(201).json({ message: 'Contact added successfully', contact });
  } catch (error) {
    res.status(500).json({ message: 'Error adding contact', error });
  }
});

// Delete a contact for the authenticated user
app.delete('/delete/:id', authenticate, async (req, res) => {
  try {
    const contactId = req.params.id;

    // Find and delete the contact
    const contact = await Contact.findOneAndDelete(
      { _id: contactId, userId: req.user.userId } // Ensure contact belongs to authenticated user
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contact', error });
  }
});

// Update a contact for the authenticated user
app.patch('/update/:id', authenticate, async (req, res) => {
  try {
    const contactId = req.params.id;
    const { name, email, phone } = req.body;

    // Find and update the contact
    const contact = await Contact.findOneAndUpdate(
      { _id: contactId, userId: req.user.userId }, // Ensure contact belongs to authenticated user
      { name, email, phone },
      { new: true } // Return the updated document
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact updated successfully', contact });
  } catch (error) {
    res.status(500).json({ message: 'Error updating contact', error });
  }
});


// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(process.env.PORT, () => {
      console.log(`Backend is up on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Connection failed!", error);
  });
