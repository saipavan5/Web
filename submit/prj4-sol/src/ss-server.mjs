import Path from 'path';

import express from 'express';
import bodyParser from 'body-parser';

import querystring from 'querystring';

import {AppError, Spreadsheet} from 'cs544-ss';

import Mustache from './mustache.mjs';

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

//some common HTTP status codes; not all codes may be necessary
const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

const __dirname = Path.dirname(new URL(import.meta.url).pathname);

export default function serve(port, store) {
  process.chdir(__dirname);
  const app = express();
  app.locals.port = port;
  app.locals.store = store;
  app.locals.mustache = new Mustache();
  app.use('/', express.static(STATIC_DIR));
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}


/*********************** Routes and Handlers ***************************/

function setupRoutes(app) {
  app.use(bodyParser.urlencoded({extended: true}));

  //@TODO add routes
  //must be last
  app.get('/',async function(req,res){
    //const temp=await app.locals.store.readFormulas('ss');
  //  res.send(temp);
  res.send(app.locals.mustache.render('openspreadsheet',{open:[{heading:'CS444/544 Spreadsheet selection',name:'Open spreadheet name'}]}));
  })
  app.get('/form',tableview(app));
  app.post('/ss/hi',updateview(app));
  app.use(do404(app));
  app.use(doErrors(app));

}

//@TODO add handlers

/** Default handler for when there is no route for a particular method
 *  and path.
 */

 function updateview(app){
   return async function(req,res){
     let errors={};
     try{
       app.locals.spread=await Spreadsheet.make(app.locals.ss,app.locals.store)
       //console.log(await app.locals.spread.dump());

       if(!validateUpdate(req.body,errors))
       {
         const temp=await view(app);
         for(let i in errors)
         {
           temp[i]=errors[i];
         }
         res.send(app.locals.mustache.render('update',temp));
       }
       if(req.body.ssAct==='clear')
       {
         await app.locals.spread.clear();
         const temp=await view(app);
          res.send(app.locals.mustache.render('update',temp));
       }
       else if(req.body.ssAct==='deleteCell')
       {
         await app.locals.spread.delete(req.body.cellId);
         const temp=await view(app);
          res.send(app.locals.mustache.render('update',temp));
       }
       else if(req.body.ssAct==='updateCell')
       {
         await app.locals.spread.eval(req.body.cellId,req.body.formula);
         const temp=await view(app);
          res.send(app.locals.mustache.render('update',temp));
       }
       else if(req.body.ssAct==='copyCell')
       {
         await app.locals.spread.copy(req.body.cellId,req.body.formula);
         const temp=await view(app);
          res.send(app.locals.mustache.render('update',temp));
       }
     }
     catch(err)
     {
       console.log(err);
        if(err instanceof AppError )
        {

          const temp=await view(app);
            temp['formula']=err.toString();
          res.send(app.locals.mustache.render('update',temp));
        }
     }

   }
 }

function tableview(app){
  return async function(req,res){
    let errors={};
    if( !(validateField('ssName',{ssName:req.query.ssName},errors)))
    {
      res.send(app.locals.mustache.render('openspreadsheet',{open:[{heading:'CS444/544 Spreadsheet selection',name:'Open spreadheet name',error:errors['ssName'],val:req.query.ssName}]}));
    }
    else {

        try{
          //const temp=await app.locals.store.dump();
          app.locals.ss=req.query.ssName;
          app.locals.spread=await Spreadsheet.make(req.query.ssName,app.locals.store)
          //console.log(await app.locals.spread.dump());
          const temp=await view(app);
          res.send(app.locals.mustache.render('update',temp));

        }
        catch(err)
        {
          console.log(err);
        }


    }
  }
}

function do404(app) {
  return async function(req, res) {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    res.status(NOT_FOUND).
      send(app.locals.mustache.render('errors',
				      { errors: [{ msg: message, }] }));
  };
}

/** Ensures a server error results in an error page sent back to
 *  client with details logged on console.
 */
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.send(app.locals.mustache.render('errors',
					{ errors: [ {msg: err.message, }] }));
    console.error(err);
  };
}

/************************* SS View Generation **************************/

async function spread_dump(app){
  try{
    const temp=await app.locals.spread.dump();
    if(temp.length>0)
    {
      let a={};
      for (const [i,j] of temp)
      {
        let val=app.locals.spread.query(i);
        a[i]=val['value'];
      }
      return a;
    }
    else {
      return {};
    }
  }
  catch(err)
  {
    console.log(err);
  }
}

const MIN_ROWS = 11;
const MIN_COLS = 26;
const column=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
async function view(app){
  let table={};
  let fin=[];
  for(let i=0;i<MIN_ROWS;i++)
  {
    let columns=[];
    if(i==0)
    {
      let temp={};
      temp['col']=`<th>hii</th>`;
      columns.push(temp);
    }
    else {
      let temp={};
      temp['col']=`<th>${i}</th>`;
      columns.push(temp);
    }
    for(let j=0;j<MIN_COLS;j++)
    {

        if(i==0)
        {
          let temp={};
          temp['col']=`<th>${column[j]}</th>`;
        columns.push(temp);
        }
        else {
          let temp={};
          temp['col']=`<td>${await check(app,column[j]+i)}</td>`;
          columns.push(temp);
        }

    }

    let temp2={};
    temp2['row']=[...columns];
	 fin.push(temp2);
  }
  table['tab']=fin;
  return table
};

async function check(app,cell){
  try{
    //console.log(cell);
    const temp=await spread_dump(app);
    const l=cell.toLowerCase();
    if(l in temp)
    {
      return temp[l];
    }
    else {
      return '';
    }
  }
  catch(err)
  {
    console.log(err);
  }
};

//@TODO add functions to build a spreadsheet view suitable for mustache

/**************************** Validation ********************************/


const ACTS = new Set(['clear', 'deleteCell', 'updateCell', 'copyCell']);
const ACTS_ERROR = `Action must be one of ${Array.from(ACTS).join(', ')}.`;

//mapping from widget names to info.
const FIELD_INFOS = {
  ssAct: {
    friendlyName: 'Action',
    err: val => !ACTS.has(val) && ACTS_ERROR,
  },
  ssName: {
    friendlyName: 'Spreadsheet Name',
    err: val => !/^[\w\- ]+$/.test(val) && `
      Bad spreadsheet name "${val}": must contain only alphanumeric
      characters, underscore, hyphen or space.
    `,
  },
  cellId: {
    friendlyName: 'Cell ID',
    err: val => !/^[a-z]\d\d?$/i.test(val) && `
      Bad cell id "${val}": must consist of a letter followed by one
      or two digits.
    `,
  },
  formula: {
    friendlyName: 'cell formula',
  },
};

/** return true iff params[name] is valid; if not, add suitable error
 *  message as errors[name].
 */
function validateField(name, params, errors) {
  const info = FIELD_INFOS[name];
  const value = params[name];
  if (isEmpty(value)) {
    errors[name] = `The ${info.friendlyName} field must be specified`;
    return false;
  }
  if (info.err) {
    const err = info.err(value);
    if (err) {
      errors[name] = err;
      return false;
    }
  }
  return true;
}


/** validate widgets in update object, returning true iff all valid.
 *  Add suitable error messages to errors object.
 */
function validateUpdate(update, errors) {
  const act = update.ssAct ?? '';
  switch (act) {
    case '':
      errors.ssAct = 'Action must be specified.';
      return false;
    case 'clear':
      return validateFields('Clear', [], ['cellId', 'formula'], update, errors);
    case 'deleteCell':
      return validateFields('Delete Cell', ['cellId'], ['formula'],
			    update, errors);
    case 'copyCell': {
      const isOk = validateFields('Copy Cell', ['cellId','formula'], [],
				  update, errors);
      if (!isOk) {
	return false;
      }
      else if (!FIELD_INFOS.cellId.err(update.formula)) {
	  return true;
      }
      else {
	errors.formula = `Copy requires formula to specify a cell ID`;
	return false;
      }
    }
    case 'updateCell':
      return validateFields('Update Cell', ['cellId','formula'], [],
			    update, errors);
    default:
      errors.ssAct = `Invalid action "${act}`;
      return false;
  }
}

function validateFields(act, required, forbidden, params, errors) {
  for (const name of forbidden) {
    if (params[name]) {
      errors[name] = `
	${FIELD_INFOS[name].friendlyName} must not be specified
        for ${act} action
      `;
    }
  }
  for (const name of required) validateField(name, params, errors);
  return Object.keys(errors).length === 0;
}


/************************ General Utilities ****************************/

/** return new object just like paramsObj except that all values are
 *  trim()'d.
 */
function trimValues(paramsObj) {
  const trimmedPairs = Object.entries(paramsObj).
    map(([k, v]) => [k, v.toString().trim()]);
  return Object.fromEntries(trimmedPairs);
}

function isEmpty(v) {
  return (v === undefined) || v === null ||
    (typeof v === 'string' && v.trim().length === 0);
}

/** Return original URL for req.  If index specified, then set it as
 *  _index query param
 */
function requestUrl(req, index) {
  const port = req.app.locals.port;
  let url = `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
  if (index !== undefined) {
    if (url.match(/_index=\d+/)) {
      url = url.replace(/_index=\d+/, `_index=${index}`);
    }
    else {
      url += url.indexOf('?') < 0 ? '?' : '&';
      url += `_index=${index}`;
    }
  }
  return url;
}
