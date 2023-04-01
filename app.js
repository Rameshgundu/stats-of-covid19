const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Get state Table

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
     *
    FROM
     state; `;
  const dbResponse = await db.all(getStatesQuery);
  function getStates(eachObj) {
    return {
      stateId: eachObj.state_id,
      stateName: eachObj.state_name,
      population: eachObj.population,
    };
  }
  const allStates = dbResponse.map(getStates);
  response.send(allStates);
});

// Get a particular state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
      SELECT 
        *
      FROM 
        state
      WHERE
        state_id = ${stateId};`;
  const dbResponse = await db.get(getStateQuery);
  const state = {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };
  response.send(state);
});

// insert district details

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const insertDistrict = `
      INSERT INTO
       district(district_name, state_id, cases, cured, active, deaths)
      VALUES (
          '${districtName}',
          '${stateId}',
          '${cases}',
          '${cured}',
          '${active}',
          '${deaths}'
      );`;
  await db.run(insertDistrict);
  response.send("District Successfully Added");
});

// Get a particular district
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
      SELECT
        *
      FROM 
       district
      WHERE 
        district_id = ${districtId};
    `;
  const dbResponse = await db.get(getDistrictQuery);
  const districtDetails = {
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  };
  response.send(districtDetails);
});

/// Delete a district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
      DELETE
      FROM 
       district
      WHERE
         district_id = ${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

/// update district details
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
        UPDATE 
            district
        SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}; `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

/// statistics
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStats = `
      SELECT 
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(DEATHS) as totalDeaths
      FROM 
        district
      WHERE 
        state_id = ${stateId};
    `;
  const dbResp = await db.get(getStats);
  response.send(dbResp);
});

// get state name based on district
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateBasedOnDistrict = `
      SELECT
        state_name
      FROM 
        state 
      JOIN
        district
      WHERE 
        district_id = ${districtId};`;
  const stateDetails = await db.get(getStateBasedOnDistrict);
  const stateName = {
    stateName: stateDetails.state_name,
  };
  response.send(stateName);
});

module.exports = app;
