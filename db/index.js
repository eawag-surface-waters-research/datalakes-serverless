const { Pool } = require("pg");
const creds = require("../config");

const pool = new Pool({
  user: creds.user,
  host: creds.host,
  database: creds.database,
  password: creds.password,
  port: creds.port,
});

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
};
