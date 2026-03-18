const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("node:path");

const app = express();
const port = 3000;

// Secret key for JWT (In production, use environment variables)
const TOKEN_SECRET = "your_super_secret_key_123"; 

const users = []; // In-memory database
app.use(express.json());

// --- Authentication Middleware (JWT) ---
/**
 * Verifies the presence and validity of a JWT token in the request headers.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
    }

    try {
        const verified = jwt.verify(token, TOKEN_SECRET);
        req.user = verified; 
        next(); 
    } catch (err) {
        res.status(403).json({ message: 'Invalid or Expired Token' });
    }
};

// --- Public Routes ---

app.get("/", (req, res) => {
    res.status(200).json({ message: 'Welcome to the API' });
});

// Signup Route
app.post("/auth/signup", (req, res) => {
    const { name, email, password } = req.body;
    if (users.find(user => user.email === email)) {
        return res.status(409).json({ message: 'User already exists' });
    }

    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    res.status(201).json({ message: 'User created successfully' });
});

// Sign-in Route (Generates JWT)
app.post("/auth/signin", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT Token valid for 1 hour
    const token = jwt.sign({ id: user.id, email: user.email }, TOKEN_SECRET, { expiresIn: '1h' });
    
    res.status(200).json({ 
        message: 'Login successful',
        accessToken: token 
    });
});

// ---Protected Routes (Apply JWT Middleware) ---

app.use(authenticateToken); // Every route below this line requires a valid token

app.get("/users", (req, res) => {
    // Accessible only if authenticateToken passes
    res.status(200).json({ 
        message: "Authorized access",
        currentUser: req.user,
        data: users.map(u => ({ name: u.name, email: u.email })) 
    });
});

app.get("/files/download", (req, res) => {
    res.download(path.resolve('./file.txt'));
});

// 404 Handler
app.all("{/*dummy}",(req,res,next)=>{ 
    res.send('404 page not found')
}) 
app.listen(port, () => {
    console.log(`Server running on port : ${port}`);
});
