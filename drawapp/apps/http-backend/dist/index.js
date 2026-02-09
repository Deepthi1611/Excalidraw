"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const port = 3000;
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
