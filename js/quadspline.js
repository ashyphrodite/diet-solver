import { PointList, Matrix } from './utils.js';

class BoundedQuadratic {
    constructor() {
        this.coeffs = [0, 0, 0];
        this.lower = 0;
        this.upper = 0;
    }
}

class QSSolution {
    constructor(identaugcoeffmat, dataset) {
        if (!(identaugcoeffmat instanceof Matrix) || !(dataset instanceof PointList)) {
            throw new TypeError('Expected identaugcoeffmat to be an instance of Matrix and dataset to be an instance of PointList');
        }

        this.eqs = [];
        this.length = dataset.length - 1;
        const mat = identaugcoeffmat.data;
        const cols = identaugcoeffmat.cols;

        for (let i = 0; i < this.length; i++) {
            const bq = new BoundedQuadratic();
            bq.coeffs[0] = parseFloat(mat[i * 3][cols - 1].toFixed(12));
            bq.coeffs[1] = parseFloat(mat[i * 3 + 1][cols - 1].toFixed(12));
            bq.coeffs[2] = parseFloat(mat[i * 3 + 2][cols - 1].toFixed(12));
            
            bq.lower = dataset.points[i].x;
            bq.upper = dataset.points[i + 1].x;
            
            this.eqs.push(bq);
        }
    }

    // Evaluate the quadratic spline at x
    evaluate(x) {
        for (let i = 0; i < this.length; i++) {
            if (x >= this.eqs[i].lower && x <= this.eqs[i].upper) {
                return parseFloat((this.eqs[i].coeffs[0] + this.eqs[i].coeffs[1] * x + this.eqs[i].coeffs[2] * Math.pow(x, 2)).toFixed(12));
            }
        }
    
        throw new Error(`The value ${x} is not within the boundaries of any equation.`);
    }

    print() {
        for (let i = 0; i < this.length; i++) {
            let str = `[${this.eqs[i].lower}, ${this.eqs[i].upper}]:  `;

            if (this.eqs[i].coeffs[0] !== 0.0) {
                str += this.eqs[i].coeffs[0];
            }

            for (let j = 1; j < 3; j++) {
                if (this.eqs[i].coeffs[j] !== 0.0) {
                    if (this.eqs[i].coeffs[j] < 0) {
                        str += ` - ${Math.abs(this.eqs[i].coeffs[j])}x^${j}`;
                    } else {
                        str += ` + ${this.eqs[i].coeffs[j]}x^${j}`;
                    }
                }
            }

            console.log(str);
        }
    }
}

function QSparse(dataset) {
    if (!(dataset instanceof PointList)) {
        throw new TypeError('Expected dataset to be an instance of PointList');
    }

    let n = dataset.length - 1;
    let rows = n * 3, cols = n * 3 + 1;
    let mat = new Matrix(rows, cols);
    let data = mat.data;

    // a_i  +  b_i * x_i  +  c_i * x_i^2  = y_i
    for (let i = 0; i < n; i++) {
        data[i * 2][i * 3] = 1;                     // a                // 1a
        data[i * 2][i * 3 + 1] = dataset.points[i].x;                   // bx
        data[i * 2][i * 3 + 2] = Math.pow(dataset.points[i].x, 2);      // cx^2
        data[i * 2][cols - 1] = dataset.points[i].y;                    //  y

        data[i * 2 + 1][i * 3] = 1;                                         // 1a
        data[i * 2 + 1][i * 3 + 1] = dataset.points[i + 1].x;               // bx
        data[i * 2 + 1][i * 3 + 2] = Math.pow(dataset.points[i + 1].x, 2);  // cx^2
        data[i * 2 + 1][cols - 1] = dataset.points[i + 1].y;                //  y
    }

    // b_i  +  2*c_i*x   -  b_[i+1]  -  2*c_[i+1]*x
    for (let i = 0; i < n - 1; i++) {
        data[2 * n + i][i * 3 + 1] = 1;
        data[2 * n + i][i * 3 + 2] = 2 * dataset.points[i + 1].x;

        data[2 * n + i][i * 3 + 4] = -1;
        data[2 * n + i][i * 3 + 5] = -2 * dataset.points[i + 1].x;
    }

    data[rows - 1][2] = 2;      // 2c_1 = 0

    return mat;
}

export { BoundedQuadratic, QSSolution, QSparse };