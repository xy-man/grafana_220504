/**
 * See also:
 * https://github.com/grafana/grafana-plugin-sdk-go/blob/main/data/frame_type.go
 *
 * @public
 */
export enum DataFrameType {
  TimeSeriesWide = 'timeseries-wide',
  TimeSeriesLong = 'timeseries-long',
  TimeSeriesMany = 'timeseries-many',

  /** Directory listing */
  DirectoryListing = 'directory-listing',

  /**
   * First field is X, the rest are ordinal values used as rows in the heatmap
   */
  HeatmapRows = 'heatmap-rows',

  /**
   * Explicit fields for:
   *  xMin, yMin, count, ...
   *
   * All values in the grid exist and have regular spacing
   *
   * If the y value is actually ordinal, use `meta.custom` to specify the bucket lookup values
   */
  HeatmapCells = 'heatmap-cells',

  /**
   *  WIP sparse heatmap support
   *
   *  @private
   */
  HeatmapSparse = 'heatmap-cells-sparse',
}
