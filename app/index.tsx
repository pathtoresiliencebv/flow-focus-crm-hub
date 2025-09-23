import React from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Import the web version on web platform
if (Platform.OS === 'web') {
  // Re-export the web App component
  const WebApp = require('../src/App').default;
  export default WebApp;
} else {
  // Native mobile implementation
  import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
  import { StatusBar } from 'expo-status-bar';
  
  export default function HomeScreen() {
    return (
      <ScrollView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <Text style={styles.title}>Smans CRM</Text>
          <Text style={styles.subtitle}>Mobiele App</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/quotes')}
          >
            <Text style={styles.buttonText}>Offertes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/invoices')}
          >
            <Text style={styles.buttonText}>Facturen</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.buttonText}>Instellingen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    header: {
      padding: 24,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#6b7280',
    },
    buttonContainer: {
      padding: 24,
      gap: 16,
    },
    button: {
      backgroundColor: '#3b82f6',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
    },
  });
}