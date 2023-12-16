import { Point, PointList, Polynomial, Matrix, Food } from './js/utils.js';
import { QSSolution, QSparse } from './js/quadspline.js';
import * as polyreg from './js/polyreg.js';
import { Objective, Constraint, Simplex, SimplexV2 } from './js/simplex.js';
import * as dietsolver from './js/dietsolver.js';


window.switchTabs = function (id) {
    let children = document.querySelectorAll('.body-container > div');

    for (let i = 0; i < children.length; i++) {
        children[i].style.display = 'none';
    }

    document.getElementById(id).style.display = 'block';

    // change the page title
    switch(id) {
        case 'simplex-container':
            document.title = 'Diet Solver';
            break;
        case 'polyreg-container':
            document.title = 'Polynomial Regression';
            break;
        case 'quadspline-container':
            document.title = 'Quadratic Spline Interpolation';
            break;
    }
}

// Diet Solver *************************************************************************************
async function getFoods() {
    let foods = {};

    try {
        const response = await fetch('./src/foods.json');
        const data = await response.json();
        for (let key in data) {
            foods[key] = new Food(data[key]);
        }
    } catch (error) {
        console.error('Error loading foods.json', error);
    }

    return foods;
}

let foods = {};
let selectedFoods = [];

async function main() {        
    // get foods from foods.json
    try {
        foods = await getFoods();
    } catch (error) {
        console.error('Error:', error);
    }

    // generate the foods grid
    let container = document.getElementById('foods-container');
    let keys = Object.keys(foods);

    for (let i = 0; i < 64; i++) {
        let key = keys[i];

        let aFood = document.createElement('div');
        aFood.className = 'aFood';

        let label = document.createElement('label');
        label.className = 'food-label';
        label.htmlFor = key;

        let square = document.createElement('div');
        square.className = 'square';

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = key;
        checkbox.className = 'food-checkbox';

        // add onchange event to the checkbox
        checkbox.addEventListener('change', function() {
            updateFoodList();
        });

        let foodName = document.createElement('div');
        foodName.className = 'food-name';
        foodName.textContent = foods[key].foodName;

        square.appendChild(checkbox);
        label.appendChild(square);
        label.appendChild(foodName);
        aFood.appendChild(label);
        container.appendChild(aFood);

        if (i => 63) {
            document.getElementById('simplex-container').style.display = 'block';
        }
    }

    let checkboxes = document.getElementsByClassName('food-checkbox');

    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('change', function() {
            let square = this.parentElement;
            let label = square.nextElementSibling;
            let container = square.parentElement;
            if (this.checked) {
                square.style.borderColor = 'lawngreen';
                square.style.backgroundColor = '#00ff0066'
                label.style.color = 'lawngreen';
                container.style.backgroundColor = '#00ff0044';
            } else {
                square.style.border = '';
                square.style.backgroundColor = '';
                label.style.color = '';
                container.style.backgroundColor = '';
            }
        });
    }

    document.getElementById('diet-form').addEventListener('submit', function(event) {
        event.preventDefault();        
    });
}

main();

window.updateFoodList = function() {
    let checkboxes = document.getElementsByClassName('food-checkbox');
    let foodList = document.getElementById('foods-list');
    foodList.innerHTML = '';

    selectedFoods = [];

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            let food = foods[checkboxes[i].id];
            let foodItem = document.createElement('li');
            foodItem.textContent = food.foodName;
            foodList.appendChild(foodItem);

            selectedFoods.push(checkboxes[i].id);
        }
    }
}

window.solveDiet = function() {
    if (selectedFoods.length === 0) {
        alert('Please select at least one food.');
        return;
    }

    let foodList = [];
    // add each selected food to the foodList
    for (let food of selectedFoods) {
        foodList.push(foods[food])
    }

    let simplex = dietsolver.parse(foodList);

    console.log(selectedFoods);
    console.log(simplex);

    // simplex summary *********************************************************
    // Objective function
    let objFn = document.getElementById('objective-function');
    objFn.innerHTML = 'Z = ';

    let obj = simplex.objective;
    for (let i = 0; i < obj.coeffs.length; i++) {
        let term = document.createElement('span');
        term.innerHTML = '&nbsp' + obj.coeffs[i] + 'x' + '<sub>' + (i + 1) + '</sub>';
        // add plus sign
        if (i < obj.coeffs.length - 1) {
            term.innerHTML += ' +';
        }
        objFn.appendChild(term);
    }

    // constraints
    let cons = document.getElementById('constraints');
    cons.innerHTML = '';
    for (let i = 0; i < simplex.constraints.length - selectedFoods.length; i++) {
        let eq = document.createElement('div');
        eq.className = 'summary-equation';
        let constraint = simplex.constraints[i];
        for (let j = 0; j < constraint.coeffs.length; j++) {
            let term = document.createElement('span');
            term.innerHTML = constraint.coeffs[j];
            term.innerHTML += 'x' + '<sub>' + (j + 1) + '</sub>';
            // add plus sign
            if (j < constraint.coeffs.length - 1) {
                term.innerHTML += ' +&nbsp';
            }
            eq.appendChild(term);
        }

        // add the <= or >=
        let rhs = document.createElement('span');
        rhs.innerHTML = '&nbsp' + (constraint.mode < 0 ? ' &#8804; ' : ' &#8805; ') + constraint.rhs;
        eq.appendChild(rhs);

        cons.appendChild(eq);
    }

    let maxServings = document.createElement('div');
    let minServings = document.createElement('div');
    maxServings.className = 'summary-equation';
    minServings.className = 'summary-equation';

    for (let i = 0; i < selectedFoods.length; i++) {
        let term = document.createElement('span');
        term.innerHTML = 'x' + '<sub>' + (i + 1) + '</sub>';
        // add the comma
        if (i < selectedFoods.length - 1) {
            term.innerHTML += ',&nbsp';
        }
        maxServings.appendChild(term);
        minServings.appendChild(term.cloneNode(true));
    }
    maxServings.innerHTML += '&nbsp&#8804 ' + simplex.constraints[simplex.constraints.length - 1].rhs;
    minServings.innerHTML += '&nbsp&#8805 ' + 0;

    cons.appendChild(maxServings);
    cons.appendChild(minServings);

    // scroll down to the results
    document.getElementById('diet-results-container').style.display = 'block';
    document.getElementById('diet-results').scrollIntoView({behavior: 'smooth', block: 'start'});

    // end of summary **********************************************************

    // print initial tableau ***************************************************
    let table = simplex.tabulize().data;
    
    let initial = JSON.parse(JSON.stringify(table));
    console.log(initial);

    let initialTableContainer = document.getElementById('initial-tableau');
    initialTableContainer.innerHTML = '';

    // generate the table
    let tableElement = document.createElement('table');
    tableElement.className = 'simplex-table';

    // create a row for the headers
    let headerRow = document.createElement('tr');

    // add the S headers
    for (let i = 1; i <= simplex.length; i++) {
        let headerCell = document.createElement('th');
        headerCell.innerHTML = 'S' + '<sub>' + i + '</sub>';
        headerRow.appendChild(headerCell);
    }

    // add the x headers
    for (let i = 1; i <= selectedFoods.length; i++) {
        let headerCell = document.createElement('th');
        headerCell.innerHTML = 'x' + '<sub>' + i + '</sub>';
        headerRow.appendChild(headerCell);
    }

    // add the Z header
    let headerCell = document.createElement('th');
    headerCell.innerHTML = 'Z';
    headerRow.appendChild(headerCell);

    // add the Solution header
    headerCell = document.createElement('th');
    headerCell.innerHTML = 'Solution';
    headerRow.appendChild(headerCell);

    // Add the header row to the table
    tableElement.appendChild(headerRow);

    for (let i = 0; i < initial.length; i++) {
        let row = document.createElement('tr');

        for (let j = 0; j < initial[i].length; j++) {
            let cell = document.createElement('td');
            // if initial[i][j] < 0.001. just print < 0.001
            if (Math.abs(initial[i][j]) < 0.001 && initial[i][j] !== 0) {
                cell.textContent = '< 0.001';
            } else {
                cell.textContent = Number(initial[i][j].toFixed(3));
            }
            row.appendChild(cell);
        }

        tableElement.appendChild(row);
    }

    initialTableContainer.appendChild(tableElement);

}


// Polynomial Regression functions *****************************************************************
let polyregPointList;
let polyregSolution;

window.readPolyregFile = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        // read the csv file
        const contents = e.target.result;
        const rows = contents.split('\n');
        const points = [];

        for (let row of rows) {
            const [x, y] = row.split(',');
            points.push(new Point(Number(x), Number(y)));
        }

        // generate the pointlist
        polyregPointList = new PointList(points);
        polyregPointList.sortPoints();

        // generate the table
        generatePolyregTable(polyregPointList);

        // show the others
        document.getElementsByClassName('polyreg-results-container')[0].style.display = 'flex';

        document.getElementById('polyregdegree').setAttribute('max', polyregPointList.points.length - 1);
        document.getElementById('polyregdegree').setAttribute('max', polyregPointList.points.length - 1);
        document.getElementById('polyreg-x').value = polyregPointList.points[0].x;

        updatePolyregValues();
    };

    reader.readAsText(file);
}

function generatePolyregTable(pointList) {
    const tableContainer = document.querySelector('.polyreg-table-container');
    const table = document.createElement('table');
    table.className = 'xy-table';

    const headerRow = document.createElement('tr');
    const xHeader = document.createElement('th');
    const yHeader = document.createElement('th');

    xHeader.textContent = 'x';
    yHeader.textContent = 'f(x)';
    headerRow.appendChild(xHeader);
    headerRow.appendChild(yHeader);
    table.appendChild(headerRow);

    for (let point of pointList.points) {
        const row = document.createElement('tr');
        const xCell = document.createElement('td');
        const yCell = document.createElement('td');

        xCell.textContent = point.x;
        yCell.textContent = point.y;
        row.appendChild(xCell);
        row.appendChild(yCell);
        table.appendChild(row);
    }

    // Clear the table container and append the new table
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}

function updatePolyregValues() {
    // get the degree
    const degreeInput = document.getElementById('polyregdegree');
    const degreeValue = Number(degreeInput.value);

    if (degreeValue > polyregPointList.points.length - 1
        || degreeValue < 0
        || Math.round(degreeValue) !== degreeValue)
    {
        document.getElementById('polyreg-fn-value').textContent = 'Invalid degree!';
        return;
    } 

    // solve the polynomial
    const polymat = polyreg.vandermondeMatrix(degreeValue, polyregPointList);
    polymat.gaussJordanMethod();
    polyregSolution = polyreg.getSolution(polymat);

    console.log(polyregSolution)

    // get the x value
    const xInput = document.getElementById('polyreg-x');    
    let x_value = Number(xInput.value);

    document.getElementById('polyreg-x-value').textContent = x_value;   // update x in f(x) = y

    let fn = document.getElementById('polyreg-fn-value');
    // reset the content of fn
    fn.innerHTML = '';

    // loop over poly
    for (let i = 0; i <= polyregSolution.degree; i++) {
        let term = document.createElement('span');
        if (polyregSolution.coeffs[i] !== 0) {
            // print the signs
            if (i !== 0) {
                term.innerHTML += polyregSolution.coeffs[i] >= 0 ? " + " : " - ";
            } else if (polyregSolution.coeffs[i] < 0) {
                term.innerHTML += "-";
            }

            // increase precision appropriately
            let precision = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(polyregSolution.coeffs[i]))));

            // format the coefficient to have 4 decimal places
            term.innerHTML += Math.abs(polyregSolution.coeffs[i]).toFixed(precision);
            
            if (i > 0) {
                term.innerHTML += "x";
                
                if (i > 1) {
                    term.innerHTML += `<sup>${i}</sup>`;
                }
            }
    
            fn.appendChild(term);
        }
    }

    let y_value = polyreg.estimate(polyregSolution, x_value);
    document.getElementById('polyreg-fn-result-value').textContent = y_value.toFixed(4);   // update y in f(x) = y
}

window.updatePolyregInput = function() {
    updatePolyregValues();
}

// Quadratic Spline Interpolation functions ********************************************************
let quadsplinePointList;
let quadsplineSolution;

window.readQuadsplineFile = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        // read the csv file
        const contents = e.target.result.trim();
        const rows = contents.split('\n');
        const points = [];

        for (let row of rows) {
            const [x, y] = row.split(',');
            points.push(new Point(Number(x), Number(y)));
        }

        // generate the pointlist
        quadsplinePointList = new PointList(points);

        // print error if there are duplicate x values
        let hasDuplicate = false;
        let duplicates = new Set();

        for (let i = 0; i < quadsplinePointList.length - 1; i++) {
            if (quadsplinePointList.points[i].x === quadsplinePointList.points[i + 1].x) {
                duplicates.add(quadsplinePointList.points[i].x);
                hasDuplicate = true;
            }
        }
    
        if (hasDuplicate) {
            let tableContainer = document.querySelector('.quadspline-table-container');
            tableContainer.innerHTML = "Duplicate x values found! "

            let sortedDuplicates = Array.from(duplicates).sort((a, b) => a - b);
            for (let dupe of sortedDuplicates) {
                tableContainer.innerHTML += dupe + ' ';
            }

            return;
        }

        quadsplinePointList.sortPoints();

        generateQuadsplineTable(quadsplinePointList);

        document.getElementsByClassName('quadspline-results-container')[0].style.display = 'flex';

        computeQuadspline(quadsplinePointList);
    };

    reader.readAsText(file);
}

function generateQuadsplineTable(pointList) {
    const tableContainer = document.querySelector('.quadspline-table-container');
    const table = document.createElement('table');
    table.className = 'xy-table';

    const headerRow = document.createElement('tr');
    const xHeader = document.createElement('th');
    const yHeader = document.createElement('th');

    xHeader.textContent = 'x';
    yHeader.textContent = 'f(x)';
    headerRow.appendChild(xHeader);
    headerRow.appendChild(yHeader);
    table.appendChild(headerRow);

    for (let point of pointList.points) {
        const row = document.createElement('tr');
        const xCell = document.createElement('td');
        const yCell = document.createElement('td');

        xCell.textContent = point.x;
        yCell.textContent = point.y;
        row.appendChild(xCell);
        row.appendChild(yCell);
        table.appendChild(row);
    }

    // Clear the table container and append the new table
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}

function computeQuadspline(pointList) {
    let qsMat = QSparse(pointList);
    qsMat.gaussJordanMethod();

    quadsplineSolution = new QSSolution(qsMat, pointList);

    console.log(quadsplineSolution);

    // iterate over the equations
    let fnContainer = document.getElementById('quadspline-fn-value');
    let boundsContainer = document.getElementById('quadspline-fn-bounds');
    
    // reset the content of fn
    fnContainer.innerHTML = '';
    boundsContainer.innerHTML = '';

    for (let i = 0; i < quadsplineSolution.length; i++) {
        let fn = document.createElement('div');
        fnContainer.appendChild(fn);

        let eq = quadsplineSolution.eqs[i];

        let term;
        let sign;
        let precision;
        
        if (eq.coeffs[0] !== 0.0) {
            term = document.createElement('span');

            precision = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(eq.coeffs[0]))));
            term.innerHTML = eq.coeffs[0].toFixed(precision);
            
            fn.appendChild(term);
        }

        if (eq.coeffs[0] != 0.0 && eq.coeffs[1] !== 0.0) {
            sign = document.createElement('span');
            if (eq.coeffs[1] > 0) {
                sign.innerHTML = ' + ';
            } else {
                sign.innerHTML = ' - ';
            }
            fn.appendChild(sign);
        }

        if (eq.coeffs[1] !== 0.0) {
            term = document.createElement('span');

            precision = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(eq.coeffs[1]))));

            // print the sign if the first term is non-zero
            if (eq.coeffs[0] !== 0.0) {
                if (eq.coeffs[1] > 0.0) {
                    sign.innerHTML = ' + ';
                } else {
                    sign.innerHTML = ' - ';
                }
                term.innerHTML += `${Math.abs(eq.coeffs[1]).toFixed(precision)}x`;
            } else {
                term.innerHTML += `${eq.coeffs[1].toFixed(precision)}x`;
            }

            fn.appendChild(term);
        }

        
        if (eq.coeffs[2] !== 0.0) {
            term = document.createElement('span');
        
            precision = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(eq.coeffs[2]))));

            // print the sign if the first term and the second term are non-zero
            if (eq.coeffs[0] !== 0.0 || eq.coeffs[1] !== 0.0) {
                if (eq.coeffs[2] > 0.0) {
                    term.innerHTML = ' + ';
                } else {
                    term.innerHTML = ' - ';
                }
                term.innerHTML += `${Math.abs(eq.coeffs[2]).toFixed(precision)}x<sup>2</sup>`;
            } else {
                term.innerHTML += `${eq.coeffs[2].toFixed(precision)}x<sup>2</sup>`;
            }

            fn.appendChild(term);
        }

        // add the boundaries
        let bounds = document.createElement('div');
        // when lower <= x <= upper
        bounds.innerHTML = 'if  ' + eq.lower + ' &#8804; x &#8804; ' + eq.upper;

        boundsContainer.appendChild(bounds);
    }

    document.getElementById('quadspline-x').setAttribute('min', pointList.points[0].x);
    document.getElementById('quadspline-x').setAttribute('max', pointList.points[pointList.length - 1].x);
    // change step to log 10 of the difference between the first and last x values
    let step = Math.pow(10, Math.floor(Math.log10(pointList.points[pointList.length - 1].x - pointList.points[0].x)) - 1);
    document.getElementById('quadspline-x').setAttribute('step', step);
    document.getElementById('quadspline-x').value = pointList.points[0].x;

    updateQuadsplineValues();
}

function updateQuadsplineValues() {
    const xInput = document.getElementById('quadspline-x');
    let x_value = Number(xInput.value);

    // update x in f(x) = y
    document.getElementById('quadspline-x-value').innerHTML = x_value;

    let resultFunctionContainer = document.getElementById('quadspline-selected-fn-value');
    let resultContainer = document.getElementById('quadspline-fn-result-value');

    // if x is out of bounds, print out of bounds then return
    if (x_value < quadsplineSolution.eqs[0].lower || x_value > quadsplineSolution.eqs[quadsplineSolution.length - 1].upper) {
        resultFunctionContainer.innerHTML = 'Out of bounds!';
        resultContainer.innerHTML = 'Out of bounds!';
        return;
    }

    // reset the content of fn
    resultFunctionContainer.innerHTML = '';

    // find the equation that contains x
    for (let i = 0; i < quadsplineSolution.length; i++) {
        if (quadsplineSolution.eqs[i].lower <= x_value && x_value <= quadsplineSolution.eqs[i].upper) {
            let fn = document.getElementById('quadspline-selected-fn-value');

            let eq = quadsplineSolution.eqs[i];

            let term;
            let sign;
            let precision;
            
            if (eq.coeffs[0] !== 0.0) {
                term = document.createElement('span');

                precision = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(eq.coeffs[0]))));
                term.innerHTML = eq.coeffs[0].toFixed(precision);
                
                fn.appendChild(term);
            }

            if (eq.coeffs[0] != 0.0 && eq.coeffs[1] !== 0.0) {
                sign = document.createElement('span');
                if (eq.coeffs[1] > 0) {
                    sign.innerHTML = ' + ';
                } else {
                    sign.innerHTML = ' - ';
                }
                fn.appendChild(sign);
            }

            if (eq.coeffs[1] !== 0.0) {
                term = document.createElement('span');

                precision = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(eq.coeffs[1]))));

                // print the sign if the first term is non-zero
                if (eq.coeffs[0] !== 0.0) {
                    if (eq.coeffs[1] > 0.0) {
                        sign.innerHTML = ' + ';
                    } else {
                        sign.innerHTML = ' - ';
                    }
                    term.innerHTML += `${Math.abs(eq.coeffs[1]).toFixed(precision)}x`;
                } else {
                    term.innerHTML += `${eq.coeffs[1].toFixed(precision)}x`;
                }

                fn.appendChild(term);
            }

            
            if (eq.coeffs[2] !== 0.0) {
                term = document.createElement('span');
            
                precision = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(eq.coeffs[2]))));

                // print the sign if the first term and the second term are non-zero
                if (eq.coeffs[0] !== 0.0 || eq.coeffs[1] !== 0.0) {
                    if (eq.coeffs[2] > 0.0) {
                        term.innerHTML = ' + ';
                    } else {
                        term.innerHTML = ' - ';
                    }
                    term.innerHTML += `${Math.abs(eq.coeffs[2]).toFixed(precision)}x<sup>2</sup>`;
                } else {
                    term.innerHTML += `${eq.coeffs[2].toFixed(precision)}x<sup>2</sup>`;
                }

                fn.appendChild(term);
            }


            break;
        }
    }

    // estimate x
    let y_value = quadsplineSolution.evaluate(x_value);

    // update y in f(x) = y
    resultContainer.innerHTML = y_value.toFixed(4);
}

window.updateQuadsplineInput = function() {
    updateQuadsplineValues();
}