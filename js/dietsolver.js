import { Objective, Constraint, SimplexV2 } from './simplex.js';

const MIN_CALORIES = 2000;
const MIN_CHOLESTEROL = 0;
const MIN_TOTAL_FAT = 0;
const MIN_SODIUM = 0;
const MIN_CARBOHYDRATES = 0;
const MIN_DIETARY_FIBER = 25;
const MIN_PROTEIN = 50;
const MIN_VIT_A = 5000;
const MIN_VIT_C = 50;
const MIN_CALCIUM = 800;
const MIN_IRON = 10;

const MAX_CALORIES = 2250;
const MAX_CHOLESTEROL = 300;
const MAX_TOTAL_FAT = 65;
const MAX_SODIUM = 2400;
const MAX_CARBOHYDRATES = 300;
const MAX_DIETARY_FIBER = 100;
const MAX_PROTEIN = 100;
const MAX_VIT_A = 50000;
const MAX_VIT_C = 20000;
const MAX_CALCIUM = 1600;
const MAX_IRON = 30;

const MAX_SERVINGS = 10;

// returns a Simplex object from FoodList
function parse(foodlist) {
    // empty arrays to store the coefficients for objective and constraints
    let _price = [];

    let _calories = [];
    let _cholesterol = [];
    let _totalFat = [];
    let _sodium = [];
    let _carbohydrates = [];
    let _dietaryFiber = [];
    let _protein = [];
    let _vitA = [];
    let _vitC = [];
    let _calcium = [];
    let _iron = [];

    // iterate through each food in the foodlist
    for (let food of foodlist) {
        // push the price of the food to the price array
        _price.push(food.price);

        // push the nutrient values to their respective arrays
        _calories.push(food.calories);
        _cholesterol.push(food.cholesterol);
        _totalFat.push(food.totalFat);
        _sodium.push(food.sodium);
        _carbohydrates.push(food.carbohydrates);
        _dietaryFiber.push(food.dietaryFiber);
        _protein.push(food.protein);
        _vitA.push(food.vitA);
        _vitC.push(food.vitC);
        _calcium.push(food.calcium);
        _iron.push(food.iron);
    }

    // create the objective function
    let obj = new Objective(_price);

    // create the constraints
    let minCalories = new Constraint(_calories, 1, MIN_CALORIES);
    let maxCalories = new Constraint(_calories, -1, MAX_CALORIES);
    
    let minCholesterol = new Constraint(_cholesterol, 1, MIN_CHOLESTEROL);
    let maxCholesterol = new Constraint(_cholesterol, -1, MAX_CHOLESTEROL);
    
    let minTotalFat = new Constraint(_totalFat, 1, MIN_TOTAL_FAT);
    let maxTotalFat = new Constraint(_totalFat, -1, MAX_TOTAL_FAT);
    
    let minSodium = new Constraint(_sodium, 1, MIN_SODIUM);
    let maxSodium = new Constraint(_sodium, -1, MAX_SODIUM);
    
    let minCarbohydrates = new Constraint(_carbohydrates, 1, MIN_CARBOHYDRATES);
    let maxCarbohydrates = new Constraint(_carbohydrates, -1, MAX_CARBOHYDRATES);
    
    let minDietaryFiber = new Constraint(_dietaryFiber, 1, MIN_DIETARY_FIBER);
    let maxDietaryFiber = new Constraint(_dietaryFiber, -1, MAX_DIETARY_FIBER);
    
    let minProtein = new Constraint(_protein, 1, MIN_PROTEIN);
    let maxProtein = new Constraint(_protein, -1, MAX_PROTEIN);
    
    let minVitA = new Constraint(_vitA, 1, MIN_VIT_A);
    let maxVitA = new Constraint(_vitA, -1, MAX_VIT_A);
    
    let minVitC = new Constraint(_vitC, 1, MIN_VIT_C);
    let maxVitC = new Constraint(_vitC, -1, MAX_VIT_C);
    
    let minCalcium = new Constraint(_calcium, 1, MIN_CALCIUM);
    let maxCalcium = new Constraint(_calcium, -1, MAX_CALCIUM);
    
    let minIron = new Constraint(_iron, 1, MIN_IRON);
    let maxIron = new Constraint(_iron, -1, MAX_IRON);

    let maxServingsConstraints = [];
    for (let i = 0; i < foodlist.length; i++) {
        // set all coeffs to zero except for i which is 1
        let coeffs = Array(foodlist.length).fill(0);
        coeffs[i] = 1;
        maxServingsConstraints.push(new Constraint(coeffs, -1, MAX_SERVINGS));
    }

    // create the simplex object
    return new SimplexV2(
        -1,                 // minimize
        obj,
        [
            minCalories, maxCalories,
            minCholesterol, maxCholesterol,
            minTotalFat, maxTotalFat,
            minSodium, maxSodium,
            minCarbohydrates, maxCarbohydrates,
            minDietaryFiber, maxDietaryFiber,
            minProtein, maxProtein,
            minVitA, maxVitA,
            minVitC, maxVitC,
            minCalcium, maxCalcium,
            minIron, maxIron,
            ...maxServingsConstraints
        ]
    );
}

export { parse };