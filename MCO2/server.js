const express = require('express');
const exphbs = require('express-handlebars');
const app = express();

// set static folder
app.use(express.static(__dirname + "public"));

app.engine("hbs", exphbs.engine({extname: 'hbs'}));

app.set("view engine", "hbs");

app.set("views", "./views");
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    res.render("index", {
        title: "homepage",
        name: "Jimmy"
    });
})
app.listen(port, () => {
    console.log("server now listening on port " + port);
});

// const mongoose = require('mongoose');



/* app.get('/test', (req, res) => {
    console.log('Test route accessed. Sending response.');
    res.send('Server working');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));*/