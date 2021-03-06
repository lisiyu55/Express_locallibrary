var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var async = require('async');

exports.index = function (req, res) {

    async.parallel({
        book_count: function (callback) {
            Book.count({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function (callback) {
            BookInstance.count({}, callback);
        },
        book_instance_available_count: function (callback) {
            BookInstance.count({ status: 'Available' }, callback);
        },
        author_count: function (callback) {
            Author.count({}, callback);
        },
        genre_count: function (callback) {
            Genre.count({}, callback);
        },
    }, function (err, results) {
        res.json({ book_count: results.book_count, book_instance: results.book_instance_count, book_instance_available: results.book_instance_available_count, author: results.author_count, genre: results.genre_count });
        // res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// 显示完整的藏书列表
// Display list of all Books.
exports.book_list = function (req, res, next) {

    Book.find({}, 'title author')
        .populate('author')
        .exec(function (err, list_books) {
            if (err) { return next(err); }
            //Successful, so render
            // res.render('book_list', { title: 'Book List', book_list: list_books });
            res.json({ book_list: list_books });
        });

};

// 为每种藏书显示详细信息的页面
// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {

    async.parallel({
        book: function (callback) {

            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function (callback) {

            BookInstance.find({ 'book': req.params.id })
                .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.book == null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.json({ book: results.book, book_instances: results.book_instance });
        // res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instance });
    });

};

// 由 GET 显示创建藏书的表单
// Display book create form on GET.
exports.book_create_get = function (req, res, next) {

    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function (callback) {
            Author.find(callback);
        },
        genres: function (callback) {
            Genre.find(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        res.json({ authors: results.authors, genres: results.genres });
        // res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });

};

// 由 POST 处理藏书创建操作
// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields (using wildcard).
    sanitizeBody('*').trim().escape(),
    sanitizeBody('genre.*').escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                },
            }, function (err, results) {
                if (err) { res.json({flag: false, error: err}); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.json({flag: false, error: err});
                // res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                //successful - redirect to new book record.
                // res.redirect(book.url);
                res.json({book: book, flag: true});
            });
        }
    }
];

// 由 GET 显示删除藏书的表单
exports.book_delete_get = (req, res) => {
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id).exec(callback)
        },
        books_bookinstances: function (callback) {
            BookInstance.find({ 'book': req.params.id }).exec(callback)
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.book == null) { // No results.
            res.redirect('/catalog/books');
        }
        // Successful, so render.
        res.render('book_delete', { title: 'Delete Book', book: results.book, books_bookinstances: results.books_bookinstances });
    });
};

// 由 POST 处理藏书删除操作
exports.book_delete_post = (req, res) => {
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id).exec(callback)
        },
        books_bookinstances: function (callback) {
            BookInstance.find({ 'book': req.params.id }).exec(callback)
        },
    }, function (err1, results) {
        if (err1) { return next(err1); }
        // Success
        if (results.books_bookinstances.length > 0) {
            // Author has books. Render in same way as for GET route.
            // res.render('book_delete', { title: 'Delete Book', book: results.book, books_bookinstances: results.books_bookinstances });
            res.json({ book: results.book, books_bookinstances: results.books_bookinstances, flag: false});
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Book.findByIdAndRemove(req.params.id, function deleteBook(err) {
                if (err) { res.json({ error: err, flag: false}) }
                // Success - go to author list
                // res.redirect('/catalog/books')
                res.json({ flag: true });
            })
        }
    });
};

// 由 GET 显示更新藏书的表单
// Display book update form on GET.
exports.book_update_get = function (req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function (callback) {
            Author.find(callback);
        },
        genres: function (callback) {
            Genre.find(callback);
        },
    }, function (err, results) {
        if (err) { res.json({error: err}); }
        if (results.book == null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            // return next(err);
            res.json({error: err});
        }
        // Success.
        // Mark our selected genres as checked.
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }
        res.json({ authors: results.authors, genres: results.genres, book: results.book });
        // res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
    });

};

// 由 POST 处理藏书更新操作
// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('title').trim().escape(),
    sanitizeBody('author').trim().escape(),
    sanitizeBody('summary').trim().escape(),
    sanitizeBody('isbn').trim().escape(),
    sanitizeBody('genre.*').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id: req.params.id //This is required, or a new ID will be assigned!
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                },
            }, function (err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.json({ flag: false, authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
                // res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
                if (err) { res.json({error: err, flag: false}) }
                // Successful - redirect to book detail page.
                // res.redirect(thebook.url);
            });
            res.json({book: book, flag: true});
        }
    }
];