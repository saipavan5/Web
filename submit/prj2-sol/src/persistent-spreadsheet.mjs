import AppError from './app-error.mjs';
import MemSpreadsheet from './mem-spreadsheet.mjs';

//use for development only
import { inspect } from 'util';

import mongo from 'mongodb';

//use in mongo.connect() to avoid warning
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };



/**
 * User errors must be reported by throwing a suitable
 * AppError object having a suitable message property
 * and code property set as follows:
 *
 *  `SYNTAX`: for a syntax error.
 *  `CIRCULAR_REF` for a circular reference.
 *  `DB`: database error.
 */

export default class PersistentSpreadsheet extends MemSpreadsheet{

  //factory method
  static async make(dbUrl, spreadsheetName) {
    try {
      var client = await mongo.connect(dbUrl,MONGO_CONNECT_OPTIONS);
      var db2= client.db();
     var id=db2.collection(spreadsheetName);
      //@TODO set up database info, including reading data
    }
    catch (err) {
      const msg = `cannot connect to URL "${dbUrl}": ${err}`;
      throw new AppError('DB', msg);
    }
    return new PersistentSpreadsheet({client,id});
  }

  constructor(props) {
    super();
    Object.assign(this, props);
    //@TODO
  }

  /** Release all resources held by persistent spreadsheet.
   *  Specifically, close any database connections.
   */
  async close() {

    try {
     await this.client.close();
    }
    catch (err) {
      throw new AppError('DB', err.toString());
    }
    //@TODO
  }

  /** Set cell with id baseCellId to result of evaluating string
   *  formula.  Update all cells which are directly or indirectly
   *  dependent on the base cell.  Return an object mapping the id's
   *  of all dependent cells to their updated values.
   */
  async eval(baseCellId, formula) {
    const results = super.eval(baseCellId,formula);/* @TODO delegate to in-memory spreadsheet */
    try {
      //@TODO
        let ins=Object.assign({},results);
        await this.id.insertOne(ins);

    }
    catch (err) {
      //@TODO undo mem-spreadsheet operation
      const msg = `cannot update "${baseCellId}: ${err}`;
      throw new AppError('DB', msg);
    }
    return results;
  }

  /** return object containing formula and value for cell cellId
   *  return { value: 0, formula: '' } for an empty cell.
   */
  async query(cellId) {
    return super.query(cellId);/* @TODO delegate to in-memory spreadsheet */ {};
  }

  /** Clear contents of this spreadsheet */
  async clear() {
    try {
      //@TODO
      await this.id.deleteMany({});
    }
    catch (err) {
      const msg = `cannot drop collection ${this.spreadsheetName}: ${err}`;
      throw new AppError('DB', msg);
    }
    /* @TODO delegate to in-memory spreadsheet */
    super.clear();
  }


  /** Delete all info for cellId from this spreadsheet. Return an
   *  object mapping the id's of all dependent cells to their updated
   *  values.
   */
  async delete(cellId) {
    let results;
    results = super.delete(cellId);/* @TODO delegate to in-memory spreadsheet */
    try {
      //@TODO
    }
    catch (err) {
      //@TODO undo mem-spreadsheet operation
      const msg = `cannot delete ${cellId}: ${err}`;
      throw new AppError('DB', msg);
    }
    return results;
  }

  /** copy formula from srcCellId to destCellId, adjusting any
   *  relative cell references suitably.  Return an object mapping the
   *  id's of all dependent cells to their updated values. Copying
   *  an empty cell is equivalent to deleting the destination cell.
   */
   async copy(destCellId, srcCellId) {
     const srcFormula =  super.query(srcCellId)['formula'];//super.query(srcCellId)/* @TODO get formula by querying mem-spreadsheet */ ;
     if (!srcFormula) {
       return super.copy(destCellId, srcCellId);
    }
     else {
       const results = {};
       Object.assign(results,super.copy(destCellId, srcCellId));/* @TODO delegate to in-memory spreadsheet */
       try {
 	//@TODO
          let ins=Object.assign({},results);

         for(let temp in ins){
            await this.id.insertOne({temp:ins[temp]});
          }

       }
       catch (err) {
 	//@TODO undo mem-spreadsheet operation
 	const msg = `cannot update "${destCellId}: ${err}`;
 	throw new AppError('DB', msg);
       }
       return results;
     }
   }


  /** Return dump of cell values as list of cellId and formula pairs.
   *  Do not include any cell's with empty formula.
   *
   *  Returned list must be sorted by cellId with primary order being
   *  topological (cell A < cell B when B depends on A) and secondary
   *  order being lexicographical (when cells have no dependency
   *  relation).
   *
   *  Specifically, the cells must be dumped in a non-decreasing depth
   *  order:
   *
   *    + The depth of a cell with no dependencies is 0.
   *
   *    + The depth of a cell C with direct prerequisite cells
   *      C1, ..., Cn is max(depth(C1), .... depth(Cn)) + 1.
   *
   *  Cells having the same depth must be sorted in lexicographic order
   *  by their IDs.
   *
   *  Note that empty cells must be ignored during the topological
   *  sort.
   */
  async dump() {
    return  super.dump();/* @TODO delegate to in-memory spreadsheet */ ;
  }

}

//@TODO auxiliary functions
