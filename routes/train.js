
const express = require("express");
const trainController = require("../controllers/trainController");

const router = express.Router();

router.post("/", trainController.train);

module.exports = router;
