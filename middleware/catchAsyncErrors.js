// Higher-order function that wraps async route handlers to catch errors
module.exports = func => (req, res, next) =>
    Promise.resolve(func(req, res, next))
        .catch(next); 