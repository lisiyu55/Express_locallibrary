const BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var async = require('async');
// 显示完整的藏书副本列表
// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {

  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.json({ bookinstance_list: list_bookinstances });
      // res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });

};

// 为藏书的每一本副本显示详细信息的页面
// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {

  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance == null) { // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.json({ bookinstance: bookinstance });
      // res.render('bookinstance_detail', { title: 'Book:', bookinstance:  bookinstance});
    })

};

// 由 GET 显示创建藏书副本的表单
// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {

  Book.find({}, 'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      // res.render('bookinstance_form', { title: 'Create BookInstance', books: books });
      res.json({ books: books });
    });

};

// 由 POST 处理藏书副本创建操作
// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

  // Validate fields.
  body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
  body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  sanitizeBody('book').trim().escape(),
  sanitizeBody('imprint').trim().escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance(
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title')
        .exec(function (err, books) {
          if (err) { return next(err); }
          // Successful, so render.
          res.json({ title: 'Create BookInstance', books: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance, flag: false });
          // res.render('bookinstance_form', { title: 'Create BookInstance', books: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
        });
      return;
    }
    else {
      // Data from form is valid.
      bookinstance.save(function (err) {
        if (err) { return next(err); }
        // Successful - redirect to new record.
        res.json({ flag: true, bookinstance: bookinstance });
        // res.redirect(bookinstance.url);
      });
    }
  }
];

// 由 GET 显示删除藏书副本的表单
exports.bookinstance_delete_get = (req, res) => {
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(req.params.id).exec(callback)
    },
  }, function (err, results) {
    if (err) { return next(err); }
    if (results.bookinstance == null) { // No results.
      res.redirect('/catalog/bookinstances');
    }
    // Successful, so render.
    res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: results.bookinstance });
  });
};

// 由 POST 处理藏书副本删除操作
exports.bookinstance_delete_post = (req, res) => {
  var id = req.params.id;
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(id).exec(callback)
    },
  }, function (err, results) {
    if (err) { res.json({ error: err, flag: false }) }
    // Success
    // Author has no books. Delete object and redirect to the list of authors.
    BookInstance.findByIdAndRemove(id, function deleteBookInstance(err) {
      if (err) { res.json({ error: err, flag: false }) }
      // Success - go to author list
      // res.redirect('/catalog/bookinstances')
      res.json({ error: "no", flag: true });
    })

  });
};

// 由 GET 显示更新藏书副本的表单
exports.bookinstance_update_get = (req, res) => {
  // Get book, authors and genres for form.
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(req.params.id).populate('book').exec(callback);
    },
    books: function (callback) {
      Book.find(callback);
    },
  }, function (err, results) {
    if (err) { return next(err); }
    if (results.bookinstance == null) { // No results.
      var err = new Error('BookInstance not found');
      err.status = 404;
      return next(err);
    }
    // Success.
    res.json({ bookinstance: results.bookinstance, books: results.books });
    // res.render('bookinstance_form', { title: 'Update BookInstance', bookinstance: results.bookinstance, books: results.books });
  });
};

// 由 POST 处理藏书副本更新操作
exports.bookinstance_update_post = [// Convert the genre to an array


  // Validate fields.
  body('book', 'Book must not be empty.').isLength({ min: 1 }).trim(),
  body('imprint', 'imprint must not be empty.').isLength({ min: 1 }).trim(),
  body('status', 'Status must not be empty.').isLength({ min: 1 }).trim(),
  body('due_back', 'due_back must not be empty').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  sanitizeBody('book').trim().escape(),
  sanitizeBody('imprint').trim().escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    var bookinstance = new BookInstance(
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id //This is required, or a new ID will be assigned!
      });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      async.parallel({
        books: function (callback) {
          Book.find(callback);
        },
      }, function (err, results) {
        if (err) { res.json({ error: err, flag: false }); }

        // Mark our selected genres as checked.
        // res.render('bookinstance_form', { title: 'Update BookInstance', books: results.books, bookinstance: bookinstance });
      });
      return;
    }
    else {
      // Data from form is valid. Update the record.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
        if (err) { res.json({ error: err, flag: false }); }
        // Successful - redirect to book detail page.
        res.json({ bookinstance: bookinstance, flag: true });
        // res.redirect(thebookinstance.url);
      });
    }
  }
];