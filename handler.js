"use strict";
const db = require("./db");

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

module.exports.getAllDatasets = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  db.query(
    "SELECT accompanyingdata, citation, datasource, datasourcelink, description, downloads, embargo, fileconnect, id, lakes_id, latitude, licenses_id, liveconnect, longitude, mapplot, mapplotfunction, maxdatetime, maxdepth, mindatetime, mindepth, organisations_id, origin, persons_id, plotproperties, prefile, prescript, projects_id, renku, repositories_id, title, monitor, internal FROM datasets WHERE title IS NOT NULL AND dataportal IS NOT NULL"
  )
    .then((res) => {
      return callback(null, {
        statusCode: 200,
        headers,
        body: JSON.stringify(res.rows),
      });
    })
    .catch((e) => {
      callback(null, {
        statusCode: e.statusCode || 500,
        headers,
        body: "Could not find Dataset: " + e,
      });
    });
};

module.exports.getDataset = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;
  if (!isInt(id)) {
    return callback(null, {
      statusCode: 400,
      headers,
      body: "ID must be an integer",
    });
  }
  db.query(
    "SELECT accompanyingdata, citation, datasource, datasourcelink, description, downloads, embargo, fileconnect, id, lakes_id, latitude, licenses_id, liveconnect, longitude, mapplot, mapplotfunction, maxdatetime, maxdepth, mindatetime, mindepth, organisations_id, origin, persons_id, plotproperties, prefile, prescript, projects_id, renku, repositories_id, title, monitor FROM datasets WHERE id = $1",
    [id]
  )
    .then((res) => {
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
    })
    .catch((e) => {
      callback(null, {
        statusCode: e.statusCode || 500,
        headers,
        body: "Could not find Dataset: " + e,
      });
    });
};

module.exports.getAllDatasetparameters = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
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
      db.query(
        "SELECT * FROM datasetparameters WHERE datasets_id = $1 AND parameters_id = $2",
        [datasets_id, parameters_id]
      )
        .then((res) => {
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
        })
        .catch((e) => {
          callback(null, {
            statusCode: e.statusCode || 500,
            headers,
            body: "Could not find Dataset: " + e,
          });
        });
    } else if (datasets_id) {
      if (!isInt(datasets_id)) {
        return callback(null, {
          statusCode: 400,
          headers,
          body: "ID must be an integer",
        });
      }
      db.query("SELECT * FROM datasetparameters WHERE datasets_id = $1", [
        datasets_id,
      ])
        .then((res) => {
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
        })
        .catch((e) => {
          callback(null, {
            statusCode: e.statusCode || 500,
            headers,
            body: "Could not find Dataset: " + e,
          });
        });
    } else {
      db.query("SELECT * FROM datasetparameters")
        .then((res) => {
          return callback(null, {
            statusCode: 200,
            headers,
            body: JSON.stringify(res.rows),
          });
        })
        .catch((e) => {
          callback(null, {
            statusCode: e.statusCode || 500,
            headers,
            body: "Could not find Dataset: " + e,
          });
        });
    }
  } else {
    db.query("SELECT * FROM datasetparameters")
      .then((res) => {
        return callback(null, {
          statusCode: 200,
          headers,
          body: JSON.stringify(res.rows),
        });
      })
      .catch((e) => {
        callback(null, {
          statusCode: e.statusCode || 500,
          headers,
          body: "Could not find Dataset: " + e,
        });
      });
  }
};

module.exports.getAllSelectiontables = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  Promise.all([
    db.query("SELECT * FROM parameters"),
    db.query("SELECT * FROM lakes"),
    db.query("SELECT * FROM organisations"),
    db.query("SELECT * FROM persons"),
    db.query("SELECT * FROM projects"),
    db.query("SELECT * FROM sensors"),
    db.query("SELECT * FROM licenses"),
  ])
    .then((res) => {
      var selectiontables = {
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
    })
    .catch((e) => {
      callback(null, {
        statusCode: e.statusCode || 500,
        headers,
        body: "Failed to collect tables: " + e,
      });
    });
};

module.exports.getSelectiontable = (event, context, callback) => {
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

  db.query(`SELECT * FROM ${table}`)
    .then((res) => {
      return callback(null, {
        statusCode: 200,
        headers,
        body: JSON.stringify(res.rows),
      });
    })
    .catch((e) => {
      callback(null, {
        statusCode: e.statusCode || 500,
        headers,
        body: "Failed to collect table: " + e,
      });
    });
};

module.exports.getAllFiles = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
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
        db.query(
          "SELECT * FROM files WHERE datasets_id = $1 AND filetype = 'json'",
          [datasets_id]
        )
          .then((res) => {
            return callback(null, {
              statusCode: 200,
              headers,
              body: JSON.stringify(res.rows),
            });
          })
          .catch((e) => {
            callback(null, {
              statusCode: e.statusCode || 500,
              headers,
              body: "Couldn't collect files: " + e,
            });
          });
      } else {
        db.query("SELECT * FROM files WHERE datasets_id = $1", [datasets_id])
          .then((res) => {
            return callback(null, {
              statusCode: 200,
              headers,
              body: JSON.stringify(res.rows),
            });
          })
          .catch((e) => {
            callback(null, {
              statusCode: e.statusCode || 500,
              headers,
              body: "Couldn't collect files: " + e,
            });
          });
      }
    } else {
      db.query("SELECT * FROM files")
        .then((res) => {
          return callback(null, {
            statusCode: 200,
            headers,
            body: JSON.stringify(res.rows),
          });
        })
        .catch((e) => {
          callback(null, {
            statusCode: e.statusCode || 500,
            headers,
            body: "Couldn't collect files: " + e,
          });
        });
    }
  } else {
    db.query("SELECT * FROM files")
      .then((res) => {
        return callback(null, {
          statusCode: 200,
          headers,
          body: JSON.stringify(res.rows),
        });
      })
      .catch((e) => {
        callback(null, {
          statusCode: e.statusCode || 500,
          headers,
          body: "Couldn't collect files: " + e,
        });
      });
  }
};
