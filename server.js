const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "hospitalData.json");

// Read data from the file
function readData(callback) {
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, JSON.parse(data || "[]")); // Handle empty file
  });
}

// Write data to the file
function writeData(data, callback) {
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8", (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const normalizedUrl = url.replace(/\/$/, ""); // Remove trailing slash if present

  if (normalizedUrl === "/hospitals") {
    if (method === "GET") {
      readData((err, hospitals) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Error reading data" }));
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(hospitals));
      });
    } else if (method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const newHospital = JSON.parse(body);
        readData((err, hospitals) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error reading data" }));
          }
          newHospital.id = hospitals.length > 0 ? hospitals[hospitals.length - 1].id + 1 : 1;
          hospitals.push(newHospital);
          writeData(hospitals, (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ message: "Error writing data" }));
            }
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Hospital added", hospital: newHospital }));
          });
        });
      });
    } else if (method === "PUT") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const updatedHospital = JSON.parse(body);
        readData((err, hospitals) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error reading data" }));
          }
          const index = hospitals.findIndex((h) => h.id === updatedHospital.id);
          if (index === -1) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Hospital not found" }));
          }
          hospitals[index] = { ...hospitals[index], ...updatedHospital };
          writeData(hospitals, (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ message: "Error writing data" }));
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Hospital updated", hospital: hospitals[index] }));
          });
        });
      });
    } else if (method === "DELETE") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const { id } = JSON.parse(body);
        readData((err, hospitals) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Error reading data" }));
          }
          const index = hospitals.findIndex((h) => h.id === id);
          if (index === -1) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Hospital not found" }));
          }
          const deletedHospital = hospitals.splice(index, 1);
          writeData(hospitals, (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ message: "Error writing data" }));
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Hospital deleted", hospital: deletedHospital }));
          });
        });
      });
    } else {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Method not allowed" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
