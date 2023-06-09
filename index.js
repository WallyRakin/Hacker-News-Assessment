// require modules

const express = require('express');
const app = express();
const path = require('path');

app.set('views', path.join(__dirname, '/views')); //defines the location of the templates
app.set('view engine', 'ejs'); // sets view engine to recognise ejs
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }))


// routes

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
// Run server

app.listen(3000, () => {
    console.log('Server running on port 3000...')
});