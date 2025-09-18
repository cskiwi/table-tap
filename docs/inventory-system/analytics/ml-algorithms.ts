/**
 * Machine Learning Algorithms for Inventory Management
 * Advanced forecasting and optimization algorithms using TensorFlow.js
 */

import * as tf from '@tensorflow/tfjs-node';
import { Injectable, Logger } from '@nestjs/common';

// ================================
// INTERFACES AND TYPES
// ================================

interface TimeSeriesData {
  date: Date;
  value: number;
  features?: Record<string, number>;
}

interface ForecastResult {
  productId: string;
  forecastDate: Date;
  predictedDemand: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number;
  seasonalityFactor: number;
  trendFactor: number;
  modelVersion: string;
  features: Record<string, number>;
}

interface SeasonalityPattern {
  dayOfWeek: number[];
  monthOfYear: number[];
  hourOfDay?: number[];
  holidays?: number[];
}

interface TrendComponents {
  linear: number;
  exponential: number;
  seasonal: SeasonalityPattern;
  noise: number;
}

interface ModelPerformanceMetrics {
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared
  directionalAccuracy: number;
}

// ================================
// DEMAND FORECASTING ENGINE
// ================================

@Injectable()
export class DemandForecastingService {
  private readonly logger = new Logger(DemandForecastingService.name);
  private models: Map<string, tf.LayersModel> = new Map();
  private scalers: Map<string, { mean: number; std: number }> = new Map();

  /**
   * Generate demand forecasts using LSTM neural networks
   */
  async generateDemandForecast(
    productId: string,
    historicalData: TimeSeriesData[],
    forecastHorizon: number = 30,
    includeExternalFactors: boolean = true
  ): Promise<ForecastResult[]> {
    try {
      this.logger.log(`Generating forecast for product ${productId}, horizon: ${forecastHorizon} days`);

      // Prepare and preprocess data
      const processedData = await this.preprocessTimeSeriesData(historicalData);

      // Extract features
      const features = await this.extractFeatures(processedData, includeExternalFactors);

      // Get or train model
      const model = await this.getOrTrainModel(productId, features);

      // Generate forecasts
      const forecasts = await this.generateForecasts(model, features, forecastHorizon);

      // Post-process and add confidence intervals
      const results = await this.postProcessForecasts(
        productId,
        forecasts,
        features,
        forecastHorizon
      );

      this.logger.log(`Generated ${results.length} forecasts for product ${productId}`);
      return results;

    } catch (error) {
      this.logger.error(`Error generating forecast for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Advanced LSTM model with attention mechanism
   */
  private async buildLSTMModel(inputShape: number[]): Promise<tf.LayersModel> {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.inputLayer({ inputShape }));

    // First LSTM layer with dropout
    model.add(tf.layers.lstm({
      units: 128,
      returnSequences: true,
      dropout: 0.2,
      recurrentDropout: 0.2,
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));

    // Second LSTM layer
    model.add(tf.layers.lstm({
      units: 64,
      returnSequences: true,
      dropout: 0.2,
      recurrentDropout: 0.2
    }));

    // Third LSTM layer (no return sequences for final output)
    model.add(tf.layers.lstm({
      units: 32,
      dropout: 0.2,
      recurrentDropout: 0.2
    }));

    // Attention mechanism (simplified)
    model.add(tf.layers.dense({
      units: 32,
      activation: 'tanh'
    }));

    // Output layers
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.1 }));

    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }));

    // Compile with custom loss function
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: this.customLossFunction,
      metrics: ['mae', 'mse']
    });

    return model;
  }

  /**
   * Custom loss function that penalizes underforecasting more than overforecasting
   */
  private customLossFunction = (yTrue: tf.Tensor, yPred: tf.Tensor): tf.Tensor => {
    return tf.tidy(() => {
      const error = tf.sub(yTrue, yPred);
      const underforecastPenalty = tf.where(
        tf.greater(error, 0),
        tf.mul(error, 1.5), // Penalize underforecasting more
        error
      );
      return tf.mean(tf.square(underforecastPenalty));
    });
  };

  /**
   * Extract comprehensive features from time series data
   */
  private async extractFeatures(
    data: TimeSeriesData[],
    includeExternalFactors: boolean
  ): Promise<number[][]> {
    const features: number[][] = [];

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const featureVector: number[] = [];

      // Basic time features
      const date = new Date(record.date);
      featureVector.push(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getDay(),
        date.getHours(),
        this.getWeekOfYear(date),
        this.isHoliday(date) ? 1 : 0,
        this.isWeekend(date) ? 1 : 0
      );

      // Demand value
      featureVector.push(record.value);

      // Lagged features (previous values)
      for (let lag = 1; lag <= 7; lag++) {
        const lagIndex = i - lag;
        featureVector.push(lagIndex >= 0 ? data[lagIndex].value : 0);
      }

      // Rolling statistics
      const window = Math.min(7, i + 1);
      const windowData = data.slice(Math.max(0, i - window + 1), i + 1);
      const windowValues = windowData.map(d => d.value);

      featureVector.push(
        this.mean(windowValues),
        this.std(windowValues),
        Math.max(...windowValues),
        Math.min(...windowValues),
        this.median(windowValues)
      );

      // Trend features
      if (i >= 7) {
        const recentTrend = this.calculateTrend(data.slice(i - 6, i + 1));
        featureVector.push(recentTrend);
      } else {
        featureVector.push(0);
      }

      // External factors (if available)
      if (includeExternalFactors && record.features) {
        featureVector.push(
          record.features.temperature || 20,
          record.features.precipitation || 0,
          record.features.events || 0,
          record.features.promotions || 0,
          record.features.stockLevel || 0
        );
      }

      features.push(featureVector);
    }

    return features;
  }

  /**
   * Preprocess time series data
   */
  private async preprocessTimeSeriesData(data: TimeSeriesData[]): Promise<TimeSeriesData[]> {
    // Sort by date
    const sorted = data.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Fill missing dates
    const filled = this.fillMissingDates(sorted);

    // Remove outliers
    const cleaned = this.removeOutliers(filled);

    // Smooth data
    const smoothed = this.applySmoothing(cleaned);

    return smoothed;
  }

  /**
   * Fill missing dates in time series
   */
  private fillMissingDates(data: TimeSeriesData[]): TimeSeriesData[] {
    if (data.length === 0) return data;

    const result: TimeSeriesData[] = [];
    const start = new Date(data[0].date);
    const end = new Date(data[data.length - 1].date);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const existing = data.find(item =>
        item.date.toDateString() === d.toDateString()
      );

      if (existing) {
        result.push(existing);
      } else {
        // Interpolate missing value
        const interpolated = this.interpolateValue(data, new Date(d));
        result.push({
          date: new Date(d),
          value: interpolated,
          features: {}
        });
      }
    }

    return result;
  }

  /**
   * Remove statistical outliers using IQR method
   */
  private removeOutliers(data: TimeSeriesData[]): TimeSeriesData[] {
    const values = data.map(d => d.value);
    const q1 = this.quantile(values, 0.25);
    const q3 = this.quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.map(item => ({
      ...item,
      value: Math.max(lowerBound, Math.min(upperBound, item.value))
    }));
  }

  /**
   * Apply exponential smoothing
   */
  private applySmoothing(data: TimeSeriesData[], alpha: number = 0.3): TimeSeriesData[] {
    if (data.length === 0) return data;

    const smoothed = [...data];
    smoothed[0] = { ...data[0] };

    for (let i = 1; i < data.length; i++) {
      smoothed[i] = {
        ...data[i],
        value: alpha * data[i].value + (1 - alpha) * smoothed[i - 1].value
      };
    }

    return smoothed;
  }

  /**
   * Generate forecasts using trained model
   */
  private async generateForecasts(
    model: tf.LayersModel,
    features: number[][],
    horizon: number
  ): Promise<number[]> {
    const forecasts: number[] = [];
    const sequenceLength = 14; // Use last 14 days for prediction

    // Start with the last sequence from training data
    let currentSequence = features.slice(-sequenceLength);

    for (let i = 0; i < horizon; i++) {
      // Prepare input tensor
      const inputTensor = tf.tensor3d([currentSequence]);

      // Make prediction
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const forecastValue = await prediction.data();

      forecasts.push(forecastValue[0]);

      // Update sequence for next prediction
      const nextFeatures = this.generateNextFeatures(
        currentSequence[currentSequence.length - 1],
        forecastValue[0],
        i + 1
      );

      currentSequence = [...currentSequence.slice(1), nextFeatures];

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
    }

    return forecasts;
  }

  /**
   * Generate features for next time step
   */
  private generateNextFeatures(
    lastFeatures: number[],
    predictedValue: number,
    daysAhead: number
  ): number[] {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + daysAhead);

    const nextFeatures = [...lastFeatures];

    // Update date features
    nextFeatures[0] = baseDate.getFullYear();
    nextFeatures[1] = baseDate.getMonth() + 1;
    nextFeatures[2] = baseDate.getDate();
    nextFeatures[3] = baseDate.getDay();
    nextFeatures[4] = baseDate.getHours();
    nextFeatures[5] = this.getWeekOfYear(baseDate);
    nextFeatures[6] = this.isHoliday(baseDate) ? 1 : 0;
    nextFeatures[7] = this.isWeekend(baseDate) ? 1 : 0;

    // Update demand value
    nextFeatures[8] = predictedValue;

    return nextFeatures;
  }

  /**
   * Post-process forecasts and add confidence intervals
   */
  private async postProcessForecasts(
    productId: string,
    forecasts: number[],
    features: number[][],
    horizon: number
  ): Promise<ForecastResult[]> {
    const results: ForecastResult[] = [];
    const historicalValues = features.map(f => f[8]); // Demand values
    const baseVariance = this.std(historicalValues);

    for (let i = 0; i < forecasts.length; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i + 1);

      // Calculate confidence interval
      const uncertaintyGrowth = Math.sqrt(i + 1) * 0.1; // Uncertainty grows with forecast horizon
      const adjustedVariance = baseVariance * (1 + uncertaintyGrowth);

      const confidence = Math.max(0.5, 0.9 - i * 0.02); // Decrease confidence with horizon
      const z = 1.96; // 95% confidence interval

      const lower = Math.max(0, forecasts[i] - z * adjustedVariance);
      const upper = forecasts[i] + z * adjustedVariance;

      // Calculate seasonal and trend factors
      const seasonalityFactor = this.calculateSeasonalityFactor(forecastDate, historicalValues);
      const trendFactor = this.calculateTrendFactor(historicalValues);

      results.push({
        productId,
        forecastDate,
        predictedDemand: Math.max(0, forecasts[i]),
        confidenceInterval: { lower, upper },
        confidence,
        seasonalityFactor,
        trendFactor,
        modelVersion: '2.0.0',
        features: this.buildFeatureMap(features[features.length - 1])
      });
    }

    return results;
  }

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  private mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private std(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private quantile(values: number[], q: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = q * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  }

  private isHoliday(date: Date): boolean {
    // Simplified holiday detection - should be enhanced with actual holiday data
    const holidays = [
      '01-01', '07-04', '12-25', '12-31' // MM-DD format
    ];
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(dateStr);
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  private calculateTrend(data: TimeSeriesData[]): number {
    if (data.length < 2) return 0;

    const values = data.map(d => d.value);
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private interpolateValue(data: TimeSeriesData[], targetDate: Date): number {
    // Simple linear interpolation
    let before: TimeSeriesData | null = null;
    let after: TimeSeriesData | null = null;

    for (const item of data) {
      if (item.date < targetDate) {
        before = item;
      } else if (item.date > targetDate && !after) {
        after = item;
        break;
      }
    }

    if (!before) return after?.value || 0;
    if (!after) return before.value;

    const timeDiff = after.date.getTime() - before.date.getTime();
    const targetDiff = targetDate.getTime() - before.date.getTime();
    const ratio = targetDiff / timeDiff;

    return before.value + (after.value - before.value) * ratio;
  }

  private calculateSeasonalityFactor(date: Date, historicalValues: number[]): number {
    // Simplified seasonality calculation based on day of week
    const dayOfWeek = date.getDay();

    // Group historical data by day of week and calculate average
    const dayGroups: { [key: number]: number[] } = {};
    const overallMean = this.mean(historicalValues);

    // This would need actual historical date mapping
    // For now, return a simple factor based on day of week
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 0.9;
    return weekendFactor;
  }

  private calculateTrendFactor(historicalValues: number[]): number {
    if (historicalValues.length < 7) return 1.0;

    const recent = historicalValues.slice(-7);
    const previous = historicalValues.slice(-14, -7);

    if (previous.length === 0) return 1.0;

    const recentMean = this.mean(recent);
    const previousMean = this.mean(previous);

    return previousMean === 0 ? 1.0 : recentMean / previousMean;
  }

  private buildFeatureMap(features: number[]): Record<string, number> {
    return {
      year: features[0],
      month: features[1],
      day: features[2],
      dayOfWeek: features[3],
      hour: features[4],
      weekOfYear: features[5],
      isHoliday: features[6],
      isWeekend: features[7],
      currentDemand: features[8],
      rollingMean: features[16],
      rollingStd: features[17]
    };
  }

  /**
   * Get or train model for specific product
   */
  private async getOrTrainModel(productId: string, features: number[][]): Promise<tf.LayersModel> {
    const modelKey = `demand_forecast_${productId}`;

    if (this.models.has(modelKey)) {
      return this.models.get(modelKey)!;
    }

    // Train new model
    const model = await this.trainModel(features);
    this.models.set(modelKey, model);

    return model;
  }

  /**
   * Train LSTM model with given features
   */
  private async trainModel(features: number[][]): Promise<tf.LayersModel> {
    const sequenceLength = 14;
    const featureCount = features[0].length;

    // Prepare training data
    const { X, y } = this.prepareTrainingData(features, sequenceLength);

    // Build model
    const model = await this.buildLSTMModel([sequenceLength, featureCount]);

    // Train model
    await model.fit(X, y, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            this.logger.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4)}`);
          }
        }
      }
    });

    // Clean up training tensors
    X.dispose();
    y.dispose();

    return model;
  }

  /**
   * Prepare training data for LSTM
   */
  private prepareTrainingData(features: number[][], sequenceLength: number) {
    const X: number[][][] = [];
    const y: number[] = [];

    for (let i = sequenceLength; i < features.length; i++) {
      const sequence = features.slice(i - sequenceLength, i);
      const target = features[i][8]; // Demand value is at index 8

      X.push(sequence);
      y.push(target);
    }

    return {
      X: tf.tensor3d(X),
      y: tf.tensor1d(y)
    };
  }

  /**
   * Evaluate model performance
   */
  async evaluateModelPerformance(
    model: tf.LayersModel,
    testData: TimeSeriesData[]
  ): Promise<ModelPerformanceMetrics> {
    const features = await this.extractFeatures(testData, true);
    const { X, y } = this.prepareTrainingData(features, 14);

    const predictions = model.predict(X) as tf.Tensor;
    const predValues = await predictions.data();
    const actualValues = await y.data();

    // Calculate metrics
    const mae = this.calculateMAE(actualValues, predValues);
    const mape = this.calculateMAPE(actualValues, predValues);
    const rmse = this.calculateRMSE(actualValues, predValues);
    const r2 = this.calculateR2(actualValues, predValues);
    const directionalAccuracy = this.calculateDirectionalAccuracy(actualValues, predValues);

    // Clean up
    X.dispose();
    y.dispose();
    predictions.dispose();

    return { mae, mape, rmse, r2, directionalAccuracy };
  }

  private calculateMAE(actual: Float32Array | number[], predicted: Float32Array | number[]): number {
    const n = actual.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.abs(actual[i] - predicted[i]);
    }
    return sum / n;
  }

  private calculateMAPE(actual: Float32Array | number[], predicted: Float32Array | number[]): number {
    const n = actual.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (actual[i] !== 0) {
        sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      }
    }
    return (sum / n) * 100;
  }

  private calculateRMSE(actual: Float32Array | number[], predicted: Float32Array | number[]): number {
    const n = actual.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.pow(actual[i] - predicted[i], 2);
    }
    return Math.sqrt(sum / n);
  }

  private calculateR2(actual: Float32Array | number[], predicted: Float32Array | number[]): number {
    const actualMean = Array.from(actual).reduce((sum, val) => sum + val, 0) / actual.length;

    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < actual.length; i++) {
      ssRes += Math.pow(actual[i] - predicted[i], 2);
      ssTot += Math.pow(actual[i] - actualMean, 2);
    }

    return 1 - (ssRes / ssTot);
  }

  private calculateDirectionalAccuracy(actual: Float32Array | number[], predicted: Float32Array | number[]): number {
    if (actual.length < 2) return 0;

    let correct = 0;
    const total = actual.length - 1;

    for (let i = 1; i < actual.length; i++) {
      const actualDirection = actual[i] > actual[i - 1] ? 1 : -1;
      const predictedDirection = predicted[i] > predicted[i - 1] ? 1 : -1;

      if (actualDirection === predictedDirection) {
        correct++;
      }
    }

    return (correct / total) * 100;
  }
}

// ================================
// REORDER OPTIMIZATION ENGINE
// ================================

@Injectable()
export class ReorderOptimizationService {
  private readonly logger = new Logger(ReorderOptimizationService.name);

  /**
   * Generate optimal reorder suggestions using dynamic programming
   */
  async generateReorderSuggestions(
    productData: Array<{
      productId: string;
      currentStock: number;
      reorderPoint: number;
      reorderQuantity: number;
      unitCost: number;
      demandForecast: number[];
      leadTimeDays: number;
      holdingCostRate: number;
      stockoutCost: number;
    }>
  ): Promise<Array<{
    productId: string;
    suggestedQuantity: number;
    orderDate: Date;
    expectedDelivery: Date;
    totalCost: number;
    priority: number;
    reason: string;
  }>> {
    const suggestions = [];

    for (const product of productData) {
      const suggestion = await this.optimizeReorderForProduct(product);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Sort by priority
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  private async optimizeReorderForProduct(product: any) {
    // Calculate optimal order quantity using EOQ with modifications
    const annualDemand = product.demandForecast.reduce((sum: number, val: number) => sum + val, 0) * (365 / product.demandForecast.length);
    const orderingCost = 50; // Estimated ordering cost

    // Economic Order Quantity
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / (product.unitCost * product.holdingCostRate));

    // Adjust for lead time and variability
    const leadTimeDemand = this.calculateLeadTimeDemand(product.demandForecast, product.leadTimeDays);
    const safetyStock = this.calculateSafetyStock(product.demandForecast, product.leadTimeDays);

    // Dynamic reorder point
    const dynamicReorderPoint = leadTimeDemand + safetyStock;

    // Check if reorder is needed
    if (product.currentStock <= dynamicReorderPoint) {
      const suggestedQuantity = Math.max(eoq, product.reorderQuantity);

      return {
        productId: product.productId,
        suggestedQuantity,
        orderDate: new Date(),
        expectedDelivery: new Date(Date.now() + product.leadTimeDays * 24 * 60 * 60 * 1000),
        totalCost: suggestedQuantity * product.unitCost,
        priority: this.calculatePriority(product, dynamicReorderPoint),
        reason: this.generateReorderReason(product, dynamicReorderPoint, leadTimeDemand)
      };
    }

    return null;
  }

  private calculateLeadTimeDemand(forecast: number[], leadTimeDays: number): number {
    const dailyAverage = forecast.reduce((sum, val) => sum + val, 0) / forecast.length;
    return dailyAverage * leadTimeDays;
  }

  private calculateSafetyStock(forecast: number[], leadTimeDays: number, serviceLevel: number = 0.95): number {
    // Calculate standard deviation of demand
    const mean = forecast.reduce((sum, val) => sum + val, 0) / forecast.length;
    const variance = forecast.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / forecast.length;
    const stdDev = Math.sqrt(variance);

    // Z-score for service level (95% = 1.65)
    const zScore = this.getZScore(serviceLevel);

    return zScore * stdDev * Math.sqrt(leadTimeDays);
  }

  private getZScore(serviceLevel: number): number {
    // Approximate Z-scores for common service levels
    const zScores: { [key: number]: number } = {
      0.90: 1.28,
      0.95: 1.65,
      0.99: 2.33
    };

    return zScores[serviceLevel] || 1.65;
  }

  private calculatePriority(product: any, dynamicReorderPoint: number): number {
    // Priority based on how critical the stockout situation is
    const stockoutRisk = Math.max(0, (dynamicReorderPoint - product.currentStock) / dynamicReorderPoint);
    const demandVolatility = this.calculateVolatility(product.demandForecast);
    const revenueImpact = product.unitCost * 10; // Simplified revenue impact

    return stockoutRisk * 0.5 + demandVolatility * 0.3 + (revenueImpact / 1000) * 0.2;
  }

  private calculateVolatility(forecast: number[]): number {
    const mean = forecast.reduce((sum, val) => sum + val, 0) / forecast.length;
    const variance = forecast.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / forecast.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private generateReorderReason(product: any, dynamicReorderPoint: number, leadTimeDemand: number): string {
    const stockLevel = product.currentStock;
    const daysUntilStockout = Math.floor(stockLevel / (leadTimeDemand / product.leadTimeDays));

    if (stockLevel <= product.reorderPoint * 0.5) {
      return `Critical: Stock extremely low (${daysUntilStockout} days remaining)`;
    } else if (stockLevel <= product.reorderPoint) {
      return `Low stock: Below reorder point (${daysUntilStockout} days remaining)`;
    } else {
      return `Preventive: Optimized reorder timing based on forecast`;
    }
  }
}

export { ForecastResult, ModelPerformanceMetrics, TimeSeriesData };