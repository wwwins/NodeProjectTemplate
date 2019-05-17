/**
 * Copyright 2018 isobar. All Rights Reserved.
 *
 */

'use strict';

const dotenv = require('dotenv').config();
const express = require('express');
const expressFileUpload = require('express-fileupload');
const http = require('http');
const uuid = require('uuid/v1');
const formData = require('form-data');
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST
const PORT = (process.env.PORT || 8888)
const EXT_IP = process.env.EXT_IP
const APP_HOME = process.env.APP_HOME
const ENABLE_SSL = process.env.ENABLE_SSL
const API_HOST = (ENABLE_SSL=='true' ? 'https://' : 'http://')+EXT_IP+':'+PORT+'/'
const PREDICTOR_FILE = process.env.PREDICTOR_FILE
const DB_NAME = process.env.DB_NAME;

const publicDir = path.join(APP_HOME, 'public');
const uploadDir = path.join(publicDir, 'upload');

const { spawn } = require('child_process');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(DB_NAME);
const db = low(adapter);
initdb();

const logger = require('log-timestamp')(function () { return "["+new Date().toLocaleString('en-US', {timeZone:'Asia/Taipei'})+'] %s'});

const app = express();
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(expressFileUpload({
  createParentPath: true
}));

function initdb() {
  db.defaults({}).write()
}

function processfib(res, num) {
  try {
    const process = spawn('sh', [APP_HOME+'sh/fib.sh', num]);
    process.stdout.on('data', (data) => {
      res.send('async fib('+num+'):'+data.toString().split(':')[1]);
      console.log('stdout:'+data);
    })
    process.stderr.on('data', (data) => {
      res.send('error');
      console.log('stderr:'+data);
    })
    process.on('exit', (data) => {
      console.log('exit:'+data);
    })
  } catch (err) {
    console.log(err);
  }
}

app.get('/fib/:num', (req, res) => {
  const n = req.params.num;
  processfib(res, n);
  console.log('req:'+n);
})

app.get('/uploader/', (req, res) => {
  res.render('uploader');
})

app.post('/upload/', (req, res) => {
  if (!req.files||!req.files.filename) {
    return res.status(400).send("No file was uploaded");
  }
  let file = req.files.filename;
  // let filename = req.files.filename.name.replace(/[\/\?<>\\:\*\|":]/g, '').toLowerCase();
  // file.mv('public/upload/'+filename, (err) => {
  const uid = uuid();
  let uploadPath = path.join(uploadDir, uid);
  console.log(uploadPath);
  file.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('upload success');
  })
})


http.createServer(app).listen(PORT);
console.log('Starting ISOBAR Web Server:'+PORT+'\n\n');
