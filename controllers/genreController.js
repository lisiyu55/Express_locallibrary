const Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


const mongoose = require('mongoose');
// 显示完整的藏书种类列表
exports.genre_list = function (req, res, next) {

  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genre) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list: list_genre });
    });

};

// 为每一类藏书显示详细信息的页面
// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  // var id = mongoose.Types.ObjectId(req.params.id);
  // console.log(id);
  async.parallel({
    genre: function (callback) {
      Genre.findById(req.params.id)
        .exec(callback);
    },

    genre_books: function (callback) {
      Book.find({ 'genre': req.params.id })
        .exec(callback);
    },

  }, function (err, results) {
    if (err) { return next(err); }
    if (results.genre == null) { // No results.
      var err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
  });

};

// 由 GET 显示创建藏书种类的表单
// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  res.render('genre_form', { title: 'Create Genre' });
};

// 由 POST 处理藏书种类创建操作
// Handle Genre create on POST.
exports.genre_create_post = [

  // Validate that the name field is not empty.
  body('name', 'Genre name required').isLength({ min: 1 }).trim(),

  // Sanitize (trim and escape) the name field.
  sanitizeBody('name').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre(
      { name: req.body.name }
    );


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
      return;
    }
    else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec(function (err, found_genre) {
          if (err) { return next(err); }

          if (found_genre) {
            // Genre exists, redirect to its detail page.
            res.redirect(found_genre.url);
          }
          else {

            genre.save(function (err) {
              if (err) { return next(err); }
              // Genre saved. Redirect to genre detail page.
              res.redirect(genre.url);
            });

          }

        });
    }
  }
];
// 由 GET 显示删除藏书种类的表单
exports.genre_delete_get = (req, res) => {
  async.parallel({
    genre: function (callback) {
      Genre.findById(req.params.id).exec(callback)
    },
    genres_books: function (callback) {
      // console.log(req.params.id);
      Book.find({ 'genre': req.params.id }).exec(callback)
    },
  }, function (err, results) {
    if (err) { return next(err); }
    if (results.genre == null) { // No results.
      res.redirect('/catalog/genres');
    }
    // Successful, so render.
    res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });
  });
};

// 由 POST 处理藏书种类删除操作
exports.genre_delete_post = (req, res) => {
  async.parallel({
    genre: function (callback) {
      Genre.findById(req.body.genreid).exec(callback)
    },
    genres_books: function (callback) {
      Book.find({ 'genre': req.body.genreid }).exec(callback)
    },
  }, function (err, results) {
    if (err) { return next(err); }
    // Success
    if (results.genres_books.length > 0) {
      // Genre has books. Render in same way as for GET route.
      res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });
      return;
    }
    else {
      // Genre has no books. Delete object and redirect to the list of genres.
      Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
        if (err) { return next(err); }
        // Success - go to author list
        res.redirect('/catalog/genres')
      })
    }
  });
};

// 由 GET 显示更新藏书种类的表单
exports.genre_update_get = (req, res) => {
  async.parallel({
    genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
    },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        
        res.render('genre_form', { title: 'Update Genre', genre: results.genre });
    });
};

// 由 POST 处理藏书种类更新操作
exports.genre_update_post = [

  // Validate fields.
  body('name', 'name must not be empty.').isLength({ min: 1 }).trim(),
  
  // Sanitize fields.
  sanitizeBody('name').trim().escape(),
  
  // Process request after validation and sanitization.
  (req, res, next) => {
  
    // Extract the validation errors from a request.
    const errors = validationResult(req);
  
    // Create a Book object with escaped/trimmed data and old id.
    var genre = new Genre(
      {
        name: req.body.name,
        _id: req.params.id //This is required, or a new ID will be assigned!
      });
    if (!errors.isEmpty()) {
        res.render('genre_form', { title: 'Update Genre', genre: genre});
    
      return;
    }
    else {
      // Data from form is valid. Update the record.
      Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
        if (err) { return next(err); }
        // Successful - redirect to book detail page.
        res.redirect(thegenre.url);
      });
    }
  }];