"use strict";
const ServerlessClient = require("serverless-postgres");
const creds = require("./config");

const client = new ServerlessClient({
  user: creds.user,
  host: creds.host,
  database: creds.database,
  password: creds.password,
  port: creds.port,
  debug: true,
  delayMs: 3000,
});

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

function isInt(value) {
  if (/^[-+]?(\d+|Infinity)$/.test(value)) {
    return true;
  } else {
    return false;
  }
}

module.exports.getAllDatasets = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await client.connect();
    const res = await client.query(
      "SELECT accompanyingdata, citation, datasource, datasourcelink, description, downloads, embargo, fileconnect, id, lakes_id, latitude, licenses_id, liveconnect, longitude, mapplot, mapplotfunction, maxdatetime, maxdepth, mindatetime, mindepth, organisations_id, origin, persons_id, plotproperties, prefile, prescript, projects_id, renku, repositories_id, title, monitor, internal FROM datasets WHERE title IS NOT NULL AND dataportal IS NOT NULL"
    );
    await client.clean();
    return callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify(res.rows),
    });
  } catch (e) {
    callback(null, {
      statusCode: e.statusCode || 500,
      headers,
      body: "Failed to collect datasets. " + e,
    });
  }
};

module.exports.getDataset = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;
  if (!isInt(id)) {
    return callback(null, {
      statusCode: 400,
      headers,
      body: "ID must be an integer",
    });
  }
  try {
    await client.connect();
    const res = await client.query(
      `SELECT accompanyingdata, citation, datasource, datasourcelink, description, downloads, embargo, fileconnect, id, lakes_id, latitude, licenses_id, liveconnect, longitude, mapplot, mapplotfunction, maxdatetime, maxdepth, mindatetime, mindepth, organisations_id, origin, persons_id, plotproperties, prefile, prescript, projects_id, renku, repositories_id, title, monitor FROM datasets WHERE id = ${id}`
    );
    await client.clean();
    if (res.rows.length < 1) {
      return callback(null, {
        statusCode: 404,
        headers,
        body: "Dataset not found in database",
      });
    }
    return callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify(res.rows[0]),
    });
  } catch (e) {
    callback(null, {
      statusCode: e.statusCode || 500,
      headers,
      body: "Failed to collect dataset. " + e,
    });
  }
};

module.exports.getAllDatasetparameters = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    var query = "SELECT * FROM datasetparameters";
    if (event.queryStringParameters) {
      var datasets_id = event.queryStringParameters.datasets_id;
      var parameters_id = event.queryStringParameters.parameters_id;
      if ((datasets_id, parameters_id)) {
        if (!isInt(datasets_id) || !isInt(parameters_id)) {
          return callback(null, {
            statusCode: 400,
            headers,
            body: "ID must be an integer",
          });
        }
        query = `SELECT * FROM datasetparameters WHERE datasets_id = ${datasets_id} AND parameters_id = ${parameters_id}`;
      } else if (datasets_id) {
        if (!isInt(datasets_id)) {
          return callback(null, {
            statusCode: 400,
            headers,
            body: "ID must be an integer",
          });
        }
        query = `SELECT * FROM datasetparameters WHERE datasets_id = ${datasets_id}`;
      }
    }
    await client.connect();
    const res = await client.query(query);
    await client.clean();
    if (res.rows.length < 1) {
      return callback(null, {
        statusCode: 404,
        headers,
        body: "Dataset not found in database",
      });
    }
    return callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify(res.rows),
    });
  } catch (e) {
    callback(null, {
      statusCode: e.statusCode || 500,
      headers,
      body: "Failed to collect datasetparameters. " + e,
    });
  }
};

module.exports.getAllSelectiontables = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await client.connect();
    const res = await Promise.all([
      client.query("SELECT * FROM parameters"),
      client.query("SELECT * FROM lakes"),
      client.query("SELECT * FROM organisations"),
      client.query("SELECT * FROM persons"),
      client.query("SELECT * FROM projects"),
      client.query("SELECT * FROM sensors"),
      client.query("SELECT * FROM licenses"),
    ]);
    await client.clean();
    const selectiontables = {
      parameters: res[0].rows,
      lakes: res[1].rows,
      organisations: res[2].rows,
      persons: res[3].rows,
      projects: res[4].rows,
      sensors: res[5].rows,
      licenses: res[6].rows,
      axis: [{ name: "M" }, { name: "x" }, { name: "y" }, { name: "z" }],
    };
    return callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify(selectiontables),
    });
  } catch (e) {
    callback(null, {
      statusCode: e.statusCode || 500,
      headers,
      body: "Failed to collect tables. " + e,
    });
  }
};

module.exports.getSelectiontable = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const table = event.pathParameters.table;
  const tables = [
    "parameters",
    "lakes",
    "organisations",
    "persons",
    "projects",
    "sensors",
    "licenses",
  ];
  if (!tables.includes(table)) {
    return callback(null, {
      statusCode: 400,
      headers,
      body: "Table not available",
    });
  }

  try {
    await client.connect();
    const res = await client.query(`SELECT * FROM ${table}`);
    await client.clean();
    return callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify(res.rows),
    });
  } catch (e) {
    callback(null, {
      statusCode: e.statusCode || 500,
      headers,
      body: "Failed to collect table. " + e,
    });
  }
};

module.exports.getAllFiles = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    var query = "SELECT * FROM files";
    if (event.queryStringParameters) {
      var datasets_id = event.queryStringParameters.datasets_id;
      var type = event.queryStringParameters.type;

      if (datasets_id) {
        if (!isInt(datasets_id)) {
          return callback(null, {
            statusCode: 400,
            headers,
            body: "ID must be an integer",
          });
        }
        if (type) {
          if (type !== "json") {
            return callback(null, {
              statusCode: 400,
              headers,
              body: "Type query not available, try using json",
            });
          }
          query = `SELECT * FROM files WHERE datasets_id = ${datasets_id} AND filetype = 'json'`;
        } else {
          query = `SELECT * FROM files WHERE datasets_id = ${datasets_id}`;
        }
      }
    }

    await client.connect();
    const res = await client.query(query);
    await client.clean();
    return callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify(res.rows),
    });
  } catch (e) {
    callback(null, {
      statusCode: e.statusCode || 500,
      headers,
      body: "Failed to collect files. " + e,
    });
  }
};
