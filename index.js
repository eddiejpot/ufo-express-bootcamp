/* ========================= IMPORT MODULES ========================= */

import express from 'express';
import methodOverride from 'method-override';
import moment from 'moment';
import {
  read, append, edit, write,
} from './jsonFileStorage.js';

moment().format();

/* ========================= EXPRESS/EJS SET UP =========================== */
// Express Set Up
const app = express();

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

/* The code below allows us to listen for post requests
  *read more about it below
  *https://bootcamp.rocketacademy.co/3-backend-applications/3.1-express-js/3.1.3-handling-post-requests#receive-post-requests-in-express
*/
app.use(express.urlencoded({ extended: false }));

// EJS Set Up
app.set('view engine', 'ejs');

// allow access to public directory
app.use(express.static('public'));

/* ================================ GLOBALS =============================== */
// data base
const DATABASE = 'data.json';
// Port Set up
const PORT = 3004;

/* ================================ FUNCTIONS =============================== */

/**
 * Reads Database
 * @returns {Object} {Sightings: [{},{}...]}
 */
const readDataBase = (req, res, next) => {
  read(DATABASE, (err, content) => {
    if (err) {
      return console.error(err);
    }
    req.AllSightingsObj = content;
    next();
  });
};

/**
 * Groups sightings by specified key
 * @param {Object} dataBase sightings object
 * * @param {String} key key to sort by
 * @returns {Object} e.g. if sort by shape
 * it will return -> { circle: [{},{}...], square:[{},{}...] }
 */
const groupSightingsByKey = (dataBase, key) => {
  const allSightingsArr = dataBase.sightings;
  // group by key
  const categories = {};
  allSightingsArr.forEach((e, i) => {
    // make category name lowercase excluding undefined
    const cat = e[key]?.toLowerCase();
    if (!(cat in categories)) {
      categories[cat] = [e];
      // categories[cat] = 1;
    } else {
      categories[cat].push(e);
      // categories[cat] += 1;
    }
  });
  return categories;
};

const getCurretDateAndTime = () => {
  const d = new Date();
  const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const time = `${d.getHours()}:${d.getMinutes()}`;
  return (`${date} ${time}`);
};

/* ================================ ROUTES =============================== */

// Homepage
app.get('/', readDataBase, (req, res) => {
  const allSightingsObj = req.AllSightingsObj;
  res.render('index', allSightingsObj);
});

// Single sighting GET
app.get('/sighting/:index', readDataBase, (req, res) => {
  // get index
  const { index } = req.params;
  // get data
  const allSightingsObj = req.AllSightingsObj;
  const sighting = allSightingsObj.sightings[index];
  const sightingInfo = { sighting };
  const sightingIndex = { index };
  // render page
  res.render('single-sighting', { sightingInfo, sightingIndex });
});

// Shapes
app.get('/shapes', readDataBase, (req, res) => {
  const sightingsObj = req.AllSightingsObj;
  const sightingsGroupedByShapeObj = groupSightingsByKey(sightingsObj, 'shape');
  const sightingsGroupedByShapeArr = Object.entries(sightingsGroupedByShapeObj);
  res.render('shapes', { sightingsGroupedByShapeArr });
});

// Shapes / <shape>
app.get('/shapes/:shape', readDataBase, (req, res) => {
  const { shape } = req.params;
  const sightingsObj = req.AllSightingsObj;
  const sightingsGroupedByShapeObj = groupSightingsByKey(sightingsObj, 'shape');
  const shapeType = { shape };
  const selectedShapeSightings = sightingsGroupedByShapeObj[shape];
  // console.log(selectedShapeSightings);
  // console.log(shapeType);
  res.render('sightings-shape', { shapeType, selectedShapeSightings });
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> EDITING A SIGHTING
// Single sighting PUT FORM (GET)
app.get('/sighting/:index/edit', readDataBase, (req, res) => {
  // get index
  const { index } = req.params;
  // get data
  const allSightingsObj = req.AllSightingsObj;
  const sighting = allSightingsObj.sightings[index];
  const sightingInfo = { sighting };
  const sightingIndex = { index };
  // render page
  res.render('edit', { sightingInfo, sightingIndex });
});
// Single sighting PUT FORM (PUT)
app.put('/sighting/:index/edit', (req, res) => {
  const { index } = req.params;
  edit(DATABASE, (err, jsonContentObj) => {
    if (err) {
      return console.error('error editing data');
    }
    // get the date posted before editing
    const datePosted = jsonContentObj.sightings[index].post_create_date_time;
    // Replace the data in the object at the given index
    jsonContentObj.sightings[index] = req.body;
    // keep the date posted the same
    jsonContentObj.sightings[index].post_create_date_time = datePosted;
    // redirect to successful form submission page
    res.redirect(`/sighting/${index}`);
  });
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> POSTING A SIGHTING
// Sightings form GET
app.get('/sighting', (req, res) => {
  res.render('sighting');
});
// Sightings form POST
app.post('/sighting', (req, res) => {
// get sighting submission
  const sightingSubmissionObj = req.body;
  // add post created time into Obj
  sightingSubmissionObj.post_create_date_time = getCurretDateAndTime();
  // Add new  data in request.body to recipes array in data.json.
  append(DATABASE, 'sightings', sightingSubmissionObj, (err) => {
    if (err) {
      res.status(500).send('DB write error.');
      return;
    }
    // Acknowledge recipe saved.
    console.log('New form submitted!');
    // Redirect
    res.redirect('/form-submit-successful');
  });
});
// Form submission successful
app.get('/form-submit-successful', (req, res) => {
  res.render('form-submit-successful');
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DELETING A SIGHTING
app.delete('/sighting/:index', (req, res) => {
  const { index } = req.params;
  edit(DATABASE, (err, jsonContentObj) => {
    if (err) {
      return console.error('error removing data');
    }
    console.log('deleting!');
    // Remove the data in the object at the given index
    jsonContentObj.sightings.splice(index, 1);
    // redirect to homepage
    res.redirect('/');
  });
});

// Listen
app.listen(PORT);
