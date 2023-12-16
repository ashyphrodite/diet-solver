import { PointList, Polynomial, Matrix } from './utils.js';

function vandermondeMatrix(degree, dataset) {
    // throw error of degree is greater than the number of points - 1
    if (degree > dataset.length - 1) {
        throw new Error("Degree cannot be greater than the number of points - 1.");
    }

    let mat = new Matrix(degree + 1, degree + 2);

    let length = dataset.length;
    let sum;

    // Solve values for the left-hand side
    for (let row = 0; row < degree + 1; row++) {
        for (let col = 0; col < degree + 1; col++) {
            // Summation loop
            sum = 0;
            for (let i = 0; i < length; i++) {
                // add to sum: x[i]^(n + m)
                sum += Math.pow(dataset.points[i].x, row + col);
            }

            // set the value of [row][col]-th entry to the sum
            mat.data[row][col] = sum;
        }
    }

    // solve for the values for the right-hand side
    for (let row = 0; row < degree + 1; row++) {
        // summation loop
        sum = 0;
        for (let i = 0; i < length; i++) {
            // add to sum: y[i] * x[i]^m
            sum += dataset.points[i].y * Math.pow(dataset.points[i].x, row);
        }

        mat.data[row][degree + 1] = sum;
    }

    return mat;
}

function getSolution(augcoeffidentmax) {
    let n = augcoeffidentmax.rows;
    let solution = new Polynomial(n-1);

    for (let i = 0; i < n; i++) {
        solution.coeffs[i] = augcoeffidentmax.data[i][n];
    }

    return solution;
}

function estimate(solution, x) {
    let result = 0;
    for (let i = 0; i <= solution.degree; i++) {
        result += solution.coeffs[i] * Math.pow(x, i);
    }

    return result;
}

export { vandermondeMatrix, getSolution, estimate };