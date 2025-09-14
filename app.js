const express = require("express");
const app = express();
const http = require("http");
const dotenv = require("dotenv").config();
const config = require("./config/config");
const functions = require("firebase-functions");

//const Bree = require('bree')

const morgan = require("morgan");
const db = require("./config/database");
const cors = require("cors");
const { verifyLanguage } = require("./middlewares/language");
const { errorHandler } = require("./middlewares/errorHandler");

const server = http.createServer(app);

app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
app.use(verifyLanguage);

app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/users"));
app.use("/api", require("./routes/analytics"));
app.use("/api", require("./routes/items"));
app.use("/api", require("./routes/orders"));
app.use("/api", require("./routes/stores"));
app.use("/api", require("./routes/categories"));
app.use("/api", require("./routes/assistant"));
app.use("/api", require("./routes/channels"));
app.use("/api", require("./routes/chats"));
app.use("/api", require("./routes/messages"));
app.use("/api", require("./routes/plans"));
app.use("/api", require("./routes/payments"));
app.use("/api", require("./routes/subscriptions"));
app.use("/api", require("./routes/tags"));
app.use("/api", require("./routes/customerAddresses"));
app.use("/api", require("./routes/customers"));
app.use("/api", require("./routes/loyaltyTransactions"));
app.use("/api", require("./routes/loyaltyRules"));
app.use("/api", require("./routes/carts"));

app.use(errorHandler);

db()
  .then((data) => console.log("Mongo is up and running... ;)"))
  .catch((error) => console.error(error));

app.get("/", (request, response) => {
  return response.status(200).json({
    message: `welcome to RA'AYA`,
  });
});

server.listen(config.PORT, () =>
  console.log(`server started on port ${config.PORT} [${config.APP_NAME} APP]`)
);

//exports.app = functions.https.onRequest(app)
