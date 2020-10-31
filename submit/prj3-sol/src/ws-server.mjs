import assert from 'assert';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';

import {AppError} from 'cs544-ss';

/** Storage web service for spreadsheets.  Will report DB errors but
 *  will not make any attempt to report spreadsheet errors like bad
 *  formula syntax or circular references (it is assumed that a higher
 *  layer takes care of checking for this and the inputs to this
 *  service have already been validated).
 */

//some common HTTP status codes; not all codes may be necessary
const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

export default function serve(port, ssStore) {
  const app = express();
  app.locals.port = port;
  app.locals.ssStore = ssStore;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

const CORS_OPTIONS = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders: 'Location',
};

const BASE = 'api';
const STORE = 'store';


function setupRoutes(app) {
  app.use(cors(CORS_OPTIONS));  //needed for future projects
  //@TODO add routes to handlers
  app.use(bodyParser.json());
  //To retrive all spreadsheet data
  app.get('/api/store/:ss_name',async function(req,res){
    const data=await app.locals.ssStore.readFormulas(req.params.ss_name);
    res.send(data);
  });
  //To update Spreadsheet data
  app.patch('/api/store/:ss_name',async function(req,res){
    try{
      const temp=Object.assign([],req.body);
      for(const [i,j] of temp)
      {
        await app.locals.ssStore.updateCell(req.params.ss_name,i,j);
      }
      res.status(NO_CONTENT).end();
    }
    catch(err)
    {
      const message =  "request body must be a list of cellId, formula pairs";
      const result = {
        error: { code: "BAD_REQUEST", message, },
        status: BAD_REQUEST,
      };
      res.status(400).
      json(result);
    }

  });
  //to replace all spreadsheet data
  app.put('/api/store/:ss_name',async function(req,res){
    //console.log(req.body);
    try
    {
      const temp=Object.assign([],req.body);
      await app.locals.ssStore.clear(req.params.ss_name);

      for(const [i,j] of temp)
      {
        await app.locals.ssStore.updateCell(req.params.ss_name,i,j);
      }
      res.status(CREATED).end();
    }
    catch(err)
    {
      const message =  "request body must be a list of cellId, formula pairs";
      const result = {
        error: { code: "BAD_REQUEST", message, },
        status: BAD_REQUEST,
      };
      res.status(400).
      json(result);
    }


  });
//to clear spreadsheet
  app.delete('/api/store/:ss_name',async function(req,res){
    await app.locals.ssStore.clear(req.params.ss_name);
    res.status(NO_CONTENT).end();
  });
//to delete spreadsheet cell
  app.delete('/api/store/:ss_name/:cell_id',async function(req,res){
    await app.locals.ssStore.delete(req.params.ss_name,req.params.cell_id);
    res.status(NO_CONTENT).end();
  });
//to update spreadsheet cell
  app.patch('/api/store/:ss_name/:cell_id',updatecell(app));
//to replace spreadsheet cell
  app.put('/api/store/:ss_name/:cell_id',updatecell(app));
//Handlers
  app.use(do404(app));
  app.use(doErrors(app));
}

/****************************** Handlers *******************************/

//It updates cell

function updatecell(app){
  return (async function(req,res){
    const temp=Object.assign({},req.body);
    if(!('formula' in temp))
    {
      const message =  "request body must be a { formula } object";
      const result = {
        error: { code: "BAD_REQUEST", message, },
        status: BAD_REQUEST,
      };
      res.status(400).
      json(result);
    }
    else {
      await app.locals.ssStore.updateCell(req.params.ss_name,req.params.cell_id,temp.formula);
      if(req.method=='PATCH')
      {
        res.status(NO_CONTENT).end();
      }
      else {
        res.status(CREATED).end();
      }
    }

  });
}

/** Default handler for when there is no route for a particular method
 *  and path.
 */
function do404(app) {
  return async function(req, res) {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    const result = {
      status: NOT_FOUND,
      error: { code: 'NOT_FOUND', message, },
    };
    res.status(404).
    json(result);
  };
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app) {
  return async function(err, req, res, next) {
    const result = {
      status: SERVER_ERROR,
      error: { code: 'SERVER_ERROR', message: err.message },
    };
    res.status(SERVER_ERROR).json(result);
    console.error(err);
  };
}


/*************************** Mapping Errors ****************************/

const ERROR_MAP = {
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code and an error property containing an object with with code and
 *  message properties.
 */
function mapError(err) {
  const isDomainError = (err instanceof AppError);
  const status =
      isDomainError ? (ERROR_MAP[err.code] || BAD_REQUEST) : SERVER_ERROR;
  const error =
      isDomainError
          ? { code: err.code, message: err.message }
          : { code: 'SERVER_ERROR', message: err.toString() };
  if (!isDomainError) console.error(err);
  return { status, error };
}

/****************************** Utilities ******************************/



/** Return original URL for req */
function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}