const modifiers = {
    'str': {
        'id': 'strength',
        'amt': 0
    },
    'dex': {
        'id': 'dexterity',
        'amt': 0
    },
    'con': {
        'id': 'constitution',
        'amt': 0
    },
    'int': {
        'id': 'intelligence',
        'amt': 0
    },
    'wis': {
        'id': 'wisdom',
        'amt': 0
    },
    'cha': {
        'id': 'charisma',
        'amt': 0
    },
};

/**
 * Convert the entered ability scores into modifiers.
 */
function refresh_stats() {
    for ( const [ ability, ability_args ] of Object.entries( modifiers ) ) {
        let ability_field;
        if ( !ability_args.hasOwnProperty( 'ref' ) ) {
            ability_field = document.getElementById( ability_args[ 'id' ] );
            modifiers[ ability ][ 'ref' ] = ability_field;
        } else {
            ability_field = ability_args[ 'ref' ];
        }
        const ability_score = Number( ability_field.value );
        const modifier_amount = Math.floor( ( ability_score - 10 ) / 2 );
        modifiers[ ability ][ 'amt' ] = modifier_amount;
    }
}

/**
 * Generate a random number between 1 and x.
 * 
 * @param {Number} sides The `x`.
 * @returns {Number} The randomly generated value.
 */
function roll_dice( sides ) {
    return Math.floor( Math.random() * sides ) + 1;
}

/**
 * Take the provided dice expression, and remove any problematic characters.
 * 
 * @param {String} expression The raw dice expression.
 * @returns {String} The sanitized dice expression.
 */
function sanitize_dice_expression( expression ) {
    expression = expression.replaceAll( ' ', '' );
    return expression;
}

/**
 * Check if the provided expression should be interpreted as a dice roll.
 * 
 * @param {String} expression The expression part.
 * @returns {Object|false} A dictionary with a `total_rolls` and `dice_sides`
 * keys if the provided expression is a dice roll, and false if it isn't.
 */
function is_dice_roll( expression ) {
    let dice_parts = expression.split( 'd' );
    if ( dice_parts.length == 2 ) {
        return {
            'total_rolls': Number( dice_parts[ 0 ] ),
            'dice_sides': Number( dice_parts[ 1 ] )
        };
    }
    return false;
}

/**
 * Check if a provided string is meant to represent a modifier.
 * 
 * @param {String} expression The expression part.
 * @returns {Boolean} True if yes, false if no.
 */
function is_modifier( expression ) {
    return modifiers.hasOwnProperty( expression );
}

/**
 * Check if a string is a number.
 * 
 * @param {String} thing The string.
 * @returns {Boolean} True if yes, false if no.
 */
function is_numeric( thing ) {
    if ( typeof thing != "string" ) return false;
    return !isNaN( thing ) && 
        !isNaN( parseFloat( thing ) )
}

/**
 * Take a string representing a dice expression, and evaluate what
 * a total would be.
 * 
 * @param {String} expression The raw dice expression.
 * @returns {Number} The evaluated total.
 */
function evaluate_dice_expression( expression ) {
    refresh_stats(); // always, regardless

    expression = sanitize_dice_expression( expression );
    let expression_parts = expression.split( '+' );
    let proof = [];

    // Interpret each part of the given expression
    for (
        let expression_index = 0;
        expression_index < expression_parts.length;
        expression_index++
    ) {
        let expression_part = expression_parts[ expression_index ];

        // If this is a dice roll expression...
        const dice_parts = is_dice_roll( expression_part );
        if ( false !== dice_parts ) {
            let running_total = 0;
            let total_rolls = dice_parts[ 'total_rolls' ];
            let dice_sides = dice_parts[ 'dice_sides' ];
            let rolled_amounts = [];
            for ( let roll = 0; roll < total_rolls; roll++ ) {
                const rolled_amount = roll_dice( dice_sides );
                rolled_amounts.push( rolled_amount );
                running_total += rolled_amount;
            }
            expression_part = running_total;
            proof.push( '[ ' + rolled_amounts.join( ', ' ) + ' ]' );
        }

        // If this is a modifier...
        if ( is_modifier( expression_part ) ) {
            expression_part = modifiers[ expression_part ][ 'amt' ];
            proof.push( expression_part );
        }

        // If this is just a regular number...
        if ( is_numeric( expression_part ) ) {
            expression_part = Number( expression_part );
            proof.push( expression_part );
        }

        expression_parts[ expression_index ] = expression_part;
    }

    // Amalgamate the totals together
    let running_total = 0;
    for (
        let expression_index = 0;
        expression_index < expression_parts.length;
        expression_index++
    ) {
        let expression_part = expression_parts[ expression_index ];
        if ( null === expression_part ) continue;
        running_total += expression_part;
    }

    console.log( proof.join( ' + ' ) );
    return running_total;
}