import React, { useMemo } from 'react';
import { Field, PanelProps } from '@grafana/data';
import { TooltipDisplayMode } from '@grafana/schema';
import { usePanelContext, TimeSeries, TooltipPlugin, ZoomPlugin } from '@grafana/ui';
import { getFieldLinksForExplore } from 'app/features/explore/utils/links';
import { AnnotationsPlugin } from './plugins/AnnotationsPlugin';
import { ContextMenuPlugin } from './plugins/ContextMenuPlugin';
import { ExemplarsPlugin } from './plugins/ExemplarsPlugin';
import { TimeSeriesOptions } from './types';
import { prepareGraphableFields } from './utils';
import { AnnotationEditorPlugin } from './plugins/AnnotationEditorPlugin';
import { ThresholdControlsPlugin } from './plugins/ThresholdControlsPlugin';
import { config } from 'app/core/config';
import { PanelDataErrorView } from '@grafana/runtime';

interface TimeSeriesPanelProps extends PanelProps<TimeSeriesOptions> {}

export const TimeSeriesPanel: React.FC<TimeSeriesPanelProps> = ({
  data,
  timeRange,
  timeZone,
  width,
  height,
  options,
  fieldConfig,
  onChangeTimeRange,
  replaceVariables,
  id,
}) => {
  const { sync, canAddAnnotations, onThresholdsChange, canEditThresholds, onSplitOpen } = usePanelContext();

  const getFieldLinks = (field: Field, rowIndex: number) => {
    return getFieldLinksForExplore({ field, rowIndex, splitOpenFn: onSplitOpen, range: timeRange });
  };

  const { frames, message } = useMemo(() => prepareGraphableFields(data, config.theme2), [data]);

  if (!frames) {
    return <PanelDataErrorView panelId={id} data={data} message={message} needsTimeSeries={true} />;
  }

  const enableAnnotationCreation = Boolean(canAddAnnotations && canAddAnnotations());

  return (
    <TimeSeries
      frames={frames}
      structureRev={data.structureRev}
      timeRange={timeRange}
      timeZone={timeZone}
      width={width}
      height={height}
      legend={options.legend}
    >
      {(config, alignedDataFrame) => {
        return (
          <>
            <ZoomPlugin config={config} onZoom={onChangeTimeRange} />
            {options.tooltip.mode === TooltipDisplayMode.None || (
              <TooltipPlugin
                data={alignedDataFrame}
                config={config}
                mode={options.tooltip.mode}
                sync={sync}
                timeZone={timeZone}
              />
            )}
            {/* Renders annotation markers*/}
            {data.annotations && (
              <AnnotationsPlugin annotations={data.annotations} config={config} timeZone={timeZone} />
            )}
            {/* Enables annotations creation*/}
            <AnnotationEditorPlugin data={alignedDataFrame} timeZone={timeZone} config={config}>
              {({ startAnnotating }) => {
                return (
                  <ContextMenuPlugin
                    data={alignedDataFrame}
                    config={config}
                    timeZone={timeZone}
                    replaceVariables={replaceVariables}
                    defaultItems={
                      enableAnnotationCreation
                        ? [
                            {
                              items: [
                                {
                                  label: 'Add annotation',
                                  ariaLabel: 'Add annotation',
                                  icon: 'comment-alt',
                                  onClick: (e, p) => {
                                    if (!p) {
                                      return;
                                    }
                                    startAnnotating({ coords: p.coords });
                                  },
                                },
                              ],
                            },
                          ]
                        : []
                    }
                  />
                );
              }}
            </AnnotationEditorPlugin>
            {data.annotations && (
              <ExemplarsPlugin
                config={config}
                exemplars={data.annotations}
                timeZone={timeZone}
                getFieldLinks={getFieldLinks}
              />
            )}

            {canEditThresholds && onThresholdsChange && (
              <ThresholdControlsPlugin
                config={config}
                fieldConfig={fieldConfig}
                onThresholdsChange={onThresholdsChange}
              />
            )}
          </>
        );
      }}
    </TimeSeries>
  );
};
