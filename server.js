'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
var shortId = require('shortid');
require('dotenv').config();

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true }).then(()=> console.log('DB connected')
).catch( err => console.log(err)
);


app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// create URL model schema
 const urlSchema = new mongoose.Schema({
   original_url: {
     type: String,
     required: true
   },
   short_url: {
     type: String,
     required: true
   }
 });

 // use schema to create a URL model

 const URL = mongoose.model('URL', urlSchema);

//  create new url route
app.post('/api/shorturl/new', async function (req, res) {
  const url = req.body.url_input;
  const urlCode = shortId.generate();

  //check if url is valid or not
if (!validUrl.isWebUri(url)) {
  res.json({
    error: 'invalid URL'
  })
} else {
  try {
    // check if its already in the database
    let findOne = await URL.findOne({
      original_url: url
    })
    if (findOne) {
      res.json({
        original_url :findOne.original_url,
        short_url: findOne.short_url
      })
    } else {
      // if it doesn't exist create and respond with it
      findOne = new URL({
        original_url: url,
        short_url: urlCode
      })
      await findOne.save()
      res.json({
        original_url: findOne.original_url,
        short_url: findOne.short_url
      })
    }
  } catch(err) {
    console.error(err)
    res.status(500).json('Server Error')
  }
}
})

// get route to get short url from original url
app.get('/api/shorturl/:short_url?', async function (req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json('No URL found')
    }
  } catch(err) {
    console.log(err)
    res.status(500).json('Server error');
  }
})


app.listen(port, function () {
  console.log(`Node.js listening on port ${port}`);
});