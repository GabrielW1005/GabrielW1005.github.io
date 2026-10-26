// Concept guidance for printed exercises. This module deliberately never reads
// problem answers, worked steps, or target coordinates.
const PRACTICE = 'Try a different problem with step-by-step solutions.';
const guide = (title, ...steps) => ({ title, steps, practicePrompt: PRACTICE });

export function guidanceFor(problem = {}) {
  const f = String(problem.family || '');
  if (f === 'order-rational') return guide('Compare the values',
    'Use decimals or a common denominator to compare the numbers.',
    'On a number line, smaller values are farther left. Keep each negative sign with its number.');
  if (f === 'absolute-opposite') return guide('Opposite and absolute value',
    'The opposite has the same distance from zero on the other side.',
    'Absolute value measures distance from zero, so it is never negative.');
  if (f === 'number-distance') return guide('Distance on a number line',
    'Subtract the smaller coordinate from the larger coordinate.',
    'A distance is nonnegative. Count across zero when the points lie on different sides.');
  if (f === 'zero-division') return guide('Check whether division is defined',
    'Think about the related multiplication statement: divisor × quotient = dividend.',
    'Decide whether any quotient can make that statement true.');
  if (/^(?:integer|decimal)-(?:add|subtract)$/.test(f)) return guide('Add or subtract signed numbers',
    'Rewrite subtraction as addition of the opposite when needed.',
    'For equal signs, add magnitudes and keep the sign. For different signs, subtract magnitudes and keep the sign of the larger magnitude.',
    'For decimals, line up decimal points and place values.');
  if (/^(?:integer|decimal)-(?:multiply|divide)$/.test(f)) return guide('Multiply or divide signed numbers',
    'Work with the magnitudes first. Equal signs give a positive result; different signs give a negative result.',
    f.includes('decimal') ? 'Use place value to locate the decimal point. In division, multiply both numbers by the same power of ten to make the divisor a whole number.' : 'Use the related multiplication fact to check your result.');
  if (/fraction-(?:add|subtract)$/.test(f)) return guide('Add or subtract fractions',
    'Rewrite the fractions with a common denominator.',
    'Add or subtract the signed numerators, keeping the common denominator.',
    'Simplify the result and check its sign.');
  if (/fraction-multiply$/.test(f)) return guide('Multiply fractions',
    'Cancel common factors between a numerator and a denominator when possible.',
    'Multiply the numerators and multiply the denominators. Use the factor signs to decide the sign.',
    'Write the result in simplest form.');
  if (/fraction-divide$/.test(f)) return guide('Divide fractions',
    'Keep the first fraction and multiply by the reciprocal of the second fraction.',
    'Cancel common factors, multiply, and check the sign.');
  if (['fraction-decimal-percent', 'repeating-decimal', 'terminating-decimal'].includes(f)) return guide('Change number forms',
    'Divide the numerator by the denominator to convert a fraction to a decimal.',
    'Multiply a decimal by one hundred to write its percent. Watch whether long-division remainders stop or repeat.');
  if (['order-operations', 'signed-order', 'fraction-order', 'mixed-order'].includes(f)) return guide('Follow the order of operations',
    'Work inside grouping symbols, then evaluate powers.',
    'Multiply and divide from left to right; then add and subtract from left to right.',
    'Keep negative signs with their numbers and use common denominators only when adding or subtracting fractions.');
  if (f === 'combine-terms') return guide('Combine like terms',
    'Group terms with exactly the same variable part.',
    'Add their signed coefficients. Keep constant terms separate from variable terms.');
  if (f === 'factor') return guide('Factor an expression',
    'Divide every term by the factor named in the question.',
    'Place the resulting expression in parentheses. Distribute to check your factored form.');
  if (['expand', 'expression-expand-combine', 'expression-subtract', 'expression-equivalence'].includes(f)) return guide('Use equivalent expressions',
    'Distribute an outside factor to every term inside parentheses.',
    'A subtraction before parentheses changes the sign of every enclosed term.',
    'Combine like terms. To compare two expressions, simplify both or find a value showing that they differ.');
  if (f === 'percent-expression') return guide('Combine a percent expression',
    'Treat the original quantity as one whole of itself.',
    'Combine like terms to write one coefficient multiplying the original quantity.');
  if (/^equation-/.test(f)) return guide('Keep the equation balanced',
    'Simplify each side if needed, then undo operations in reverse order.',
    'Apply the same operation to both sides until the variable is isolated.',
    'Substitute your value into the original equation to check it.');
  if (/^inequality-/.test(f)) return guide('Solve and graph an inequality',
    'Use inverse operations on both sides. Reverse the inequality sign when multiplying or dividing by a negative number.',
    'Use an open endpoint for < or > and a filled endpoint for ≤ or ≥.',
    'Shade the values that make the original inequality true.');
  if (f === 'arithmetic-sequence') return guide('Look for a constant difference',
    'Subtract consecutive terms to find the repeated change.',
    'Apply that change to extend the sequence. When graphing, use term number as the horizontal coordinate.');
  if (f === 'geometric-sequence') return guide('Look for a constant ratio',
    'Divide a term by the preceding term to find the repeated multiplier.',
    'Apply that multiplier to extend the sequence. Keep track of signs and fractions.');
  if (/^coordinate-/.test(f)) return guide('Use ordered pairs',
    'Read or move horizontally first for x, then vertically for y.',
    'Start from the origin and follow the axis signs and scale. Write each pair as (x, y).');
  if (f === 'proportion-solve') return guide('Solve a proportion',
    'Keep corresponding quantities in the same order in both ratios.',
    'Use an equivalent-fraction scale factor or equal cross products, then isolate the unknown.');
  if (/^proportion-/.test(f)) return guide('Check proportional relationships',
    'Compare y divided by x for nonzero x-values. A proportional relationship keeps this ratio constant.',
    'Use y = kx for its equation. Its graph is a straight line through the origin.',
    'For a table or graph, substitute each requested x-value and pair it with the corresponding y-value.');
  if (/^unit-rate/.test(f)) return guide('Find a rate per one unit',
    'Divide the first quantity by the second quantity, keeping the units in that order.',
    'For fractional quantities, use fraction division. Compare rates only after writing them in the same units.');
  if (['percent-of', 'tip', 'tax', 'commission', 'discount-amount', 'markup-amount'].includes(f)) return guide('Find a percent amount',
    'Write the percent as a decimal and multiply by the original amount.',
    'Read carefully whether the question asks for the change itself or for a total.');
  if (f === 'percent-whole') return guide('Find the whole',
    'Write the relationship as part = decimal rate × whole.',
    'Divide the part by the decimal rate to find the unknown whole.');
  if (f === 'percent-rate') return guide('Find a percent rate',
    'Divide the part by the whole.',
    'Convert the resulting decimal to a percent.');
  if (f === 'percent-adjust') return guide('Increase or decrease a quantity',
    'Find the percent amount from the original quantity.',
    'Add an increase or subtract a decrease. You can also use a single multiplier based on one whole.');
  if (f === 'percent-change') return guide('Measure percent change',
    'Find the size of the change between the new and original quantities.',
    'Divide by the original quantity, then convert to a percent. Identify whether it is an increase or decrease.');
  if (f === 'percent-reverse') return guide('Work backward from a percent change',
    'Write the multiplier for the increase or decrease.',
    'Divide the final amount by that multiplier to recover the original amount.');
  if (f === 'percent-error') return guide('Measure percent error',
    'Find the absolute difference between the measured and actual values.',
    'Divide by the actual value and convert to a percent.');
  if (f === 'simple-interest') return guide('Use simple interest',
    'Multiply principal × decimal annual rate × time in years.',
    'If the question asks for the final balance, add the principal to the interest.');
  if (['discount-tax', 'tip-total', 'commission-fee', 'markup-discount', 'discount-tax-fee'].includes(f)) return guide('Combine percent changes in order',
    'Identify the amount each percent is based on.',
    'Apply each change in the stated order, using the updated amount when required.',
    'Add or subtract any fixed fee separately. Round money only as directed.');
  if (f === 'measure-unit') return guide('Measure length in units',
    'Count the intervals between marks, rather than counting the marks.',
    'Use the value of one interval and combine any partial units.');
  if (f === 'perimeter-rectangle') return guide('Measure the outside boundary',
    'Add the lengths of all outside edges exactly once.',
    'For a rectangle, opposite sides have equal lengths. Use ordinary length units.');
  if (f === 'area-count') return guide('Count square units',
    'Count whole unit squares and combine partial squares.',
    'Area measures the surface covered, so give square units.');
  if (f === 'area-rectangle') return guide('Find rectangle area',
    'Multiply length by width, using matching units.',
    'Report the result in square units.');
  if (f === 'area-triangle') return guide('Find triangle area',
    'Choose a base and its perpendicular height.',
    'Multiply base × height, then take half of that product.');
  if (f === 'area-parallelogram') return guide('Find parallelogram area',
    'Use a base and the perpendicular distance between the parallel bases.',
    'Multiply base by height. A slanted side is not the height.');
  if (f === 'area-trapezoid') return guide('Find trapezoid area',
    'Identify the two parallel bases and the perpendicular height.',
    'Average the base lengths, then multiply by the height. You may also split the figure into rectangles and triangles.');
  if (f === 'area-composite') return guide('Split a composite area',
    'Break the shape into rectangles and triangles, or subtract a missing piece from a larger simple shape.',
    'Find missing lengths from aligned edges. Add or subtract the piece areas without overlaps.');
  if (f === 'circle-radius' || f === 'circle-diameter') return guide('Connect radius and diameter',
    'A radius goes from the center to the circle. A diameter goes across the circle through the center.',
    'The diameter is twice the radius.');
  if (f === 'circle-circumference') return guide('Find the distance around a circle',
    'Use circumference = π × diameter, or twice π × radius.',
    'Use the value of π requested in the problem and ordinary length units.');
  if (f === 'circle-area') return guide('Find circle area',
    'Find the radius first; halve the diameter if needed.',
    'Use area = π × radius squared, with the requested value of π.');
  if (f === 'circle-reverse') return guide('Reverse a circle formula',
    'Start with circumference = π × diameter.',
    'Undo the multiplication to find the diameter, then use the radius–diameter relationship.');
  if (f === 'circle-area-from-circumference') return guide('Connect circumference and area',
    'Use the circumference to find the diameter and then the radius.',
    'Use that radius in the circle-area formula. Keep intermediate values as exact as possible.');
  if (/^angle-/.test(f)) return guide('Use angle relationships',
    'Vertical angles are equal. Complementary angles total a right angle, and supplementary angles total a straight angle.',
    'Choose the relationship shown in the drawing. If angles are expressions, write and solve an equation.');
  if (f === 'triangle-inequality') return guide('Test three side lengths',
    'Compare the sum of the two shorter lengths with the longest length.',
    'The shorter lengths must add to strictly more than the longest length to close a triangle.');
  if (f === 'triangle-conditions') return guide('Think about what side lengths fix',
    'First check whether the side lengths can form a triangle.',
    'Consider whether those fixed lengths allow a different shape after rotations or reflections.');
  if (f === 'triangle-angle-conditions') return guide('Think about angles and size',
    'Check that the three angle measures can form a triangle.',
    'Consider what happens to the angle measures when a triangle is enlarged or reduced.');
  if (f === 'triangle-construction') return guide('Construct from the given conditions',
    'Keep the given base fixed and use the required distances to locate the remaining vertex.',
    'Check the grid scale, side lengths, and which side of the base the vertex must lie on.');
  if (f === 'scale-length') return guide('Scale lengths consistently',
    'Multiply every original length by the same scale factor.',
    'To work backward, divide by the scale factor.');
  if (f === 'scale-area') return guide('Connect length scale and area scale',
    'Multiply each coordinate or length measured from the stated reference point by the scale factor.',
    'Area changes by the square of the length scale factor.');
  if (f === 'net-faces') return guide('Follow the net as it folds',
    'Count each face once. Edges that meet after folding represent one edge of the solid.',
    'Count the corners of the folded solid, not every corner drawn separately in the flat net.');
  if (f === 'net-surface') return guide('Add the faces in a net',
    'Identify each rectangle or triangle and calculate its area.',
    'Add every face exactly once and use square units.');
  if (/pyramid-(?:lateral|surface)$/.test(f)) return guide('Add pyramid face areas',
    'Each side face is a triangle. Use its base edge and its perpendicular face height.',
    'Lateral area includes only side faces. Total surface area also includes the base.');
  if (f === 'composite-prism-surface') return guide('Count only exposed prism surfaces',
    'Find the areas of the two end faces and the rectangles around the outside boundary.',
    'Do not count faces hidden inside the solid. Total surface area uses square units.');
  if (/prism-(?:lateral|surface)$/.test(f)) return guide('Find prism surface area',
    'Lateral area is the perimeter of the base multiplied by the prism length.',
    'For total surface area, also add the areas of both bases.');
  if (f === 'volume-count') return guide('Count cubic units',
    'Count the cubes in one layer and the number of equal layers.',
    'Combine partial cubes when needed. Volume uses cubic units.');
  if (/prism-volume$/.test(f)) return guide('Use base area and prism length',
    'Find the area of one end face. Split an irregular end face into simple shapes when needed.',
    'Multiply that area by the perpendicular prism length and use cubic units.');
  if (f === 'prism-height') return guide('Find a missing prism height',
    'Use volume = base area × perpendicular height.',
    'Calculate the base area, then divide the volume by that area.');
  if (f === 'cross-section') return guide('Read a cross section',
    'Imagine the flat shape where the cutting plane passes through the solid.',
    'Count the edges of the cut itself. A slice parallel to a prism’s base has the base’s shape.');
  return guide('Plan and check',
    'Identify the quantity or relationship the question asks for.',
    'Use the method and worked example for this topic, then check signs, units, and whether your result is reasonable.');
}
