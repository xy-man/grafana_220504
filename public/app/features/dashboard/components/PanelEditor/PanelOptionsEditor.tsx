import React, { useMemo } from 'react';
import {
  DataFrame,
  InterpolateFunction,
  PanelOptionsEditorItem,
  PanelPlugin,
  StandardEditorContext,
  VariableSuggestionsScope,
} from '@grafana/data';
import { get as lodashGet, set as lodashSet } from 'lodash';
import { Field, Label } from '@grafana/ui';
import groupBy from 'lodash/groupBy';
import { OptionsGroup } from './OptionsGroup';
import { getTemplateSrv } from '@grafana/runtime';

interface PanelOptionsEditorProps<TOptions> {
  plugin: PanelPlugin;
  data?: DataFrame[];
  replaceVariables: InterpolateFunction;
  options: TOptions;
  onChange: (options: TOptions) => void;
}

export const PanelOptionsEditor: React.FC<PanelOptionsEditorProps<any>> = ({
  plugin,
  options,
  onChange,
  data,
  replaceVariables,
}) => {
  const optionEditors = useMemo<Record<string, PanelOptionsEditorItem[]>>(() => {
    return groupBy(plugin.optionEditors.list(), i => {
      return i.category ? i.category[0] : 'Display';
    });
  }, [plugin]);

  const onOptionChange = (key: string, value: any) => {
    const newOptions = lodashSet({ ...options }, key, value);
    onChange(newOptions);
  };

  const context: StandardEditorContext<any> = {
    data: data || [],
    replaceVariables,
    options,
  };
  return (
    <>
      {Object.keys(optionEditors).map((c, i) => {
        const optionsToShow = optionEditors[c]
          .map((e, j) => {
            if (e.showIf && !e.showIf(options)) {
              return null;
            }

            const label = (
              <Label description={e.description} category={e.category?.slice(1)}>
                {e.name}
              </Label>
            );
            return (
              <Field label={label} key={`${e.id}/${j}`}>
                <e.editor
                  value={lodashGet(options, e.path)}
                  onChange={value => onOptionChange(e.path, value)}
                  item={e}
                  context={{
                    ...context,
                    getSuggestions: (scope?: VariableSuggestionsScope) => {
                      if (e.settings?.getSuggestions) {
                        return e.settings.getSuggestions(
                          plugin,
                          data,
                          getTemplateSrv().getVariables.bind(getTemplateSrv()),
                          scope
                        );
                      }

                      return [];
                    },
                  }}
                />
              </Field>
            );
          })
          .filter(e => e !== null);

        return optionsToShow.length > 0 ? (
          <OptionsGroup title={c} defaultToClosed id={`${c}/${i}`} key={`${c}/${i}`}>
            <div>{optionsToShow}</div>
          </OptionsGroup>
        ) : null;
      })}
    </>
  );
};
