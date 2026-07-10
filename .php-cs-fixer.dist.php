<?php

/**
 * PHP CS Fixer config — The Wall Project.
 * Lints and formats all PHP in src/dynamic/ (our own code only — the bundled
 * Matomo installation under matomo/ is excluded).
 */

$finder = (new PhpCsFixer\Finder())
    ->in(__DIR__ . '/src/dynamic')
    ->name('*.php');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12'                      => true,
        'array_syntax'                => ['syntax' => 'short'],
        'declare_strict_types'        => true,
        'no_unused_imports'           => true,
        'ordered_imports'             => ['sort_algorithm' => 'alpha'],
        'single_quote'                => true,
        'trailing_comma_in_multiline' => true,
        'binary_operator_spaces'      => ['default' => 'single_space'],
        'blank_line_after_opening_tag' => true,
        'no_blank_lines_after_phpdoc' => true,
        'no_extra_blank_lines'        => ['tokens' => ['extra']],
        'normalize_index_brace'       => true,
        'whitespace_after_comma_in_array' => true,
        'trim_array_spaces'           => true,
        'method_argument_space'       => ['on_multiline' => 'ensure_fully_multiline'],
    ])
    ->setFinder($finder);
