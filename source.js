const modifiers = {
    'str': {
        'id': 'strength',
        'amt': 0,
        'prof': 0
    },
    'dex': {
        'id': 'dexterity',
        'amt': 0,
        'prof': 0
    },
    'con': {
        'id': 'constitution',
        'amt': 0,
        'prof': 0
    },
    'int': {
        'id': 'intelligence',
        'amt': 0,
        'prof': 0
    },
    'wis': {
        'id': 'wisdom',
        'amt': 0,
        'prof': 0
    },
    'cha': {
        'id': 'charisma',
        'amt': 0,
        'prof': 0
    },
};
let prof_bonus_field = undefined;
let last_proof = [];
let body = undefined;
let dice_roll_proof = undefined;
let dice_roll_result = undefined;

document.addEventListener('DOMContentLoaded', function() {
    generate_ability_table();
});

/**
 * Convert the entered ability scores into modifiers.
 */
function refresh_stats() {
    // Get the set prof score
    let prof_bonus = 0;
    if ( undefined === prof_bonus_field ) {
        prof_bonus_field = document.getElementById( 'prof_bonus' );
    }
    if ( prof_bonus_field ) {
        prof_bonus = Number( prof_bonus_field.value );
    }

    for ( const [ ability, ability_args ] of Object.entries( modifiers ) ) {
        // Calculate modifier amount
        const score_ref_key = 'score_ref';
        let ability_field;
        if ( !ability_args.hasOwnProperty( score_ref_key ) ) {
            ability_field = document.getElementById( ability_args[ 'id' ] );
            modifiers[ ability ][ score_ref_key ] = ability_field;
        } else {
            ability_field = ability_args[ score_ref_key ];
        }
        let ability_score = 10;
        if ( ability_field ) {
            ability_score = Number( ability_field.value );
        }
        const modifier_amount = Math.floor( ( ability_score - 10 ) / 2 );
        modifiers[ ability ][ 'amt' ] = modifier_amount;

        // Set proficiency points
        const prof_ref_key = 'prof_ref';
        let prof_field;
        if ( !ability_args.hasOwnProperty( prof_ref_key ) ) {
            prof_field = document.getElementById( ability_args[ 'id' ] + '_prof' );
            modifiers[ ability ][ prof_ref_key ] = prof_field;
        } else {
            prof_field = ability_args[ prof_ref_key ];
        }
        const is_prof = Boolean( prof_field.checked );
        modifiers[ ability ][ 'prof' ] = is_prof ? prof_bonus : 0;
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
    refresh_stats(); // just so everything stays up to date

    expression = sanitize_dice_expression( expression );
    let expression_parts = expression.split( '+' );
    last_proof = [];

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
            last_proof.push( '[ ' + rolled_amounts.join( ', ' ) + ' ]' );
        }

        // If this is a modifier...
        if ( is_modifier( expression_part ) ) {
            const modifier = modifiers[ expression_part ][ 'amt' ];
            const prof_bonus = modifiers[ expression_part ][ 'prof' ];
            expression_part = modifier + prof_bonus;
            last_proof.push( expression_part );
        }

        // If this is just a regular number...
        if ( is_numeric( expression_part ) ) {
            expression_part = Number( expression_part );
            last_proof.push( expression_part );
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

    return running_total;
}

/**
 * Check if the current environment is set for dice expressions to be entered
 * manually.
 * 
 * @returns {Boolean} True if yes, false if no.
 */
function is_manual_spell_entry_mode() {
    if ( undefined === body ) {
        body = document.getElementById( "body" );
    }
    let mode = body.getAttribute( "spell_entry" );
    return 'manual' === mode;
}

/**
 * Evaluate the dice expression for a given ability slot.
 * 
 * @param {Element} button The "Roll" button invoking this request.
 */
function perform_ability_slot_roll( button ) {
    // The current set-up for an ability row
    /*
    <tr> <!-- Where we wanna be -->
        <!-- Other Nodes -->
        <td><button onclick="perform_ability_slot_roll( this )">Roll</button></td>
    </tr>
    */
   // Fetch
    const ability_row = button.parentNode.parentNode;
    let input_class;
    if ( is_manual_spell_entry_mode() ) {
        input_class = '.manual_spell';
    } else {
        input_class = '.select_spell';
    }
    const ability_input = ability_row.querySelector( input_class );

    // Evaluate
    const dice_expression = ability_input.value;
    const dice_expression_result = evaluate_dice_expression( dice_expression );

    // Display
    if ( undefined === dice_roll_proof ) {
        dice_roll_proof = document.getElementById( 'dice_roll_proof' );
    }
    if ( undefined === dice_roll_result ) {
        dice_roll_result = document.getElementById( 'dice_roll_result' );
    }
    dice_roll_proof.textContent = last_proof.join( ' + ' );
    dice_roll_result.textContent = dice_expression_result;
}

function generate_ability_table() {
    const ability_table = document.getElementById( 'ability_table' );

    /*
    <tr>
        <td><label>Ability 1</label></td>
        <td>
            <select name="ability_spell" class="select_spell" ability="1">
                <option value="">Some Spell</option>
            </select>
            <input type="text" class="manual_spell" placeholder="Dice Expression... (ex: 2d8+str+4d6)">
        </td>
        <td><button onclick="perform_ability_slot_roll( this )">Roll</button></td>
    </tr>
    */

    function wrap_in_td( element ) {
        const td = document.createElement( 'td' );
        td.appendChild( element );
        return td;
    }

    for ( let i = 1; i <= 9; i++ ) {
        const tr_row = document.createElement( 'tr' );

        // Label
        let label = document.createElement( 'label' );
        label.textContent = 'Ability ' + i;
        label = wrap_in_td( label );
        
        // Input
        let input_wrap = document.createElement( 'div' );
        let select = document.createElement( 'select' );
        select.name = "ability_spell";
        select.classList = "select_spell";
        select.setAttribute( 'ability', i );
        let manual = document.createElement( 'input' );
        manual.type = "text";
        manual.classList = "manual_spell";
        if ( 1 === i ) {
            manual.placeholder = "Dice Expression... (ex: 2d8+str+4d6)";
        }
        input_wrap.appendChild( select );
        input_wrap.appendChild( manual );
        input_wrap = wrap_in_td( input_wrap );

        // Button
        let button = document.createElement( 'button' );
        button.onclick = function() {
            perform_ability_slot_roll( button );
        };
        button.innerHTML = 'Roll';
        button = wrap_in_td( button );

        tr_row.appendChild( label );
        tr_row.appendChild( input_wrap );
        tr_row.appendChild( button );

        ability_table.appendChild( tr_row );
    }
}