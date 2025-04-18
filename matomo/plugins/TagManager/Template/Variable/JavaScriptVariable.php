<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\TagManager\Template\Variable;

use Piwik\Piwik;
use Piwik\Settings\FieldConfig;
use Piwik\Validators\CharacterLength;
use Piwik\Validators\NotEmpty;

class JavaScriptVariable extends BaseVariable
{
    public function getCategory()
    {
        return self::CATEGORY_PAGE_VARIABLES;
    }

    public function getParameters()
    {
        return array(
            $this->makeSetting('variableName', '', FieldConfig::TYPE_STRING, function (FieldConfig $field) {
                $field->title = Piwik::translate('TagManager_JavaScriptVariableNameTitle');
                $field->description = Piwik::translate('TagManager_JavaScriptVariableNameDescription');
                $field->uiControlAttributes = ['placeholder' => Piwik::translate('TagManager_JavaScriptVariableNamePlaceholder')];
                $field->validators[] = new NotEmpty();
                $field->validators[] = new CharacterLength(1, 500);
                $field->transform = function ($value) {
                    return trim($value);
                };
            }),
        );
    }
}
