import parseerror from './expr-parser.mjs';
import AppError from './app-error.mjs';
import { cellRefToCellId } from './util.mjs';

//use for development only
import { inspect } from 'util';

class CellInfo{
    constructor()
    {
        this.expr={};
        this.value=0;
        this.dependents=new Set();
    }

    addexpr(expression)
    {
        this.expr=expr;
    }
    addvalue(val)
    {
        this.value=val;
    }
    adddependent(dep)
    {
        this.dependents.add(dep);
    }

}


export default class Spreadsheet {


    //factory method
    static async make() { return new Spreadsheet(); }

    constructor() {
        //@TODO
        this.cells={};
    }

    /** Set cell with id baseCellId to result of evaluating formula
     *  specified by the string expr.  Update all cells which are
     *  directly or indirectly dependent on the base cell.  Return an
     *  object mapping the id's of all dependent cells to their updated
     *  values.  User errors must be reported by throwing a suitable
     *  AppError object having code property set to `SYNTAX` for a
     *  syntax error and `CIRCULAR_REF` for a circular reference
     *  and message property set to a suitable error message.
     */
    astparse(baseCellId,expr)
    {
        if(expr['type']=='num')
        {
            return expr['value'];
        }
        if(expr['type']=='ref')
        {
            let lookup=expr.toString(baseCellId);
            if(baseCellId==lookup)
            {
                const msg = `circular ref involving ${baseCellId}`;
                throw new AppError('CIRCULAR_REF', msg);
            }
            if((lookup in this.cells) && this.cells[lookup].dependents.has(baseCellId))
            {
                const msg = `circular ref involving ${baseCellId}`;
                throw new AppError('CIRCULAR_REF', msg);
            }
            this.cells[baseCellId].adddependent(lookup);
            if(lookup in this.cells)
            {
                return this.cells[lookup].value;
            }
            else {
                {
                    this.cells[lookup]=new CellInfo();
                    return 0;
                }
            }
        }
        if(expr['type']=='app')
        {
            if(expr['kids'].length==2)
            {
                let a=this.astparse(baseCellId,expr['kids'][0]);
                let b=this.astparse(baseCellId,expr['kids'][1]);
                return FNS[expr['fn']](a,b);
            }
            else {
                let a=this.astparse(baseCellId,expr['kids'][0]);
                return FNS[expr['fn']](a);
            }

        }

    }

    async eval(baseCellId, expr) {
        let updates = {};

        const ast=parseerror(expr,baseCellId);
        if(!(baseCellId in this.cells))
        {
            this.cells[baseCellId]=new CellInfo();
        }

        const result=this.astparse(baseCellId,ast);
        this.cells[baseCellId].addvalue(result);
        this.cells[baseCellId].expr=expr;
        updates[baseCellId]=result;

        for(let i in this.cells)
        {
            if( this.cells[i].dependents.has(baseCellId))
            {
                const ast2=parseerror(this.cells[i].expr,i);
                const result2=this.astparse(i,ast2);
                this.cells[i].addvalue(result2);
                updates[i]=result2;
            }
        }


        //@TODO
        return updates;
    }



    //@TODO add methods
}

//Map fn property of Ast type === 'app' to corresponding function.
const FNS = {
    '+': (a, b) => a + b,
    '-': (a, b=null) => b === null ? -a : a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    min: (...args) => Math.min(...args),
    max: (...args) => Math.max(...args),
}


//@TODO add other classes, functions, constants etc as needed
