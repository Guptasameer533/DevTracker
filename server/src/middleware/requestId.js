const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  const id = `req_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  req.requestId = id;
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = requestId;
