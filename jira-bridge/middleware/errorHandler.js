exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "An error occurred on the server.";

  res.status(statusCode).render("error", { message });
};
