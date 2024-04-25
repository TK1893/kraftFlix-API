const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();
app.use(bodyParser.json()); // To read body information

// Integration von Mongoose in die REST-API
const mongoose = require('mongoose'); // Mongoose package
const Models = require('./models.js'); // Mongoose-Models definded in models.js
const Movies = Models.Movie; // Model name defined in models.js
const Users = Models.User; // Model name defined in models.js
// allows Mongoose to connect to the database to perform CRUD operations on the containing documents
mongoose.connect('mongodb://localhost:27017/kraftFlixDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// createWriteStream() = fs function fo create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});
// setup the logger ( using Morgan Middleware)
app.use(morgan('combined', { stream: accessLogStream }));
// app.use = Express method that mounts middleware functions to a specific path.

app.use(
  '/documentation',
  express.static('public', { index: 'documentation.html' })
  // { index: 'documentation.html' } = options object. It specifies that when a directory is requested,
  // Express should look for a file named "documentation.html" in that directory(public) and serve it as the default index file
);

// *****************************************************************************************************
// CREATE / POST requests
// *****************************************************************************************************

// CREATE new USER
// We’ll expect JSON in this format
// { ID: Integer, Username: String, Password: String, Email: String, Birthday: Date }

app.post('/users', async (req, res) => {
  await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthdate: req.body.Birthdate,
        })
          .then((user) => {
            res.status(201).json(user);
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Add Movie to FavoriteMovies
app.post('/users/:Username/movies/:MovieID', (req, res) => {
  const { Username, MovieID } = req.params;

  Users.findOne({ Username })
    .then((user) => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      return Users.findOneAndUpdate(
        { Username },
        { $addToSet: { FavoriteMovies: MovieID } },
        { new: true }
      );
    })
    .then((updatedUser) => {
      res
        .status(200)
        .send(
          `New Favorite Movie ${MovieID} was added. \n Updated Favorite Movies of ${updatedUser.Username}:\n[ ${updatedUser.FavoriteMovies} ]`
        );
    })
    // .then((updatedUser) => {
    //   res.status(200).json(updatedUser);
    // })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// *****************************************************************************************************
// READ / GET requests
// *****************************************************************************************************
// HOME
app.get('/', (req, res) => {
  res.send('Welcome to my kraftFlix app!');
});

// All USERS
app.get('/users', async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// USER by USERNAME
app.get('/users/:Username', async (req, res) => {
  await Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// All MOVIES
app.get('/movies', async (req, res) => {
  await Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send('Error. ' + err);
    });
});

// MOVIE by TITLE
app.get('/movies/:Title', async (req, res) => {
  await Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.json(movie);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send('Error: ' + err);
    });
});
// MOVIE by ID
// app.get('/movies/:MovieID', async (req, res) => {
//   await Movies.findOne({ MovieID: req.params.MovieID })
//     .then((movie) => {
//       res.json(movie);
//     })
//     .catch((error) => {
//       console.log(error);
//       res.status(500).send('Error: ' + err);
//     });
// });
// MOVIE by Title
app.get('/movies/:movieTitle', async (req, res) => {
  await Movies.findOne({ MovieTitle: req.params.movieTitle })
    .then((movie) => {
      res.json(movie);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send('Error: ' + err);
    });
});

// DIRECTOR by NAME
app.get('/movies/directors/:directorName', async (req, res) => {
  await Movies.findOne({ 'Director.Name': req.params.directorName })
    .then((movies) => {
      res.json(movies.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GENRE by NAME
app.get('/movies/genres/:genreName', async (req, res) => {
  await Movies.findOne({ 'Genre.Name': req.params.genreName })
    .then((movies) => {
      res.json(movies.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// *****************************************************************************************************
// Update / PUT requests
// *****************************************************************************************************

// USER's INFO, by USERNAME
//We’ll expect JSON in this format
/* 
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}
*/
app.put('/users/:Username', async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      },
    },
    { new: true }
  ) // This line makes sure that the updated document is returned
    .then((updatedUser) => {
      // Promise
      res.json(updatedUser);
    })
    .catch((err) => {
      // Error Handling
      console.error(err);
      res.status(500).send('Error:' + err);
    });
});

// *****************************************************************************************************
// DELETE / DELETE requests
// *****************************************************************************************************
app.delete('/users/:Username/movies/:MovieID', (req, res) => {
  const { Username, MovieID } = req.params;

  Users.findOne({ Username })
    .then((user) => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      return Users.findOneAndUpdate(
        { Username },
        { $pull: { FavoriteMovies: MovieID } },
        { new: true }
      );
    })
    .then((updatedUser) => {
      res.status(200).json(updatedUser);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// DELETE a USER by USERNAME
app.delete('/users/:Username', async (req, res) => {
  await Users.findOneAndDelete({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
// *******************************************************************************************************
// Error Handling with Express
// *******************************************************************************************************
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
