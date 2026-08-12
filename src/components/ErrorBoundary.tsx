import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../theme/DesignSystem';
import { errorLoggingService } from '../services/errorLoggingService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log to error logging service
    errorLoggingService.logComponentError(
      error,
      errorInfo,
      this.props.componentName || 'ErrorBoundary'
    );
    
    // Also log to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleViewErrorDetails = () => {
    const errorDetails = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
    };
    console.log('Error Details:', JSON.stringify(errorDetails, null, 2));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>🕊️</Text>
          {/* This is the one screen a user reaches at their most frustrated,
              so it does not get boilerplate. "Something went wrong / We
              apologize for the inconvenience" is the default every template
              ships with: passive about whose fault it is, and it gives the
              user nothing to do. Name it, own it, hand them one action. */}
          <Text style={styles.title}>Sakina stopped unexpectedly</Text>
          <Text style={styles.message}>
            This one is on us, not on you. Close the app and open it again.
          </Text>
          
          {__DEV__ && this.state.error && (
            <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorScrollContent}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorDetail}>{this.state.error.toString()}</Text>
              
              {this.state.error.stack && (
                <>
                  <Text style={styles.errorSubtitle}>Stack Trace:</Text>
                  <Text style={styles.errorStack}>{this.state.error.stack}</Text>
                </>
              )}
              
              {this.state.errorInfo?.componentStack && (
                <>
                  <Text style={styles.errorSubtitle}>Component Stack:</Text>
                  <Text style={styles.errorStack}>{this.state.errorInfo.componentStack}</Text>
                </>
              )}
            </ScrollView>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={this.handleViewErrorDetails}
                accessibilityRole="button"
                accessibilityLabel="Log error details"
              >
                <Text style={styles.detailsText}>Log Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorScroll: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 24,
  },
  errorScrollContent: {
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 12,
    color: 'rgba(255, 107, 107, 0.7)',
    textAlign: 'left',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  errorSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    marginBottom: 4,
  },
  errorStack: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background.primary,
  },
  detailsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  detailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default ErrorBoundary;
