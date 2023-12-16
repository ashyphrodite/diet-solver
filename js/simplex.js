import { Matrix } from "./utils.js";

class Objective {
    constructor(coefficients) {
        if (!Array.isArray(coefficients)) {
            throw new TypeError('Expected coefficients to be an array');
        }

        this.coeffs = coefficients;
        this.length = coefficients.length;
    }
}

class Constraint {
    constructor(coefficients, mode, rhs) {
        if (!Array.isArray(coefficients)) {
            throw new TypeError('Expected coefficients to be an array');
        }

        this.coeffs = coefficients;
        this.rhs = rhs;
        this.mode = mode;           // <0 for <=, 0 for =, >0 for >=
        this.length = coefficients.length;
    }
}

class Simplex {
    constructor(mode, objective, constraints) {
        if (!(objective instanceof Objective)) {
            throw new TypeError('Expected objective to be an instance of Objective');
        }

        if (!Array.isArray(constraints) || !constraints.every(c => c instanceof Constraint)) {
            throw new TypeError('Expected constraints to be an array of Constraint instances');
        }

        this.mode = mode;
        this.objective = objective;
        this.constraints = constraints;
        this.length = constraints.length;
    }

    tabulize() {
        const objective = this.objective;
        const constraints = this.constraints;
        const num_constraints = this.length;
    
        let num_slack_variables = 0;
        for (let i = 0; i < this.length; i++) {
            if (constraints[i].mode !== 0) {
                num_slack_variables += 1;
            }
        }
    
        const num_rows = num_constraints + 1;
        const num_cols = objective.length + num_slack_variables + 2;
    
        let table = new Matrix(num_rows, num_cols);
    
        for (let i = 0; i < num_constraints; i++) {
            const constraint = constraints[i];
    
            for (let j = 0; j < objective.length; j++) {
                table.data[i][j] = constraint.coeffs[j];
            }
    
            table.data[i][num_cols - 1] = constraint.rhs;
    
            if (constraint.mode > 0) {
                table.scalarMultiplyRow(i, -1);
            }
    
            if (constraint.mode !== 0) {
                table.data[i][i + objective.length] = 1;
            }
        }
    
        for (let j = 0; j < objective.length; j++) {
            table.data[num_rows - 1][j] = objective.coeffs[j];
        }
    
        if (this.mode > 0) {
            table.scalarMultiplyRow(num_rows - 1, -1);
        }
    
        table.data[num_rows - 1][num_cols - 2] = 1.0;
    
        return table;
    }

    solve() {
        let table = this.tabulize();

        console.log(JSON.parse(JSON.stringify(table.data)));
    
        let num_constraints = this.length;
        let num_rows = table.rows;
        let num_cols = table.cols;
        let mat = table.data;
    
        // Phase 1: Handle negative RHS values        
        while (true) {

            // find negative rhs
            let pivot_row = -1;
            for (let i = 0; i < num_constraints; i++) {
                if (mat[i][num_cols - 1] < 0.0) {
                    pivot_row = i;
                    break;
                }
            }
    
            // exit if no negative rhs
            if (pivot_row === -1) {
                break;
            }

            // find the column of a negative entry in the pivot row
            let pivot_col = -1;
            for (let i = 0; i < num_cols - 1; i++) {
                if (mat[pivot_row][i] < 0.0) {
                    pivot_col = i;
                    break;
                }
            }
    
            // exit if no negative entries in pivot row
            if (pivot_col === -1) {
                console.log("Problem infeasible!");
                return;
            }
    
            // pivot about the negative entry
            table.pivot(pivot_row, pivot_col);
        }
    
        // Phase 2: Solve the actual problem
        while (true) {
            // find the pivot column - the most negative entry in the bottom row
            let pivot_col = -1;
            let highest_neg = 0.0;
            for (let i = 0; i < num_cols - 1; i++) {
                if (mat[num_rows - 1][i] < highest_neg) {   // check for negative objective coefficient
                    highest_neg = mat[num_rows - 1][i];
                    pivot_col = i;
                }
            }
    
            // If all objective coefficients are non-negative, the optimal solution has been found
            if (highest_neg >= 0.0) {
                break;
            }
    
            // find the pivot row: the lowest test ratio (RHS / entry in pivot column)
            let pivot_row = -1;
            let lowest_ratio = Infinity;
            for (let i = 0; i < num_constraints; i++) {
                if (mat[i][pivot_col] <= 0.0) {
                    continue;
                }
                let ratio = mat[i][num_cols - 1] / mat[i][pivot_col];
                if (ratio < lowest_ratio) {
                    lowest_ratio = ratio;
                    pivot_row = i;
                }
            }
    
            // if no valid pivot row was found, the problem is infeasible
            if (pivot_row === -1) {
                console.log("Problem infeasible!");
                return 0;
            }
    
            // pivot about that entry
            table.pivot(pivot_row, pivot_col);
            
            // console.log(table.data);
            let curr = JSON.parse(JSON.stringify(table.data));
            console.log(curr);
            console.logt('Z = ' + curr[curr.length-1][curr[0].length-1])
        }
    }

    print() {
        if (this.mode > 0) {
            console.log("Maximize:");
        } else {
            console.log("Minimize:");
        }
    
        // Print objective function
        let objectiveStr = "\tZ = ";
        for (let i = 0; i < this.objective.length; i++) {
            if (Math.abs(this.objective.coeffs[i]) > Number.EPSILON) { // Compare using absolute value and epsilon
                if (i > 0 && this.objective.coeffs[i] > 0.0) {
                    objectiveStr += "+ "; // Add "+" for positive terms after the first
                }
                objectiveStr += `${this.objective.coeffs[i].toFixed(2)}*x${i + 1} `;
            }
        }
        console.log(objectiveStr);
    
        // Print constraints
        console.log("Subject to:");
        for (let i = 0; i < this.length; i++) {
            const constraint = this.constraints[i]; // Get current constraint

            let constraintStr = "\t";
            for (let j = 0; j < constraint.length; j++) {
                if (Math.abs(constraint.coeffs[j]) > Number.EPSILON) {
                    if (j > 0 && constraint.coeffs[j] > 0.0 && Math.abs(constraint.coeffs[j - 1]) > Number.EPSILON) {
                        constraintStr += " + "; // Add "+" for positive terms after the first
                    }
                    constraintStr += `${constraint.coeffs[j].toFixed(2)}*x${j + 1} `;
                }
            }
        
            if (constraint.mode > 0) {
                constraintStr += " >= ";
            } else if (constraint.mode < 0) {
                constraintStr += " <= ";
            } else {
                constraintStr += " = ";
            }
        
            constraintStr += constraint.rhs.toFixed(2); // Print RHS
            console.log(constraintStr);
        }
    }

    printSolution(table) {
        // Extract relevant information
        let rows = table.rows;
        let cols = table.cols;
        let num_vars = this.objective.length;
        let num_slack_vars = table.cols - num_vars - 2;
        let mat = table.data;
    
        // Print solution for original variables
        for (let i = 0; i < num_vars; i++) {
            let solution_row = -1;
            // checks if there is 1 one and the rest are zeroes
            for (let j = 0; j < rows; j++) {
                if (mat[j][i] !== 0.0 && mat[j][i] !== 1.0) {
                    solution_row = -1;
                    break;
                }
                
                if (solution_row === -1 && mat[j][i] === 1.0) {
                    solution_row = j;
                }
            }
        
            if (solution_row !== -1) {
                console.log(`x${i + 1} = ${mat[solution_row][cols-1]}`);
            } else {
                console.log(`x${i + 1} = 0`);
            }
        }
    
        // Print solution for slack variables
        for (let i = 0; i < num_slack_vars; i++) {
            let solution_row = -1;
            // checks if there is 1 one and the rest are zeroes
            for (let j = 0; j < rows; j++) {
                if (mat[j][num_vars + i] !== 0.0 && mat[j][num_vars + i] !== 1.0) {
                    solution_row = -1;
                    break;
                }
    
                if (solution_row === -1 && mat[j][num_vars + i] === 1.0) {
                    solution_row = j;
                }
            }
    
            if (solution_row !== -1) {
                console.log(`S${i + 1} = ${mat[solution_row][cols-1]}`);
            } else {
                console.log(`S${i + 1} = 0`);
            }
        }
    
        // Print Z
        if (this.mode > 0) {
            console.log(`Z = ${mat[rows-1][cols-1]}`);
        } else {
            console.log(`Z = ${(-mat[rows-1][cols-1])}`);
        }
    }
}

// dual method of the simplex. for minimization only
class SimplexV2 {
    constructor(mode, objective, constraints) {
        if (!(objective instanceof Objective)) {
            throw new TypeError('Expected objective to be an instance of Objective');
        }

        if (!Array.isArray(constraints) || !constraints.every(c => c instanceof Constraint)) {
            throw new TypeError('Expected constraints to be an array of Constraint instances');
        }

        this.mode = mode;
        this.objective = objective;
        this.constraints = constraints;
        this.length = constraints.length;
    }

    tabulize() {
        // extract relevant information
        let objective = this.objective;
        let constraints = this.constraints;
        let num_constraints = this.length;
        let num_variables = this.objective.length;

        let matrix = new Matrix(num_constraints + 1, num_variables + 1);

        // create initial table to be transposed
        for (let i = 0; i < num_constraints; i++) {
            for (let j = 0; j < num_variables; j++) {
                matrix.data[i][j] = constraints[i].coeffs[j];
            }

            matrix.data[i][num_variables] = constraints[i].rhs;

            // multiply by negative 1 if the constraint is <=
            if (constraints[i].mode < 0)
                matrix.scalarMultiplyRow(i, -1);
        }

        // fill in the last row of the matrix
        for (let i = 0; i < num_variables; i++) {
            matrix.data[num_constraints][i] = objective.coeffs[i];
        }
        
        // transpose the matrix
        matrix = matrix.transpose();

        // make new matrix for the initial tablaeu
        let tableau = new Matrix(matrix.rows, matrix.cols + matrix.rows);

        // copy data then add the slack variables
        for (let i = 0; i < matrix.rows; i++) {
            for (let j = 0; j < matrix.cols-1; j++) {
                tableau.data[i][j] = matrix.data[i][j];
            }

            // add the slack variables
            tableau.data[i][matrix.cols-1+i] = 1;

            // add the rhs at the last column
            tableau.data[i][tableau.cols - 1] = matrix.data[i][matrix.cols-1];

        }

        // multiply last row by -1
        tableau.scalarMultiplyRow(tableau.rows-1, -1);
        tableau.data[tableau.rows-1][tableau.cols-2] = 1;

        return tableau;
    }

    solve() {
        let table = this.tabulize();

        console.log(JSON.parse(JSON.stringify(table.data)));
    
        let num_constraints = table.rows - 1;
        let num_rows = table.rows;
        let num_cols = table.cols;
        let mat = table.data;
    
        // Phase 2: Solve the actual problem
        while (true) {

            // find the pivot column - the most negative entry in the bottom row
            let pivot_col = -1;
            let highest_neg = 0.0;
            for (let i = 0; i < num_cols - 1; i++) {
                if (mat[num_rows - 1][i] < highest_neg) {   // check for negative objective coefficient
                    highest_neg = mat[num_rows - 1][i];
                    pivot_col = i;
                }
            }
    
            // If all objective coefficients are non-negative, the optimal solution has been found
            if (highest_neg >= 0.0) {
                break;
            }
    
            // find the pivot row: the lowest test ratio (RHS / entry in pivot column)
            let pivot_row = -1;
            let lowest_ratio = Infinity;
            for (let i = 0; i < num_constraints; i++) {
                if (mat[i][pivot_col] <= 0.0) {
                    continue;
                }
                let ratio = mat[i][num_cols - 1] / mat[i][pivot_col];
                if (ratio < lowest_ratio) {
                    lowest_ratio = ratio;
                    pivot_row = i;
                }
            }
    
            // if no valid pivot row was found, the problem is infeasible
            if (pivot_row === -1) {
                console.log("Problem infeasible!");
                return -1;
            }
    
            // pivot about that entry
            table.pivot(pivot_row, pivot_col);
            
            // console.log(table.data);
            let curr = JSON.parse(JSON.stringify(table.data));
            console.log(curr);
            console.log('Z = ' + curr[curr.length-1][curr[0].length-1]);        // print last element
        }
    }
}

export { Objective, Constraint, Simplex, SimplexV2 }