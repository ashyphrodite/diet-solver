const EPSILON = 1e-14;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class PointList {
    // new PointList([x1, y1, x2, y2, ...])
    // or new PointList([new Point(x1, y1), new Point(x2, y2), ...])
    // or combined: new PointList([new Point(x1, y1), x2, y2, ...])
    constructor(points) {
        if (!Array.isArray(points)) {
            throw new TypeError('Expected points to be an array');
        }
    
        this.points = [];
        
        // parse arguments
        for (let i = 0; i < points.length; i++) {
            // check if point is a Point or a pair of numbers
            if (points[i] instanceof Point) {
                this.points.push(points[i]);
            }
            
            else if (typeof points[i] === 'number') {
                // check if the next argument is a number
                if (typeof points[i + 1] !== 'number') {
                    // if not, throw an error
                    throw new Error("Invalid argument. Expected a pair of numbers.");
                }
                // if it is, create a new Point and push to the list
                this.points.push(new Point(points[i], points[i + 1]));
                i++; // skip the next number because it's already used
            }
            
            // throw an error if the argument is not a Point or a pair of numbers
            else {
                throw new Error("Invalid argument. Expected a Point or a pair of numbers.");
            }
        }
    
        this.length = this.points.length;
    }

    sortPoints() {
        this.points.sort((a, b) => a.x - b.x);
    }
}

class Polynomial {
    constructor(degree) {    
        this.coeffs = [];
        this.degree = degree;
    }
}

class Matrix {
	constructor(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this.data = Array.from({ length: rows }, () => Array(cols).fill(0));
	}

	transpose() {
		let result = new Matrix(this.cols, this.rows);
		for(let i = 0; i < this.rows; i++) {
			for(let j = 0; j < this.cols; j++) {
				result.data[j][i] = this.data[i][j];
			}
		}
		return result;
	}

	rowSwap(row_i, row_j) {
		[this.data[row_i], this.data[row_j]] = [this.data[row_j], this.data[row_i]];
	}

	scalarMultiplyRow(row, scalar) {
		for (let i = 0; i < this.data[row].length; i++) {
			this.data[row][i] *= scalar;

			// makes sure the value is properly rounded
			let num = round(this.data[row][i], 5);
			if (round(this.data[row][i], 10) == num) {
				this.data[row][i] = num;
			}
		}
	}

	rowSum(row_i, scalar, row_j) {
		for (let i = 0; i < this.data[row_i].length; i++) {
			this.data[row_i][i] += this.data[row_j][i] * scalar;

			// makes sure the value is properly rounded
			let num = round(this.data[row_i][i], 5);
            if (round(this.data[row_i][i], 10) == num) {
                this.data[row_i][i] = num;
            }
   		 }
	}

	columnSwap(col_i, col_j) {
		for(let i = 0; i < this.rows; i++) {
			[this.data[i][col_i], this.data[i][col_j]] = [this.data[i][col_j], this.data[i][col_i]];
		}
	}

	scalarMultiplyColumn(col, scalar) {
		for(let i = 0; i < this.rows; i++) {
			this.data[i][col] *= scalar;
		}
	}

	columnSum(col_i, scalar, col_j) {
		for(let i = 0; i < this.rows; i++) {
			this.data[i][col_i] += this.data[i][col_j] * scalar;
		}
	}

	pivot(row, col) {
		if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
			return;
		}

		// Check if the pivot element is effectively zero
		if (Math.abs(this.data[row][col]) < Number.EPSILON) {
			console.log("Invalid pivot!");
			return;
		}

		let pivot = this.data[row][col];

		// Normalize the pivot row
		this.scalarMultiplyRow(row, 1.0 / pivot);

		// Perform rowSum to make the pivot column 0 in other rows
		for (let i = 0; i < this.rows; i++) {
			if (i === row) {
				continue;
			}

			this.rowSum(i, -this.data[i][col], row);
		}
	}

	gaussJordanMethod() {
		let no_of_vars = this.rows;

		for (let i = 0; i < no_of_vars; i++) {
			// Pivoting ----
			let row_of_max = 0;
			let max = 0;

			// find the max
			for (let row = i; row < no_of_vars; row++) {
				// get the max
				if (Math.abs(this.data[row][i]) > max) {
					row_of_max = row;
					max = Math.abs(this.data[row][i]);
				}
			}

			// if max is 0, there's no valid pivot
			if (max === 0) {
				console.log("No valid pivot found!");
				return;
			}

			// swap rows
			this.rowSwap(row_of_max, i);
			// end of pivoting ----

			this.pivot(i, i);
		}
	}

	print() {
		console.log(this.data);
	}
}

class ServingSize {
    constructor(amount, unit) {
        this.amount = amount;
        this.unit = unit;
    }
}

class Food {
    static nutrientUnits = {
        cholesterol: 'mg',
        totalFat: 'g',
        sodium: 'mg',
        carbohydrates: 'g',
        dietaryFiber: 'g',
        protein: 'g',
        vitA: 'IU',
        vitC: 'IU',
        calcium: 'mg',
        iron: 'mg'
    };

    constructor(options) {
        this.foodName = options.foodName;
        this.price = options.price;
        this.servingSize = new ServingSize(options.servingSize.amount, options.servingSize.unit);
        this.calories = options.calories;
        this.cholesterol = options.cholesterol;
        this.totalFat = options.totalFat;
        this.sodium = options.sodium;
        this.carbohydrates = options.carbohydrates;
        this.dietaryFiber = options.dietaryFiber;
        this.protein = options.protein;
        this.vitA = options.vitA;
        this.vitC = options.vitC;
        this.calcium = options.calcium;
        this.iron = options.iron;
    }

    getNutrientUnit(nutrient) {
        if (!(nutrient in Food.nutrientUnits)) {
            throw new Error(`Nutrient ${nutrient} not found`);
        }

        return Food.nutrientUnits[nutrient];
    }
}

function round(num, precision) {
    let factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
}

export { Point, PointList, Polynomial, Matrix, Food, round };